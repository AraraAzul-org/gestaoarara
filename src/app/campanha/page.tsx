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

export default async function CadastroCampanha({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; erro?: string; v?: string }>;
}) {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("campanha")) redirect("/");

  const params = await searchParams;

  const { data: campanhasData, error } = await supabase
    .from("campanha")
    .select("*")
    .order("datainicial", { ascending: true });
  const campanhas = (campanhasData ?? []) as Campanha[];
  const ids = campanhas.map((c) => Number(c.idcampanha));

  const { data: blocosData } = ids.length
    ? await supabase
        .from("campanha_bloco")
        .select("*")
        .in("idcampanha", ids)
        .order("numero", { ascending: true })
    : { data: [] as BlocoCampanha[] };
  const { data: distribuicoesData } = ids.length
    ? await supabase.from("campanha_distribuicao").select("*").in("idcampanha", ids)
    : { data: [] as DistribuicaoCampanha[] };

  const blocos = (blocosData ?? []) as BlocoCampanha[];
  const distribuicoes = (distribuicoesData ?? []) as DistribuicaoCampanha[];
  const completas = gruposDeCampanhas(campanhas, blocos, distribuicoes);

  return (
    <Shell>
      <main className="max-w-5xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-azul">Cadastro de campanha</h1>
          <Link
            href="/campanha/form"
            className="rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro"
          >
            Nova campanha
          </Link>
        </div>

        {params.erro && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.erro}
          </p>
        )}
        {params.ok && (
          <p role="status" className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {params.ok}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">
            Não foi possível carregar as campanhas.
          </p>
        )}
        {!error && !completas.length && (
          <p className="mt-3 rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Nenhuma campanha cadastrada.
          </p>
        )}
        <ul className="mt-3 space-y-3">
          {completas.map((c) => {
            const metricas = metricasCampanha(c, c.blocos, c.distribuicoes);
            return (
              <li key={c.idcampanha} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="flex-1 text-lg font-semibold text-azul">{c.titulo}</strong>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${corStatus[c.status]}`}>
                    {c.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {dataBR(c.datainicial)} – {dataBR(c.datafinal)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600">
                  <span>{c.blocos.length} bloco(s)</span>
                  <span>{metricas.total} folha(s)</span>
                  <span>Bilhete: {formatarReais(c.valorbilhete)}</span>
                  <span>Total: {formatarReais(c.valortotal)}</span>
                  <span>Vendidos: {metricas.vendidos}</span>
                  <span>Acertado: {formatarReais(metricas.valor)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/campanhas/${c.idcampanha}`}
                    className="rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro"
                  >
                    Blocos
                  </Link>
                  <Link
                    href={`/campanha/form?editar=${c.idcampanha}`}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Editar
                  </Link>
                  {c.status !== "finalizada" && (
                    <Link
                      href={`/campanha/form?editar=${c.idcampanha}&finalizar=1`}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Finalizar
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </Shell>
  );
}
