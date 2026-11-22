/** Data civil de hoje (aaaa-mm-dd) no horário de Brasília. */
export function hojeBR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Formata uma data civil (aaaa-mm-dd, com ou sem hora) para dd/mm/aaaa. */
export function dataBR(iso?: string | null): string {
  if (!iso) return "—";
  const [ano, mes, dia] = String(iso).slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

/** Formata um instante ISO para dd/mm/aaaa hh:mm no horário de Brasília. */
export function dataHoraBR(iso?: string | null): string {
  if (!iso) return "—";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

/** Confere se o texto é uma data civil ISO válida (aaaa-mm-dd). */
export function dataISOValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

/** Data de filtro: devolve o ISO quando válido, ou null quando vazio/inválido. */
export function dataFiltro(valor?: string | null): string | null {
  if (!valor) return null;
  return dataISOValida(valor) ? valor : null;
}

/** Data opcional de formulário: vazio é aceito; preenchido precisa ser ISO válido. */
export function dataOpcionalValida(valor: string): boolean {
  return !valor || dataISOValida(valor);
}

/** Dias corridos entre uma data (aaaa-mm-dd) e hoje, em Brasília. */
export function diasAte(prazo: string): number {
  const hoje = new Date(`${hojeBR()}T00:00:00Z`).getTime();
  const fim = new Date(`${prazo.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.round((fim - hoje) / 86_400_000);
}
