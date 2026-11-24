import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import { Shell } from "@/components/Shell";
import { Voltar } from "@/components/Voltar";
import { FormLenco } from "@/components/FormLenco";
import { criarLenco } from "../actions";
import { dataBR } from "@/lib/data";
import type { Lenco } from "@/lib/lencos";

export const instant = false;

export default async function CadastrarLenco({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; ok?: string }>;
}) {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("lencoscadastro")) redirect("/");

  const { erro, ok } = await searchParams;
  const { data } = await supabase
    .from("lenco")
    .select("idlenco, grupoescoteiro, numero, uf, data, nomeescoteiro, nomeescoteiroarara, nomeatividade")
    .order("data", { ascending: false, nullsFirst: false })
    .order("idlenco", { ascending: false });
  const lencos = (data ?? []) as Pick<
    Lenco,
    "idlenco" | "grupoescoteiro" | "numero" | "uf" | "data" | "nomeescoteiro" | "nomeescoteiroarara" | "nomeatividade"
  >[];
  const txt = (v: string | null | undefined) => (v && v.trim() ? v : "—");

  return (
    <Shell>
      <main className="w-full p-4">
        <Voltar href="/" />
        <h1 className="mt-2 text-xl font-semibold text-azul">Cadastrar lenço</h1>
        <p className="mt-1 text-sm text-gray-600">
          Preencha os dados da troca e envie as fotos do lenço e da entrega.
        </p>
        {erro && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
        {ok && <p className="mt-3 rounded bg-green-50 p-2 text-sm text-green-800">{ok}</p>}
        <FormLenco action={criarLenco} botao="Cadastrar lenço" />

        <div className="mt-6 flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-azul">Lenços cadastrados</h2>
          <span className="rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
            {lencos.length} {lencos.length === 1 ? "lenço" : "lenços"}
          </span>
        </div>
        <div className="mt-3 overflow-x-auto rounded border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-azul text-white">
              <tr>
                {["Data", "Grupo", "Nº", "UF", "Escoteiro", "Arara Azul", "Atividade", ""].map((h) => (
                  <th key={h} className="p-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {!lencos.length ? (
                <tr>
                  <td colSpan={8} className="p-4 text-sm text-gray-600">Nenhum lenço cadastrado.</td>
                </tr>
              ) : (
                lencos.map((lenco) => (
                  <tr key={lenco.idlenco}>
                    <td className="whitespace-nowrap p-2 text-gray-600">{lenco.data ? dataBR(lenco.data) : "—"}</td>
                    <td className="p-2">{txt(lenco.grupoescoteiro)}</td>
                    <td className="p-2">{txt(lenco.numero)}</td>
                    <td className="p-2 font-medium">{txt(lenco.uf)}</td>
                    <td className="p-2">{txt(lenco.nomeescoteiro)}</td>
                    <td className="p-2">{txt(lenco.nomeescoteiroarara)}</td>
                    <td className="p-2">{txt(lenco.nomeatividade)}</td>
                    <td className="p-2">
                      <Link href={`/lencos/${lenco.idlenco}`} className="text-azul underline">Editar</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </Shell>
  );
}
