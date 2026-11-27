"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import type { TipoPessoa } from "@/lib/campanhas";

async function autorizado() {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("campanha") && !eu.acessos.has("entregablocos")) redirect("/");
  return supabase;
}

function voltar(idcampanha: number, tipo: "ok" | "erro", mensagem: string): never {
  revalidatePath("/entrega-blocos");
  revalidatePath("/campanhas");
  revalidatePath(`/campanhas/${idcampanha}`);
  revalidatePath("/campanha");
  redirect(
    `/entrega-blocos?campanha=${idcampanha}&${tipo}=${encodeURIComponent(mensagem)}&v=${Date.now()}`,
  );
}

function inteiro(f: FormData, campo: string): number {
  return Number(String(f.get(campo) ?? "").trim());
}

export async function registrarRetirada(f: FormData) {
  const supabase = await autorizado();
  const idcampanha = inteiro(f, "idcampanha");
  const idbloco = inteiro(f, "idbloco");
  const idpessoa = inteiro(f, "idpessoa");
  const tipo = String(f.get("tipo") ?? "").trim() as TipoPessoa;
  const descricao = String(f.get("descricao") ?? "").trim().slice(0, 200);
  const dataretirada = String(f.get("dataretirada") ?? "").trim();

  if (!Number.isInteger(idbloco) || idbloco <= 0) voltar(idcampanha, "erro", "Bloco inválido.");
  if (tipo !== "Associado" && tipo !== "Jovem") {
    voltar(idcampanha, "erro", "Digite ou selecione uma pessoa da lista (nome e tipo).");
  }
  if (!Number.isInteger(idpessoa) || idpessoa <= 0) {
    voltar(idcampanha, "erro", "Escolha uma pessoa da sugestão de nomes.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataretirada)) {
    voltar(idcampanha, "erro", "Informe a data da retirada.");
  }

  const { error } = await supabase.rpc("registrar_retirada", {
    p_idbloco: idbloco,
    p_tipo: tipo,
    p_idpessoa: idpessoa,
    p_descricao: descricao || null,
    p_dataretirada: dataretirada,
  });
  if (error) voltar(idcampanha, "erro", error.message || "Não foi possível registrar a retirada.");
  voltar(idcampanha, "ok", "Retirada registrada.");
}

export async function registrarAcerto(f: FormData) {
  const supabase = await autorizado();
  const idcampanha = inteiro(f, "idcampanha");
  const idbloco = inteiro(f, "idbloco");
  const quantvendida = inteiro(f, "quantvendida");

  if (!Number.isInteger(idbloco) || idbloco <= 0) voltar(idcampanha, "erro", "Bloco inválido.");
  if (!Number.isInteger(quantvendida) || quantvendida < 0) {
    voltar(idcampanha, "erro", "Informe uma quantidade válida de rifas vendidas.");
  }

  // A data do acerto é automática: o campo do formulário é apenas informativo.
  const { error } = await supabase.rpc("registrar_acerto", {
    p_idbloco: idbloco,
    p_quantvendida: quantvendida,
    p_dataacerto: null,
  });
  if (error) voltar(idcampanha, "erro", error.message || "Não foi possível registrar o acerto.");
  voltar(idcampanha, "ok", "Acerto registrado.");
}
