"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";

async function autorizado() {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("campanha")) redirect("/");
  return supabase;
}

function voltar(idcampanha: number, tipo: "ok" | "erro", mensagem: string): never {
  revalidatePath(`/campanhas/${idcampanha}`);
  revalidatePath("/campanhas");
  revalidatePath("/entrega-blocos");
  revalidatePath("/campanha");
  revalidatePath("/campanha/lista");
  redirect(`/campanhas/${idcampanha}?${tipo}=${encodeURIComponent(mensagem)}&v=${Date.now()}`);
}

function inteiro(f: FormData, campo: string): number {
  return Number(String(f.get(campo) ?? "").trim());
}

export async function criarBloco(f: FormData) {
  const supabase = await autorizado();
  const idcampanha = inteiro(f, "idcampanha");
  const folhas = inteiro(f, "folhas");
  if (!Number.isInteger(idcampanha) || idcampanha <= 0) voltar(idcampanha, "erro", "Campanha inválida.");
  if (!Number.isInteger(folhas) || folhas <= 0) {
    voltar(idcampanha, "erro", "Informe uma quantidade válida de folhas.");
  }

  const { error } = await supabase.rpc("criar_bloco", {
    p_idcampanha: idcampanha,
    p_quantbilhetes: folhas,
  });
  if (error) voltar(idcampanha, "erro", error.message || "Não foi possível adicionar o bloco.");
  voltar(idcampanha, "ok", "Bloco adicionado.");
}

export async function salvarBloco(f: FormData) {
  const supabase = await autorizado();
  const idcampanha = inteiro(f, "idcampanha");
  const idbloco = inteiro(f, "idbloco");
  const folhas = inteiro(f, "folhas");
  const inicio = inteiro(f, "inicio");
  const fim = inteiro(f, "fim");

  if (!Number.isInteger(idcampanha) || idcampanha <= 0) voltar(idcampanha, "erro", "Campanha inválida.");
  if (!Number.isInteger(idbloco) || idbloco <= 0) voltar(idcampanha, "erro", "Bloco inválido.");
  if (!Number.isInteger(folhas) || folhas <= 0 || !Number.isInteger(inicio) || inicio <= 0 ||
      !Number.isInteger(fim) || fim < inicio) {
    voltar(idcampanha, "erro", "Informe folhas e numeração válidas.");
  }

  const { error } = await supabase.rpc("salvar_bloco", {
    p_idbloco: idbloco,
    p_quantbilhetes: folhas,
    p_inicio: inicio,
    p_fim: fim,
  });
  if (error) voltar(idcampanha, "erro", error.message || "Não foi possível salvar o bloco.");
  voltar(idcampanha, "ok", "Bloco salvo.");
}

export async function excluirBloco(f: FormData) {
  const supabase = await autorizado();
  const idcampanha = inteiro(f, "idcampanha");
  const idbloco = inteiro(f, "idbloco");
  if (!Number.isInteger(idcampanha) || idcampanha <= 0) voltar(idcampanha, "erro", "Campanha inválida.");
  if (!Number.isInteger(idbloco) || idbloco <= 0) voltar(idcampanha, "erro", "Bloco inválido.");

  const { error } = await supabase.rpc("excluir_bloco", { p_idbloco: idbloco });
  if (error) voltar(idcampanha, "erro", error.message || "Não foi possível excluir o bloco.");
  voltar(idcampanha, "ok", "Bloco excluído.");
}
