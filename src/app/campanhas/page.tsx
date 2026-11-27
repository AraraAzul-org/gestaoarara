import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import { dataBR } from "@/lib/data";
import { formatarReais } from "@/lib/moeda";
import {
  gruposDeCampanhas,
  metricasCampanha,
  type BlocoCampanha,
  type Campanha,
  type DistribuicaoCampanha,
} from "@/lib/campanhas";

export const instant = false;

const corStatus: Record<string, string> = {
  rascunho: "bg-yellow-100 text-yellow-800",
  iniciada: "bg-green-100 text-green-800",
  finalizada: "bg-gray-200 text-gray-700",
};

export default async function Campanhas() {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("campanha") && !eu.acessos.has("campanhas")) redirect("/");

  const { data: campanhasData, error } = await supabase
    .from("campanha")
    .select("*")
    .order("datainicial", { ascending: true });
  const campanhas = (campanhasData ?? []) as Campanha[];
  const ids = campanhas.map((c) => Number(c.idcampanha));

  const { data: blocosData } = ids.length
    ? await supabase.from("campanha_bloco").select("*").in("idcampanha", ids)
    : { data: [] as BlocoCampanha[] };
  const { data: distribuicoesData } = ids.length
    ? await supabase.from("campanha_distribuicao").select("*").in("idcampanha", ids)
    : { data: [] as DistribuicaoCampanha[] };

  const completas = gruposDeCampanhas(
    campanhas,
    (blocosData ?? []) as BlocoCampanha[],
    (distribuicoesData ?? []) as DistribuicaoCampanha[],
  );
  const abertas = completas
    .filter((c) => c.status !== "finalizada")
    .sort((a, b) => a.datainicial.localeCompare(b.datainicial));
  const finalizadas = completas
    .filter((c) => c.status === "finalizada")
    .sort((a, b) => String(b.datasorteio ?? "").localeCompare(String(a.datasorteio ?? "")));

  return (
    <Shell>
      <main className="max-w-6xl p-4">
        <h1 className="text-xl font-semibold text-azul">Campanhas e rifas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Campanhas em aberto primeiro e finalizadas depois. Abra os blocos para acompanhar a distribuição
          e os acertos.
        </p>

        {eu.acessos.has("campanha") && (
          <div className="mt-4">
            <Link
              href="/campanha"
              className="inline-block rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro"
            >
              Nova campanha
            </Link>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">
            Não foi possível carregar as campanhas.
          </p>
        )}

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-azul">
          Em aberto ({abertas.length})
        </h2>
        {!abertas.length && (
          <p className="mt-2 rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Nenhuma campanha em aberto.
          </p>
        )}
        <ul className="mt-2 space-y-3">
          {abertas.map((c) => (
            <CartaoCampanha key={c.idcampanha} campanha={c} podeEditar={eu.acessos.has("campanha")} />
          ))}
        </ul>

        <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-azul">
          Finalizadas ({finalizadas.length})
        </h2>
        {!finalizadas.length && (
          <p className="mt-2 rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Nenhuma campanha finalizada.
          </p>
        )}
        <ul className="mt-2 space-y-3">
          {finalizadas.map((c) => (
            <CartaoCampanha key={c.idcampanha} campanha={c} podeEditar={eu.acessos.has("campanha")} />
          ))}
        </ul>

        <p className="mt-5 rounded border-l-4 border-l-amarelo bg-amarelo-claro p-3 text-xs text-gray-700">
          Valores em reais. <strong>Valor acertado = quantidade vendida × valor do bilhete</strong>;
          devolvido = rifas retiradas − rifas vendidas. Cada bloco guarda sua própria folha inicial e final.
        </p>
      </main>
    </Shell>
  );
}

function CartaoCampanha({
  campanha,
  podeEditar,
}: {
  campanha: ReturnType<typeof gruposDeCampanhas>[number];
  podeEditar: boolean;
}) {
  const metricas = metricasCampanha(campanha, campanha.blocos, campanha.distribuicoes);
  const cells = [
    ["Bilhetes", String(metricas.total)],
    ["Entregues", String(metricas.entregues)],
    ["Aguardando", String(metricas.aguardando)],
    ["Acertados", String(metricas.vendidos)],
    ["Valor acertado", formatarReais(metricas.valor)],
    ["Devolvido", String(metricas.devolvido)],
  ];

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <strong className="flex-1 text-gray-900">{campanha.titulo}</strong>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${corStatus[campanha.status]}`}>
          {campanha.status}
        </span>
        <span className="text-xs text-gray-500">
          Sorteio: {dataBR(campanha.datasorteio)}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {cells.map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded bg-gray-50 p-2">
            <span className="block text-[10px] uppercase tracking-wide text-gray-500">{rotulo}</span>
            <strong className="text-sm text-azul">{valor}</strong>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/campanhas/${campanha.idcampanha}`}
          className="rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro"
        >
          Ver blocos
        </Link>
        {campanha.blocos.length > 0 && (
          <Link
            href={`/entrega-blocos?campanha=${campanha.idcampanha}`}
            className="rounded border border-azul bg-white px-3 py-1.5 text-sm font-medium text-azul hover:bg-azul/5"
          >
            Entrega
          </Link>
        )}
        {podeEditar && (
          <Link
            href={`/campanha?editar=${campanha.idcampanha}`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Editar
          </Link>
        )}
      </div>
    </li>
  );
}
