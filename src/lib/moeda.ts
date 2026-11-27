// Reais no padrão brasileiro: o usuário digita reais e a vírgula separa os centavos.
// "15000" vira "R$ 15.000"; ao sair do campo, "R$ 15.000,00".

export function numeroMoeda(valor: string | number | null | undefined): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (valor === null || valor === undefined) return 0;

  const original = String(valor).trim();
  if (!original) return 0;

  // Aceita também "1234.56" quando vier de integração, sem máscara.
  if (!original.includes(",") && /^\d+\.\d{1,2}$/.test(original)) {
    return Number(original);
  }

  const limpo = original
    .replace(/R\$\s*/gi, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : 0;
}

export function casasMoeda(valor: string | number | null | undefined): string {
  return numeroMoeda(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatarReais(valor: string | number | null | undefined): string {
  return `R$ ${casasMoeda(valor)}`;
}

/** Texto para um campo de valor: vazio continua vazio; zero vira "R$ 0,00". */
export function textoMoeda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "string" && !valor.trim()) return "";
  return formatarReais(valor);
}

export function mascararMoeda(valor: string): string {
  const texto = String(valor ?? "");
  const temVirgula = texto.includes(",");
  const partes = texto.replace(/[^\d,]/g, "").split(",");
  const inteiro = (partes.shift() ?? "")
    .replace(/\D/g, "")
    .slice(0, 12)
    .replace(/^0+(?=\d)/, "");
  const centavos = partes.join("").replace(/\D/g, "").slice(0, 2);
  const inteiroFormatado = Number(inteiro || 0).toLocaleString("pt-BR");
  return `R$ ${inteiroFormatado}${temVirgula ? `,${centavos}` : ""}`;
}
