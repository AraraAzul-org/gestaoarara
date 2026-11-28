import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { FormCampanha } from "@/components/FormCampanha";
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
import { salvarCampanha } from "./actions";

export const instant = false;

const corStatus: Record<string, string> = {
  rascunho: "bg-yellow-100 text-yellow-800",
  iniciada: "bg-green-100 text-green-800",
  finalizada: "bg-gray-200 text-gray-700",
};

export default async function CadastroCampanha({
  searchParams,
}: {
  searchParams: Promise<{
    editar?: string;
    finalizar?: string;
    ok?: string;
    erro?: string;
    v?: string;
  }>;
}) {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("campanha")) redirect("/");

  const params = await searchParams;
  const editarId = Number(params.editar ?? 0);
  const finalizar = params.finalizar === "1";

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
  const editada = Number.isInteger(editarId) && editarId > 0
    ? completas.find((c) => Number(c.idcampanha) === editarId)
    : undefined;

  return (
    <Shell>
      <main className="max-w-5xl p-4">
        <h1 className="text-xl font-semibold text-azul">Cadastro de campanha</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cadastre a campanha e sua lista de blocos de rifas, com quantidades e numeração próprias.
        </p>

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

        <section className="mt-5 rounded-lg border border-gray-200 border-l-4 border-l-amarelo bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-azul">
              {editada ? `Editar: ${editada.titulo}` : "Nova campanha"}
            </h2>
            {editada && (
              <Link href="/campanha" className="text-xs font-medium text-azul underline">
                Cancelar edição / nova campanha
              </Link>
            )}
          </div>
          <FormCampanha
            key={`${editada?.idcampanha ?? "novo"}-${finalizar}-${params.v ?? ""}`}
            action={salvarCampanha}
            campanha={editada ?? null}
            blocos={editada?.blocos ?? []}
            finalizar={finalizar}
          />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-azul">
            Campanhas cadastradas
          </h2>
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
                    {c.blocos.length > 0 && (
                      <Link
                        href={`/entrega-blocos?campanha=${c.idcampanha}`}
                        className="rounded border border-azul bg-white px-3 py-1.5 text-sm font-medium text-azul hover:bg-azul/5"
                      >
                        Entrega
                      </Link>
                    )}
                    <Link
                      href={`/campanha?editar=${c.idcampanha}`}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Editar
                    </Link>
                    {c.status !== "finalizada" && (
                      <Link
                        href={`/campanha?editar=${c.idcampanha}&finalizar=1`}
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
        </section>
      </main>
    </Shell>
  );
}
