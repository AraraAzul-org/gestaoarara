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
