import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { AcaoBlocoModal } from "@/components/AcaoBlocoModal";
import { FormAcerto } from "@/components/FormAcerto";
import { FormRetirada } from "@/components/FormRetirada";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import { dataBR, hojeBR } from "@/lib/data";
import { formatarReais } from "@/lib/moeda";
import {
  distribuicoesPorBloco,
  metricasCampanha,
  situacaoBloco,
  valorDoBloco,
  type BlocoCampanha,
  type Campanha,
  type DistribuicaoCampanha,
  type PessoaSugestao,
} from "@/lib/campanhas";
import { criarBloco } from "./actions";
import { registrarAcerto, registrarRetirada } from "../../entrega-blocos/actions";

export const instant = false;

const sumario =
  "inline-flex cursor-pointer list-none items-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul/40 [&::-webkit-details-marker]:hidden";
const campo =
  "w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20";

export default async function DetalheCampanha({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erro?: string }>;
}) {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  const podeEditar = eu.acessos.has("campanha");
  const podeConsultar = eu.acessos.has("campanhas");
  const podeEntregar = podeEditar || eu.acessos.has("entregablocos");
  if (!podeEditar && !podeConsultar && !podeEntregar) redirect("/");

  const { id } = await params;
  const idcampanha = Number(id);
  if (!Number.isInteger(idcampanha) || idcampanha <= 0) notFound();
  const consulta = await searchParams;

  const { data: campanhaData } = await supabase
    .from("campanha")
    .select("*")
    .eq("idcampanha", idcampanha)
    .maybeSingle();
  if (!campanhaData) notFound();
  const campanha = campanhaData as Campanha;

  const { data: blocosData } = await supabase
    .from("campanha_bloco")
    .select("*")
    .eq("idcampanha", idcampanha)
    .order("numero", { ascending: true });
  const { data: distribuicoesData } = await supabase
    .from("campanha_distribuicao")
    .select("*")
    .eq("idcampanha", idcampanha);
  const blocos = (blocosData ?? []) as BlocoCampanha[];
  const distribuicoes = (distribuicoesData ?? []) as DistribuicaoCampanha[];
  const porBloco = distribuicoesPorBloco(distribuicoes);
  const metricas = metricasCampanha(campanha, blocos, distribuicoes);

  let pessoas: PessoaSugestao[] = [];
  if (podeEntregar) {
    const { data: pessoasData } = await supabase.rpc("pessoas_para_entrega");
    const lista = (pessoasData ?? []) as { id: number | string; nome: string | null; tipo: string | null }[];
    pessoas = lista
      .map((p) => ({
        id: Number(p.id),
        nome: String(p.nome),
        tipo: String(p.tipo) === "Jovem" ? ("Jovem" as const) : ("Associado" as const),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }

  const unitario = Number(campanha.valorbilhete) || 0;
  const tamanhos = [...new Set(blocos.map((b) => Number(b.quantbilhetes)))].sort((a, b) => a - b);
  const primeiraNumeracao = blocos.length ? Math.min(...blocos.map((b) => Number(b.numeracaoinicial))) : "—";
  const hoje = hojeBR();

  return (
    <Shell>
      <main className="max-w-6xl p-4">
        <h1 className="text-xl font-semibold text-azul">{campanha.titulo}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {campanha.status} · Sorteio em {dataBR(campanha.datasorteio)} · {campanha.descritivo ?? "—"}
        </p>

        {consulta.erro && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {consulta.erro}
          </p>
        )}
        {consulta.ok && (
          <p role="status" className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {consulta.ok}
          </p>
        )}

        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs text-gray-700">
            <strong>Configuração:</strong> {blocos.length} bloco(s) · {metricas.total} folha(s) · numeração inicial{" "}
            {primeiraNumeracao} · tamanho(s) de bloco: <strong>{tamanhos.join(", ") || "—"}</strong>. Bilhete:{" "}
            <strong>{formatarReais(unitario)}</strong> · total da campanha:{" "}
            <strong>{formatarReais(campanha.valortotal)}</strong>.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Bilhetes", String(metricas.total)],
              ["Entregues", String(metricas.entregues)],
              ["Aguardando", String(metricas.aguardando)],
              ["Acertados", String(metricas.vendidos)],
              ["Valor acertado", formatarReais(metricas.valor)],
              ["Devolvido", String(metricas.devolvido)],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="rounded bg-gray-50 p-2">
                <span className="block text-[10px] uppercase tracking-wide text-gray-500">{rotulo}</span>
                <strong className="text-sm text-azul">{valor}</strong>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-600">
            Blocos na ordem em que foram cadastrados. A folha inicial/final é a gravada em cada bloco: incluir
            um bloco novo não recalcula os anteriores, mesmo que a numeração fique fora de ordem.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/campanhas" className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            ← Campanhas
          </Link>
          {podeEntregar && blocos.length > 0 && (
            <Link
              href={`/entrega-blocos?campanha=${idcampanha}`}
              className="rounded border border-azul bg-white px-3 py-1.5 text-sm font-medium text-azul hover:bg-azul/5"
            >
              Entrega de blocos
            </Link>
          )}
          {podeEditar && campanha.status !== "finalizada" && (
            <details className="rounded border border-gray-200 bg-white px-3 py-1.5">
              <summary className={sumario}>Novo bloco</summary>
              <form action={criarBloco} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="idcampanha" value={idcampanha} />
                <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase text-gray-600">
                  Folhas (rifas) do novo bloco
                  <input type="number" name="folhas" min={1} defaultValue={50} className={`${campo} w-32`} />
                </label>
                <button className="rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro">
                  Adicionar bloco
                </button>
              </form>
            </details>
          )}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-azul text-[11px] uppercase tracking-wide text-white">
              <tr>
                <th className="px-2 py-2">Bloco</th>
                <th className="px-2 py-2">Numeração</th>
                <th className="px-2 py-2 text-right">Rifas</th>
                <th className="px-2 py-2">Associado / jovem</th>
                <th className="px-2 py-2">Terceiro</th>
                <th className="px-2 py-2">Retirada</th>
                <th className="px-2 py-2 text-right">Vendidos</th>
                <th className="px-2 py-2 text-right">Valor vendido</th>
                <th className="px-2 py-2 text-right">Devolvidos</th>
                <th className="px-2 py-2">Situação</th>
                <th className="px-2 py-2">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!blocos.length && (
                <tr>
                  <td colSpan={11} className="px-2 py-4 text-center text-gray-500">
                    Nenhum bloco cadastrado nesta campanha.
                  </td>
                </tr>
              )}
              {blocos.map((bloco) => {
                const d = porBloco.get(Number(bloco.idbloco));
                const disponivel = !d || d.situacao === "disponivel";
                const retirado = d?.situacao === "retirado";
                const acertado = d?.situacao === "acertado";
                const situacao = situacaoBloco(d);
                const vendidos = Number(d?.quantvendida ?? 0);
                const valorVendido = Math.round(vendidos * unitario * 100) / 100;
                const devolvidos = disponivel
                  ? null
                  : Math.max(0, Number(d?.quantrifas ?? 0) - vendidos);
                return (
                  <tr key={bloco.idbloco}>
                    <td className="px-2 py-2 tabular-nums">{bloco.numero}</td>
                    <td className="px-2 py-2 tabular-nums">
                      {bloco.numeracaoinicial} – {bloco.numeracaofinal}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{bloco.quantbilhetes}</td>
                    <td className="px-2 py-2">
                      {d?.nome ? (
                        <>
                          {d.nome} <span className="text-xs text-gray-500">({d.tipo})</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-2">{d?.descricao ?? "—"}</td>
                    <td className="px-2 py-2">{dataBR(d?.dataretirada)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{d ? vendidos : "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {d ? formatarReais(valorVendido) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {devolvidos === null ? "—" : devolvidos}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          disponivel
                            ? "bg-indigo-100 text-indigo-800"
                            : acertado
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {situacao}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {acertado && (
                          <button
                            type="button"
                            disabled
                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-500"
                          >
                            Encerrado
                          </button>
                        )}
                        {disponivel && podeEntregar && (
                          <AcaoBlocoModal
                            key={`retirar-${bloco.idbloco}`}
                            rotulo="Retirar"
                            titulo={`Retirar bloco ${bloco.numero}`}
                          >
                            <FormRetirada
                              action={registrarRetirada}
                              idcampanha={idcampanha}
                              idbloco={Number(bloco.idbloco)}
                              numero={bloco.numero}
                              numeracao={`${bloco.numeracaoinicial} – ${bloco.numeracaofinal}`}
                              folhas={Number(bloco.quantbilhetes)}
                              valorBloco={valorDoBloco(bloco.quantbilhetes, unitario)}
                              pessoas={pessoas}
                              hoje={hoje}
                            />
                          </AcaoBlocoModal>
                        )}
                        {retirado && podeEntregar && (
                          <AcaoBlocoModal
                            key={`acertar-${bloco.idbloco}`}
                            rotulo="Acertar"
                            titulo={`Acertar bloco ${bloco.numero}`}
                            className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
                          >
                            <FormAcerto
                              action={registrarAcerto}
                              idcampanha={idcampanha}
                              idbloco={Number(bloco.idbloco)}
                              quantRetirada={Number(d?.quantrifas ?? 0)}
                              valorBilhete={unitario}
                              dataacerto={hoje}
                            />
                          </AcaoBlocoModal>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 text-xs font-semibold">
              <tr>
                <th colSpan={2} className="px-2 py-2 text-left">Total</th>
                <th className="px-2 py-2 text-right tabular-nums">{metricas.total}</th>
                <th colSpan={3} />
                <th className="px-2 py-2 text-right tabular-nums">{metricas.vendidos}</th>
                <th className="px-2 py-2 text-right tabular-nums">{formatarReais(metricas.valor)}</th>
                <th className="px-2 py-2 text-right tabular-nums">{metricas.devolvido}</th>
                <th colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </Shell>
  );
}
