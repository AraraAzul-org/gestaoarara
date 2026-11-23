#!/usr/bin/env bash
# Helper da rotina de backup: chama a API do Dropbox sem rclone e sem máquina local.
# Uso: source .github/scripts/dropbox.sh

set -euo pipefail

dbx_check_env() {
  local nome
  for nome in "$@"; do
    if [[ -z "${!nome:-}" ]]; then
      echo "::error::Segredo/variável ausente: $nome" >&2
      exit 1
    fi
  done
}

# Troca o refresh token por um access token de curta duração.
dbx_token() {
  local resposta token
  resposta="$(curl -fsS --retry 3 --retry-delay 2 -X POST https://api.dropboxapi.com/oauth2/token \
    --data-urlencode 'grant_type=refresh_token' \
    --data-urlencode "refresh_token=${DROPBOX_REFRESH_TOKEN}" \
    --data-urlencode "client_id=${DROPBOX_APP_KEY}" \
    --data-urlencode "client_secret=${DROPBOX_APP_SECRET}")"
  token="$(printf '%s' "$resposta" | jq -r '.access_token // empty')"
  [[ -n "$token" ]] || { echo "::error::Não foi possível obter access token do Dropbox" >&2; exit 1; }
  printf '%s' "$token"
}

dbx_api() {
  local endpoint="$1" payload="$2"
  curl -fsS --retry 3 --retry-delay 2 -X POST "https://api.dropboxapi.com/2/${endpoint}" \
    -H "Authorization: Bearer ${DBX_TOKEN}" \
    -H 'Content-Type: application/json' \
    --data "$payload"
}

dbx_upload() {
  local caminho="$1" arquivo="$2" arg
  arg="$(jq -nc --arg path "$caminho" '{path:$path,mode:"add",autorename:false,mute:false,strict_conflict:false}')"
  curl -fsS --retry 3 --retry-delay 2 -X POST https://content.dropboxapi.com/2/files/upload \
    -H "Authorization: Bearer ${DBX_TOKEN}" \
    -H 'Content-Type: application/octet-stream' \
    -H "Dropbox-API-Arg: ${arg}" \
    --data-binary "@${arquivo}"
}

dbx_download() {
  local caminho="$1" destino="$2" arg
  arg="$(jq -nc --arg path "$caminho" '{path:$path}')"
  curl -fsS --retry 3 --retry-delay 2 -X POST https://content.dropboxapi.com/2/files/download \
    -H "Authorization: Bearer ${DBX_TOKEN}" \
    -H "Dropbox-API-Arg: ${arg}" \
    -o "$destino"
}

dbx_listar() {
  dbx_api 'files/list_folder' '{"path":"","limit":2000}' | jq -c '.entries[] | {name, server_modified, size}'
}

dbx_apagar() {
  local caminho="$1" arg
  arg="$(jq -nc --arg path "$caminho" '{path:$path}')"
  dbx_api 'files/delete_v2' "$arg" >/dev/null
}

# Apaga arquivos com mais de $2 dias, sempre mantendo os $3 mais recentes.
dbx_limpar_antigos() {
  local prefixo="$1" dias="$2" manter="${3:-3}"
  local agora limite contador=0 ts nome epoch
  agora="$(date -u +%s)"
  limite=$(( agora - dias * 86400 ))
  while IFS=$'\t' read -r ts nome; do
    [[ -n "$nome" ]] || continue
    contador=$((contador + 1))
    if (( contador <= manter )); then continue; fi
    epoch="$(date -u -d "$ts" +%s)"
    if (( epoch < limite )); then
      echo "Removendo backup antigo: $nome"
      dbx_apagar "/$nome"
    fi
  done < <(dbx_listar \
    | jq -r --arg p "$prefixo" 'select(.name | startswith($p)) | [.server_modified, .name] | @tsv' \
    | sort -r)
}
