"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import { TIPOS_FORNECEDOR, type TipoFornecedor } from "@/lib/fornecedores";

async function autorizado() {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("fornecedores")) redirect("/");
  return supabase;
}

function voltar(tipo: "ok" | "erro", msg: string): never {
  revalidatePath("/fornecedores");
  redirect(`/fornecedores?${tipo}=${encodeURIComponent(msg)}`);
}

export async function salvarFornecedor(f: FormData) {
  const supabase = await autorizado();
  const txt = (campo: string) => String(f.get(campo) ?? "").trim();
  const opcional = (campo: string) => txt(campo) || null;

  const dados = {
    nome: txt("nome"),
    endereco: opcional("endereco"),
    telefone: opcional("telefone"),
    celular: opcional("celular"),
    nomecontato: opcional("nomecontato"),
    localizacao: opcional("localizacao"),
    email: opcional("email"),
    tipo: txt("tipo"),
    descricao: opcional("descricao"),
  };

  if (!dados.nome) voltar("erro", "Informe o nome do fornecedor.");
  if (!dados.telefone && !dados.celular) voltar("erro", "Informe o telefone ou o celular.");
  if (!TIPOS_FORNECEDOR.includes(dados.tipo as TipoFornecedor)) {
    voltar("erro", "Escolha um tipo válido: Serviço, Material ou Locação.");
  }

  const id = Number(f.get("id") ?? 0);
  const { error } = Number.isInteger(id) && id > 0
    ? await supabase.from("fornecedor").update(dados).eq("idfornecedor", id)
    : await supabase.from("fornecedor").insert(dados);

  if (error) voltar("erro", "Não foi possível salvar. Confira os dados informados.");
  voltar("ok", "Fornecedor salvo.");
}

export async function excluirFornecedor(f: FormData) {
  const supabase = await autorizado();
  const id = Number(f.get("id") ?? 0);
  if (!Number.isInteger(id) || id <= 0) voltar("erro", "Pedido inválido.");

  const { error } = await supabase.from("fornecedor").delete().eq("idfornecedor", id);
  if (error) voltar("erro", "Não foi possível excluir o fornecedor.");
  voltar("ok", "Fornecedor excluído.");
}
