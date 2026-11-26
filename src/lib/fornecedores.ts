export const TIPOS_FORNECEDOR = ["Serviço", "Material", "Locação"] as const;

export type TipoFornecedor = (typeof TIPOS_FORNECEDOR)[number];

export type Fornecedor = {
  idfornecedor: number;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  celular: string | null;
  nomecontato: string | null;
  localizacao: string | null;
  email: string | null;
  tipo: TipoFornecedor;
  descricao: string | null;
  relevancia?: number | null;
};

export const textoFornecedor = (valor: string | null | undefined) =>
  valor && valor.trim() ? valor : "—";

// O link sem número (wa.me/?text=...) abre o WhatsApp para escolher o contato.
// Limita o tamanho da mensagem para não gerar URLs longas demais.
const limiteMensagemWhatsapp = 1200;

export function mensagemWhatsappFornecedor(f: Fornecedor): string {
  const linhas = [`*Fornecedor: ${f.nome.trim()}*`, `Tipo: ${f.tipo}`];
  const campos: Array<[string, string | null | undefined]> = [
    ["Telefone", f.telefone],
    ["Celular", f.celular],
    ["Contato", f.nomecontato],
    ["E-mail", f.email],
    ["Endereço", f.endereco],
    ["Localização", f.localizacao],
    ["Descrição", f.descricao],
  ];
  for (const [rotulo, valor] of campos) {
    const texto = valor?.trim();
    if (texto) linhas.push(`${rotulo}: ${texto}`);
  }
  const mensagem = linhas.join("\n");
  return mensagem.length > limiteMensagemWhatsapp
    ? `${mensagem.slice(0, limiteMensagemWhatsapp - 1)}…`
    : mensagem;
}

export function linkWhatsappFornecedor(f: Fornecedor): string {
  return `https://wa.me/?text=${encodeURIComponent(mensagemWhatsappFornecedor(f))}`;
}
