# Rotina de backup (Dropbox + Supabase, somente nuvem)

## Segredos do repositório

| Segredo | Uso |
|---|---|
| `SUPABASE_DB_URL` | String de conexão direta do Postgres (porta 5432). Usada para o host; a senha pode ficar desatualizada. |
| `SUPABASE_DB_PASSWORD` | **Opcional e preferencial:** somente a senha do banco, em texto puro. Se existir, substitui a senha da URI — sem percent-encoding. |
| `BACKUP_PASSPHRASE` | Senha do GPG AES256. **Sem ela não há restore** — guarde também offline. |
| `DROPBOX_APP_KEY` | App key do app Dropbox (App Folder). |
| `DROPBOX_APP_SECRET` | App secret do mesmo app. |
| `BOOTSTRAP_PAT` | PAT temporário, usado **uma vez** pelo `setup-dropbox.yml` para gravar o refresh token. Apagar depois do setup. |
| `DROPBOX_REFRESH_TOKEN` | Gerado automaticamente pelo setup; renovado a cada execução. |

## Setup (uma vez)

1. Criar app em https://www.dropbox.com/developers/apps → Dropbox API → **App Folder**.
   Nome sugerido: `gestaoarara-backups-2026`.
2. Permissions: `account_info.read`, `files.content.read`, `files.content.write`,
   `files.metadata.read`, `files.metadata.write`, `sharing.read`, `sharing.write`.
3. Copiar App key e App secret para os segredos correspondentes.
4. Criar `BOOTSTRAP_PAT`: PAT clássico com escopo `repo`, ou PAT refinado com
   permissão **Secrets: read and write** neste repositório. É usado uma única vez.
5. Actions → **Setup Dropbox** → Run workflow com `acao=start`; abrir a URL, autorizar e copiar o código.
6. Actions → **Setup Dropbox** → Run workflow com `acao=finish` e o código no campo `codigo`.
7. Apagar o segredo `BOOTSTRAP_PAT`.

## Execução automática

- `backup-diario.yml`: diário às 03:00 UTC (00:00 Brasília) + execução manual.
  Gera `roles.sql`, `schema.sql`, `data.sql`, `migrations.sql` e `manifest.json`,
  compacta, criptografa, valida sha256 e descriptografia antes e depois do upload,
  aplica retenção de 30 dias no Dropbox (mantendo os 3 arquivos mais recentes).
- `restore-mensal.yml`: dia 1º às 04:00 UTC (01:00 Brasília) + execução manual.
  Baixa o backup mais recente, confere sha256, descriptografa, sobe uma stack
  Supabase local em Docker, restaura e compara as contagens do manifest.

## Restauração manual em projeto novo

1. Criar projeto Supabase novo na mesma região (`us-west-2`).
2. Baixar `gestaoarara-AAAA-MM-DD.tar.gz.gpg` e o `.sha256` do Dropbox.
3. Conferir: `echo "<hash>  arquivo.gpg" | sha256sum -c -`.
4. Descriptografar com `gpg --decrypt` e o `BACKUP_PASSPHRASE`.
5. Descompactar e aplicar, na ordem: `roles.sql`, `schema.sql`, `data.sql`, `migrations.sql`.
6. Reimplantar a Edge Function `gerir-acesso`, copiar os 2 arquivos do Storage e
   atualizar URL/chaves no Vercel e os redirects do Supabase Auth.
7. Copiar o Vault root key se houver segredos no Vault (hoje não há).

## Solução de problemas

- `password authentication failed for user "postgres"`: o pooler sempre reporta o
  usuário como `postgres` (ele separa o tenant `postgres.<ref>` internamente), mesmo
  quando o cliente envia o usuário correto. A causa é a **senha** estar errada,
  antiga ou com o placeholder `[YOUR-PASSWORD]`.
  **Forma recomendada de corrigir:** Supabase → Settings → Database →
  **Reset database password**, copie a senha nova mostrada uma única vez e crie/
  atualize o segredo `SUPABASE_DB_PASSWORD` com **somente a senha** (sem URI, sem
  aspas, sem codificar nada). O workflow usa esse segredo e monta a URI sozinho.
  Alternativamente, recopie a URI em Connection string (URI), substitua
  `[YOUR-PASSWORD]` pela senha real e codifique caracteres especiais (`@` → `%40`).
- O passo "Derivar URL IPv4" testa a conexão com cada forma da senha e imprime só
  o tamanho e a fonte (`segredo SUPABASE_DB_PASSWORD` ou `SUPABASE_DB_URL`), nunca
  o valor. Isso ajuda a conferir se o segredo foi colado completo.
- Runners do GitHub Actions não têm IPv6: por isso o backup deriva o session pooler
  `aws-0-us-west-2.pooler.supabase.com:5432` (IPv4) e nunca usa a conexão direta.
