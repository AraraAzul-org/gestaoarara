import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
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
  type BlocoCampanha,
  type Campanha,
  type DistribuicaoCampanha,
  type PessoaSugestao,
} from "@/lib/campanhas";
import { registrarAcerto, registrarRetirada } from "./actions";

export const instant = false;

const sumario =
  "inline-flex cursor-pointer list-none items-center rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul/40 [&::-webkit-details-marker]:hidden";

export default async function EntregaBlocos({
  searchParams,
}: {
  searchParams: Promise<{
    campanha?: string;
    ok?: string;
    erro?: string;
    v?: string;
  }>;
}) {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("campanha") && !eu.acessos.has("entregablocos")) redirect("/");

  const params = await searchParams;
  const { data: campanhasData, error } = await supabase
    .from("campanha")
    .select("*")
    .order("datainicial", { ascending: true });
  const campanhas = (campanhasData ?? []) as Campanha[];

  const pedido = Number(params.campanha ?? 0);
  const selecionada =
    campanhas.find((c) => Number(c.idcampanha) === pedido) ??
    campanhas.find((c) => c.status === "iniciada") ??
    campanhas.find((c) => c.status === "rascunho") ??
    campanhas[0];
  const idcampanha = Number(selecionada?.idcampanha ?? 0);

  const { data: blocosData } = idcampanha
    ? await supabase
        .from("campanha_bloco")
        .select("*")
        .eq("idcampanha", idcampanha)
        .order("numero", { ascending: true })
    : { data: [] as BlocoCampanha[] };
  const { data: distribuicoesData } = idcampanha
    ? await supabase.from("campanha_distribuicao").select("*").eq("idcampanha", idcampanha)
    : { data: [] as DistribuicaoCampanha[] };
  const blocos = (blocosData ?? []) as BlocoCampanha[];
  const distribuicoes = (distribuicoesData ?? []) as DistribuicaoCampanha[];
  const porBloco = distribuicoesPorBloco(distribuicoes);
  const metricas = selecionada
    ? metricasCampanha(selecionada, blocos, distribuicoes)
    : null;

  const { data: pessoasData } = await supabase.rpc("pessoas_para_entrega");
  const lista = (pessoasData ?? []) as { id: number | string; nome: string | null; tipo: string | null }[];
  const pessoas: PessoaSugestao[] = lista
    .map((p) => ({
      id: Number(p.id),
      nome: String(p.nome),
      tipo: String(p.tipo) === "Jovem" ? ("Jovem" as const) : ("Associado" as const),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));

  const unitario = Number(selecionada?.valorbilhete ?? 0) || 0;
  const hoje = hojeBR();

  return (
    <Shell>
      <main className="max-w-7xl p-4">
        <h1 className="text-xl font-semibold text-azul">Entrega de blocos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Retire o bloco inteiro e acerte depois a quantidade efetivamente vendida. O que não foi
          vendido volta como devolvido.
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
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">
            Não foi possível carregar as campanhas.
          </p>
        )}

        <form method="get" className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600">
            Campanha
            <select
              name="campanha"
              defaultValue={idcampanha}
              className="w-72 rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20"
            >
              {!campanhas.length && <option value="">Nenhuma campanha</option>}
              {campanhas.map((c) => (
                <option key={c.idcampanha} value={c.idcampanha}>
                  {c.titulo} ({c.status})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro">
            Selecionar
          </button>
          {selecionada && (
            <p className="text-xs text-gray-600">
              {dataBR(selecionada.datainicial)} – {dataBR(selecionada.datafinal)} · Sorteio:{" "}
              {dataBR(selecionada.datasorteio)} · Bilhete: {formatarReais(unitario)}
            </p>
          )}
        </form>

        {!selecionada ? (
          <p className="mt-4 rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Nenhuma campanha cadastrada para entrega.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Folhas", String(metricas?.total ?? 0)],
                ["Entregues", String(metricas?.entregues ?? 0)],
                ["Aguardando", String(metricas?.aguardando ?? 0)],
                ["Acertados", String(metricas?.vendidos ?? 0)],
                ["Valor acertado", formatarReais(metricas?.valor ?? 0)],
                ["Devolvido", String(metricas?.devolvido ?? 0)],
              ].map(([rotulo, valor]) => (
                <div key={rotulo} className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                  <span className="block text-[10px] uppercase tracking-wide text-gray-500">{rotulo}</span>
                  <strong className="text-sm text-azul">{valor}</strong>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-gray-600">
              Blocos na ordem cadastrada, com a numeração gravada em cada um. Situação{" "}
              <strong>Aguardando</strong> significa que o bloco foi retirado e ainda não foi acertado.
            </p>

            <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
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
                        Esta campanha ainda não tem blocos gerados.
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
                    const devolvidos = disponivel
                      ? null
                      : Math.max(0, Number(d?.quantrifas ?? 0) - vendidos);
                    const valorVendido = Math.round(vendidos * unitario * 100) / 100;
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
                          {acertado ? (
                            <button
                              type="button"
                              disabled
                              className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-500"
                            >
                              Encerrado
                            </button>
                          ) : disponivel ? (
                            <details>
                              <summary className={sumario}>Retirar</summary>
                              <FormRetirada
                                action={registrarRetirada}
                                idcampanha={idcampanha}
                                idbloco={Number(bloco.idbloco)}
                                numero={bloco.numero}
                                numeracao={`${bloco.numeracaoinicial} – ${bloco.numeracaofinal}`}
                                folhas={Number(bloco.quantbilhetes)}
                                valorBloco={Number(bloco.quantbilhetes) * unitario}
                                pessoas={pessoas}
                                hoje={hoje}
                              />
                            </details>
                          ) : retirado ? (
                            <details>
                              <summary className="inline-flex cursor-pointer list-none items-center rounded bg-green-600 px-2 py-1 text-xs font-medium text-white [&::-webkit-details-marker]:hidden">
                                Acertar
                              </summary>
                              <FormAcerto
                                action={registrarAcerto}
                                idcampanha={idcampanha}
                                idbloco={Number(bloco.idbloco)}
                                quantRetirada={Number(d?.quantrifas ?? 0)}
                                valorBilhete={unitario}
                                dataacerto={hoje}
                              />
                            </details>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 text-xs font-semibold">
                  <tr>
                    <th colSpan={2} className="px-2 py-2 text-left">Total</th>
                    <th className="px-2 py-2 text-right tabular-nums">{metricas?.total ?? 0}</th>
                    <th colSpan={3} />
                    <th className="px-2 py-2 text-right tabular-nums">{metricas?.vendidos ?? 0}</th>
                    <th className="px-2 py-2 text-right tabular-nums">{formatarReais(metricas?.valor ?? 0)}</th>
                    <th className="px-2 py-2 text-right tabular-nums">{metricas?.devolvido ?? 0}</th>
                    <th colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="mt-3">
              <Link
                href={eu.acessos.has("campanha") ? `/campanhas/${idcampanha}` : "/campanhas"}
                className="text-xs font-medium text-azul underline"
              >
                {eu.acessos.has("campanha") ? "Ver detalhe e novos blocos" : "Ver campanhas"}
              </Link>
            </p>
          </>
        )}
      </main>
    </Shell>
  );
}
