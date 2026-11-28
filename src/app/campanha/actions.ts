"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import {
  STATUS_CAMPANHA,
  type LinhaBloco,
  type StatusCampanha,
} from "@/lib/campanhas";
import { numeroMoeda } from "@/lib/moeda";

async function autorizado() {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("campanha")) redirect("/");
  return supabase;
}

function voltar(tipo: "ok" | "erro", mensagem: string, id = 0): never {
  revalidatePath("/campanha");
  revalidatePath("/campanha/form");
  revalidatePath("/campanhas");
  revalidatePath("/entrega-blocos");
  const params = new URLSearchParams({ [tipo]: mensagem, v: String(Date.now()) });
  if (tipo === "erro" && id > 0) params.set("editar", String(id));
  redirect(`${tipo === "ok" ? "/campanha" : "/campanha/form"}?${params}`);
}

function linhasEnviadas(f: FormData): LinhaBloco[] {
  const bruto = String(f.get("blocos") ?? "").trim();
  if (!bruto) return [];
  const dadosBrutos = JSON.parse(bruto) as unknown;
  if (!Array.isArray(dadosBrutos)) return [];
  return dadosBrutos.map((item) => {
    const l = item as Partial<LinhaBloco>;
    return {
      folhas: Number(l.folhas),
      inicio: Number(l.inicio),
      fim: Number(l.fim),
    };
  });
}

export async function salvarCampanha(f: FormData) {
  const supabase = await autorizado();
  const txt = (campo: string) => String(f.get(campo) ?? "").trim();
  const id = Number(txt("id") ?? 0);
  const sair = (tipo: "ok" | "erro", mensagem: string): never => voltar(tipo, mensagem, id);

  const titulo = txt("titulo").slice(0, 200);
  const datainicial = txt("datainicial");
  const datafinal = txt("datafinal");
  const status = txt("status") as StatusCampanha;
  const valorbilhete = numeroMoeda(txt("valorbilhete"));
  const premiosTexto = txt("valorpremios");
  const ganhadores = txt("ganhadores");

  if (!titulo) sair("erro", "Informe o título da campanha.");
  if (!datainicial || !datafinal) sair("erro", "Informe as datas inicial e final.");
  if (datafinal < datainicial) sair("erro", "A data final não pode ser anterior à inicial.");
  if (!(valorbilhete > 0)) sair("erro", "Informe o valor do bilhete em reais.");
  if (!STATUS_CAMPANHA.includes(status)) sair("erro", "Escolha um status válido.");
  if (status === "finalizada" && !ganhadores) {
    sair("erro", "Informe os ganhadores para finalizar a campanha.");
  }

  let linhas: LinhaBloco[] = [];
  try {
    linhas = linhasEnviadas(f);
  } catch {
    sair("erro", "A lista de blocos está inválida. Gere os blocos novamente.");
  }
  if (linhas.length > 1000) sair("erro", "Limite de 1000 blocos por campanha.");
  if (linhas.some((l) => !Number.isInteger(l.folhas) || l.folhas <= 0)) {
    sair("erro", "Todos os blocos devem ter pelo menos 1 folha.");
  }
  if (linhas.some((l) => !Number.isInteger(l.inicio) || l.inicio <= 0 || !Number.isInteger(l.fim) || l.fim < l.inicio)) {
    sair("erro", "Confira a folha inicial e a folha final de cada bloco.");
  }
  if (status !== "rascunho" && !linhas.length) {
    sair("erro", "Cadastre ao menos um bloco na lista de blocos.");
  }

  const dados = {
    titulo,
    datainicial,
    datafinal,
    premios: txt("premios") || null,
    datasorteio: txt("datasorteio") || null,
    valorbilhete: String(valorbilhete),
    valorpremios: premiosTexto ? String(numeroMoeda(premiosTexto)) : null,
    descritivo: txt("descritivo") || null,
    status,
    ganhadores: ganhadores || null,
    blocos: linhas,
    numeracaoinicial: linhas.length ? linhas[0].inicio : Number(txt("numeracaoinicial")) || 1,
  };

  const { error } = Number.isInteger(id) && id > 0
    ? await supabase.rpc("atualizar_campanha", { p_idcampanha: id, p_dados: dados })
    : await supabase.rpc("criar_campanha", { p_dados: dados });

  if (error) sair("erro", error.message || "Não foi possível salvar a campanha.");
  sair("ok", "Campanha salva.");
}
