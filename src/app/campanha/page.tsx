import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { FormCampanha } from "@/components/FormCampanha";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import {
  gruposDeCampanhas,
  type BlocoCampanha,
  type Campanha,
  type CampanhaCompleta,
  type DistribuicaoCampanha,
} from "@/lib/campanhas";
import { salvarCampanha } from "./actions";

export const instant = false;

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

  let editada: CampanhaCompleta | undefined;
  if (Number.isInteger(editarId) && editarId > 0) {
    const { data: campanha } = await supabase
      .from("campanha")
      .select("*")
      .eq("idcampanha", editarId)
      .maybeSingle();
    if (campanha) {
      const { data: blocos } = await supabase
        .from("campanha_bloco")
        .select("*")
        .eq("idcampanha", editarId)
        .order("numero", { ascending: true });
      const { data: distribuicoes } = await supabase
        .from("campanha_distribuicao")
        .select("*")
        .eq("idcampanha", editarId);
      editada = gruposDeCampanhas(
        [campanha as Campanha],
        (blocos ?? []) as BlocoCampanha[],
        (distribuicoes ?? []) as DistribuicaoCampanha[],
      )[0];
    }
  }

  return (
    <Shell>
      <main className="max-w-5xl p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-semibold text-azul">Cadastro de campanha</h1>
          <Link href="/campanha/lista" className="text-sm font-medium text-azul underline">
            Campanhas cadastradas
          </Link>
        </div>
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
      </main>
    </Shell>
  );
}
