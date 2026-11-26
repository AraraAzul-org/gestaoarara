import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import { Shell } from "@/components/Shell";
import { FormFornecedor } from "@/components/FormFornecedor";
import { textoFornecedor, type Fornecedor } from "@/lib/fornecedores";
import { excluirFornecedor, salvarFornecedor } from "./actions";

export const instant = false;

const sumario =
  "inline-flex cursor-pointer list-none items-center rounded bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azul/40 [&::-webkit-details-marker]:hidden";

export default async function Fornecedores({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ok?: string; erro?: string }>;
}) {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("fornecedores")) redirect("/");

  const params = await searchParams;
  const termo = (params.q ?? "").trim().slice(0, 200);
  const { data, error } = await supabase.rpc("buscar_fornecedores", {
    p_termo: termo || null,
  });
  const fornecedores = ((data ?? []) as Fornecedor[]) ?? [];

  return (
    <Shell>
      <main className="max-w-5xl p-4">
        <h1 className="text-xl font-semibold text-azul">Fornecedores</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cadastro de quem presta serviços, fornece materiais ou faz locações para o grupo.
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

        <section className="mt-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-azul">Consultar</h2>
          <form method="get" className="mt-2 flex flex-wrap items-end gap-2">
            <label className="flex min-w-64 flex-1 flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                Nome ou descrição
              </span>
              <input
                name="q"
                defaultValue={termo}
                placeholder="Ex.: cisal, tendas, palco"
                autoComplete="off"
                className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20"
              />
            </label>
            <button className="rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro">
              Buscar
            </button>
            {termo && (
              <Link href="/fornecedores" className="px-2 py-1.5 text-sm text-azul underline">
                Limpar
              </Link>
            )}
          </form>
          <p className="mt-2 text-xs text-gray-600">
            A busca encontra palavras no nome e na descrição, ignorando acentos e variações de plural. Use aspas para
            uma frase exata, <code>OR</code> para alternativas e <code>-</code> para excluir uma palavra.
          </p>
        </section>

        <details className="mt-4 rounded-lg border border-gray-200 border-l-4 border-l-amarelo bg-white p-4 shadow-sm">
          <summary className={sumario}>Novo fornecedor</summary>
          <FormFornecedor action={salvarFornecedor} />
        </details>

        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-azul">
              {termo ? `Resultados para “${termo}”` : "Todos os fornecedores"}
            </h2>
            <span className="text-xs text-gray-500">
              {fornecedores.length} {fornecedores.length === 1 ? "fornecedor" : "fornecedores"}
            </span>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">
              Não foi possível carregar a consulta.
            </p>
          )}

          {!error && !fornecedores.length && (
            <p className="mt-3 rounded border border-gray-200 bg-white p-4 text-sm text-gray-500">
              Nenhum fornecedor encontrado{termo ? ` para “${termo}”` : ""}.
            </p>
          )}

          <ul className="mt-3 space-y-3">
            {fornecedores.map((f) => (
              <li key={f.idfornecedor} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
                  <span className="flex-1 font-semibold text-gray-900">{f.nome}</span>
                  <span className="rounded bg-azul/10 px-2 py-0.5 text-xs font-medium text-azul">{f.tipo}</span>
                </div>
                <div className="grid gap-x-6 gap-y-1 px-4 py-3 text-sm text-gray-700 sm:grid-cols-2">
                  <p><strong>Endereço:</strong> {textoFornecedor(f.endereco)}</p>
                  <p><strong>Localização:</strong> {textoFornecedor(f.localizacao)}</p>
                  <p><strong>Contato:</strong> {textoFornecedor(f.nomecontato)}</p>
                  <p><strong>E-mail:</strong> {textoFornecedor(f.email)}</p>
                  <p><strong>Telefone:</strong> {textoFornecedor(f.telefone)}</p>
                  <p><strong>Celular:</strong> {textoFornecedor(f.celular)}</p>
                </div>
                {f.descricao && (
                  <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-700">
                    <strong className="text-xs uppercase tracking-wide text-gray-500">
                      Descrição dos serviços / materiais
                    </strong>
                    <p className="mt-1 whitespace-pre-line">{f.descricao}</p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-2.5">
                  <details className="flex-1">
                    <summary className={sumario}>Editar</summary>
                    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
                      <FormFornecedor
                        action={salvarFornecedor}
                        valores={f}
                        id={f.idfornecedor}
                        rotuloBotao="Salvar alterações"
                      />
                    </div>
                  </details>
                  <details>
                    <summary className={sumario}>Excluir</summary>
                    <form
                      action={excluirFornecedor}
                      className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
                    >
                      <input type="hidden" name="id" value={f.idfornecedor} />
                      <p className="text-xs text-gray-700">
                        Excluir <strong>{f.nome}</strong>? Não é possível desfazer.
                      </p>
                      <button className="mt-2 rounded bg-red-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-800">
                        Confirmar exclusão
                      </button>
                    </form>
                  </details>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </Shell>
  );
}
