// Máscaras brasileiras: telefone fixo tem DDD + 8 dígitos e celular tem DDD + 9 dígitos.
const somenteDigitos = (valor: string) => valor.replace(/\D/g, "");

export function mascaraTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 10);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

export function mascaraCelular(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const digitosTelefone = (valor: string | null | undefined) => somenteDigitos(valor ?? "");
