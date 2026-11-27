import { numeroMoeda } from "@/lib/moeda";

export const STATUS_CAMPANHA = ["rascunho", "iniciada", "finalizada"] as const;
export type StatusCampanha = (typeof STATUS_CAMPANHA)[number];

export type TipoPessoa = "Associado" | "Jovem";

export type LinhaBloco = {
  folhas: number;
  inicio: number;
  fim: number;
};

export type Campanha = {
  idcampanha: number;
  titulo: string;
  datainicial: string;
  datafinal: string;
  premios: string | null;
  datasorteio: string | null;
  valorbilhete: number | string;
  valortotal: number | string;
  valorpremios: number | string | null;
  descritivo: string | null;
  status: StatusCampanha;
  ganhadores: string | null;
  quantblocos: number;
  quantidades: LinhaBloco[] | unknown;
  numeracaoinicial: number;
};

export type BlocoCampanha = {
  idbloco: number;
  idcampanha: number;
  numero: number;
  quantbilhetes: number;
  numeracaoinicial: number;
  numeracaofinal: number;
};

export type DistribuicaoCampanha = {
  iddistribuicao: number;
  idcampanha: number;
  idbloco: number;
  tipo: TipoPessoa | null;
  idassociado: number | null;
  idjovem: number | null;
  nome: string | null;
  descricao: string | null;
  dataretirada: string | null;
  quantrifas: number;
  dataacerto: string | null;
  quantvendida: number;
  valoracerto: number | string;
  situacao: "disponivel" | "retirado" | "acertado";
};

export type PessoaSugestao = {
  id: number;
  nome: string;
  tipo: TipoPessoa;
};

export type CampanhaCompleta = Campanha & {
  blocos: BlocoCampanha[];
  distribuicoes: DistribuicaoCampanha[];
};

export type MetricasCampanha = {
  total: number;
  entregues: number;
  aguardando: number;
  vendidos: number;
  valor: number;
  devolvido: number;
};

function inteiro(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

export function linhasDaCampanha(campanha: Campanha | null | undefined): LinhaBloco[] {
  const bruto = campanha?.quantidades;
  if (!Array.isArray(bruto)) return [];
  return bruto
    .map((item) => {
      const l = item as Partial<LinhaBloco>;
      return {
        folhas: inteiro(l.folhas),
        inicio: inteiro(l.inicio),
        fim: inteiro(l.fim),
      };
    })
    .filter((l) => l.folhas > 0 && l.inicio > 0 && l.fim >= l.inicio);
}

export function linhasDosBlocos(blocos: BlocoCampanha[]): LinhaBloco[] {
  return [...blocos]
    .sort((a, b) => a.numero - b.numero)
    .map((b) => ({
      folhas: inteiro(b.quantbilhetes),
      inicio: inteiro(b.numeracaoinicial),
      fim: inteiro(b.numeracaofinal),
    }));
}

export function totalFolhas(blocos: BlocoCampanha[]): number {
  return blocos.reduce((soma, bloco) => soma + inteiro(bloco.quantbilhetes), 0);
}

/** Valor do bloco = valor do bilhete × quantidade de folhas daquele bloco. */
export function valorDoBloco(
  folhas: number | string | null | undefined,
  valorBilhete: number | string | null | undefined,
): number {
  const quantidade = inteiro(folhas);
  return Math.round(numeroMoeda(valorBilhete) * quantidade * 100) / 100;
}

export function situacaoBloco(distribuicao: DistribuicaoCampanha | undefined): string {
  if (!distribuicao || distribuicao.situacao === "disponivel") return "Disponível";
  if (distribuicao.situacao === "acertado" || distribuicao.dataacerto) return "Acertado";
  return "Aguardando";
}

export function metricasCampanha(
  campanha: Campanha,
  blocos: BlocoCampanha[],
  distribuicoes: DistribuicaoCampanha[],
): MetricasCampanha {
  const soma = (itens: DistribuicaoCampanha[], campo: "quantrifas" | "quantvendida" | "valoracerto") =>
    itens.reduce(
      (total, item) => total + inteiro(campo === "valoracerto" ? Number(item[campo]) : item[campo]),
      0,
    );

  const comResponsavel = distribuicoes.filter(
    (d) => d.nome && d.dataretirada && d.tipo,
  );
  const acertados = distribuicoes.filter((d) => d.dataacerto && d.situacao === "acertado");
  const aguardando = comResponsavel.filter((d) => !d.dataacerto);

  return {
    total: totalFolhas(blocos),
    entregues: soma(comResponsavel, "quantrifas"),
    aguardando: soma(aguardando, "quantrifas"),
    vendidos: soma(acertados, "quantvendida"),
    valor: Math.round(soma(acertados, "valoracerto") * 100) / 100,
    devolvido: comResponsavel.reduce(
      (total, d) => total + Math.max(0, inteiro(d.quantrifas) - inteiro(d.quantvendida)),
      0,
    ),
  };
}

export function distribuicoesPorBloco(
  distribuicoes: DistribuicaoCampanha[],
): Map<number, DistribuicaoCampanha> {
  return new Map(distribuicoes.map((d) => [Number(d.idbloco), d]));
}

export function gruposDeCampanhas(
  campanhas: Campanha[],
  blocos: BlocoCampanha[],
  distribuicoes: DistribuicaoCampanha[],
): CampanhaCompleta[] {
  return campanhas.map((c) => ({
    ...c,
    blocos: blocos.filter((b) => Number(b.idcampanha) === Number(c.idcampanha)),
    distribuicoes: distribuicoes.filter(
      (d) => Number(d.idcampanha) === Number(c.idcampanha),
    ),
  }));
}
