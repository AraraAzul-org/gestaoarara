import { hojeBR } from "./data";

// Datas de situação são dias civis; por isso a comparação usa o dia de hoje
// no horário de Brasília, e não o dia em UTC do servidor.

function diferenca(inicio: string, fim: string): string | null {
  const [anoIni, mesIni, diaIni] = inicio.split("-").map(Number);
  const [anoFim, mesFim, diaFim] = fim.split("-").map(Number);
  if (!anoIni || !mesIni || !diaIni || !anoFim || !mesFim || !diaFim) return null;

  let anos = anoFim - anoIni;
  let meses = mesFim - mesIni;
  let dias = diaFim - diaIni;

  if (dias < 0) {
    meses -= 1;
    // Último dia do mês anterior ao fim, para completar o mês incompleto.
    dias += new Date(Date.UTC(anoFim, mesFim - 1, 0)).getUTCDate();
  }
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }
  if (anos < 0) return null;

  const plural = (n: number, singular: string, plurais: string) =>
    `${n} ${n === 1 ? singular : plurais}`;

  if (anos > 0) {
    return meses > 0
      ? `${plural(anos, "ano", "anos")} e ${plural(meses, "mês", "meses")}`
      : plural(anos, "ano", "anos");
  }
  if (meses > 0) {
    return dias > 0
      ? `${plural(meses, "mês", "meses")} e ${plural(dias, "dia", "dias")}`
      : plural(meses, "mês", "meses");
  }
  if (dias > 0) return plural(dias, "dia", "dias");
  return "hoje";
}

export function tempoDesde(iso: string | null): string {
  if (!iso) return "—";
  return diferenca(iso.slice(0, 10), hojeBR()) ?? "—";
}

/** Tempo médio entre várias datas civis (aaaa-mm-dd) e hoje, em Brasília. */
export function tempoMedioDesde(datas: (string | null | undefined)[]): string | null {
  const hoje = new Date(`${hojeBR()}T00:00:00Z`).getTime();
  let total = 0;
  let quantidade = 0;
  for (const valor of datas) {
    if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) continue;
    const inicio = new Date(`${valor}T00:00:00Z`).getTime();
    if (!Number.isFinite(inicio) || inicio > hoje) continue;
    total += Math.round((hoje - inicio) / 86_400_000);
    quantidade += 1;
  }
  if (!quantidade) return null;

  const dias = Math.round(total / quantidade);
  if (dias <= 0) return "hoje";

  const anos = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  const diasRestantes = dias % 30;
  const plural = (n: number, singular: string, plurais: string) =>
    `${n} ${n === 1 ? singular : plurais}`;

  if (anos > 0) {
    return meses > 0
      ? `${plural(anos, "ano", "anos")} e ${plural(meses, "mês", "meses")}`
      : plural(anos, "ano", "anos");
  }
  if (meses > 0) {
    return diasRestantes > 0
      ? `${plural(meses, "mês", "meses")} e ${plural(diasRestantes, "dia", "dias")}`
      : plural(meses, "mês", "meses");
  }
  return plural(diasRestantes, "dia", "dias");
}
