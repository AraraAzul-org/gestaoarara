"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";
import { BUCKET_LENCOS } from "@/lib/lencos";
import { dataISOValida } from "@/lib/data";

const CAMPOS_TEXTO = [
  "grupoescoteiro",
  "numero",
  "uf",
  "data",
  "nomeescoteiro",
  "nomeescoteiroarara",
  "nomeatividade",
] as const;

const EXTENSOES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function exigirCadastro() {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);
  if (!eu) redirect("/login");
  if (!eu.acessos.has("lencoscadastro")) redirect("/");
  return { supabase, eu };
}

function voltarCadastro(tipo: "ok" | "erro", mensagem: string): never {
  revalidatePath("/lencos");
  revalidatePath("/lencos/cadastro");
  redirect(`/lencos/cadastro?${tipo}=${encodeURIComponent(mensagem)}`);
}

function lerCampos(f: FormData) {
  const dados: Record<string, string | null> = {};
  for (const nome of CAMPOS_TEXTO) {
    const valor = String(f.get(nome) ?? "").trim();
    dados[nome] = valor || null;
  }
  if (dados.numero && dados.numero.length > 4) {
    voltarCadastro("erro", "O número do lenço deve ter no máximo 4 caracteres.");
  }
  if (dados.uf && dados.uf.length !== 2) voltarCadastro("erro", "Informe uma UF válida.");
  if (dados.data && !dataISOValida(dados.data)) voltarCadastro("erro", "Informe uma data válida.");
  dados.observacao = String(f.get("observacao") ?? "").trim() || null;
  return dados;
}

type ResultadoFoto = { caminho: string | null; erro: string | null };

async function enviarFoto(
  supabase: SupabaseClient,
  arquivo: FormDataEntryValue | null,
  anterior: string | null,
  idusuario: number,
): Promise<ResultadoFoto> {
  if (!(arquivo instanceof File) || arquivo.size === 0) return { caminho: anterior, erro: null };
  if (arquivo.size > 5 * 1024 * 1024) {
    return { caminho: anterior, erro: "Cada foto deve ter no máximo 5 MB." };
  }
  const extensao = EXTENSOES[arquivo.type];
  if (!extensao) {
    return { caminho: anterior, erro: "Use uma imagem JPG, PNG ou WEBP." };
  }
  const caminho = `${idusuario}/${globalThis.crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from(BUCKET_LENCOS).upload(caminho, arquivo, {
    contentType: arquivo.type,
    upsert: false,
  });
  if (error) return { caminho: anterior, erro: "Não foi possível enviar a foto." };
  if (anterior) {
    await supabase.storage.from(BUCKET_LENCOS).remove([anterior]);
  }
  return { caminho, erro: null };
}

export async function criarLenco(f: FormData) {
  const { supabase, eu } = await exigirCadastro();
  const dados = lerCampos(f);

  const fotoLenco = await enviarFoto(
    supabase,
    f.get("fotolenco"),
    String(f.get("fotolencoatual") ?? "") || null,
    eu.idusuario,
  );
  const fotoEntrega = await enviarFoto(
    supabase,
    f.get("fotoentrega"),
    String(f.get("fotoentregaatual") ?? "") || null,
    eu.idusuario,
  );
  if (fotoLenco.erro || fotoEntrega.erro) {
    voltarCadastro("erro", fotoLenco.erro ?? fotoEntrega.erro ?? "Erro nas fotos.");
  }

  const { error } = await supabase.from("lenco").insert({
    ...dados,
    fotolenco: fotoLenco.caminho,
    fotoentrega: fotoEntrega.caminho,
    criadoidusuario: eu.idusuario,
  });
  if (error) {
    const enviadas = [fotoLenco.caminho, fotoEntrega.caminho].filter(Boolean) as string[];
    if (enviadas.length) await supabase.storage.from(BUCKET_LENCOS).remove(enviadas);
    voltarCadastro("erro", "Não foi possível cadastrar o lenço.");
  }
  voltarCadastro("ok", "Lenço cadastrado.");
}

export async function atualizarLenco(id: number, f: FormData) {
  const { supabase, eu } = await exigirCadastro();
  if (!Number.isInteger(id) || id <= 0) redirect("/lencos/cadastro?erro=Pedido+inv%C3%A1lido.");
  const dados = lerCampos(f);

  const fotoLenco = await enviarFoto(
    supabase,
    f.get("fotolenco"),
    String(f.get("fotolencoatual") ?? "") || null,
    eu.idusuario,
  );
  const fotoEntrega = await enviarFoto(
    supabase,
    f.get("fotoentrega"),
    String(f.get("fotoentregaatual") ?? "") || null,
    eu.idusuario,
  );
  if (fotoLenco.erro || fotoEntrega.erro) {
    voltarCadastro("erro", fotoLenco.erro ?? fotoEntrega.erro ?? "Erro nas fotos.");
  }

  const { error } = await supabase
    .from("lenco")
    .update({
      ...dados,
      fotolenco: fotoLenco.caminho,
      fotoentrega: fotoEntrega.caminho,
      alteradoem: new Date().toISOString(),
      alteradoidusuario: eu.idusuario,
    })
    .eq("idlenco", id);
  if (error) voltarCadastro("erro", "Não foi possível salvar o cadastro.");

  revalidatePath("/lencos");
  revalidatePath(`/lencos/${id}`);
  redirect(`/lencos/cadastro?ok=${encodeURIComponent("Cadastro salvo.")}`);
}

export async function excluirLenco(id: number) {
  const { supabase } = await exigirCadastro();
  if (!Number.isInteger(id) || id <= 0) voltarCadastro("erro", "Pedido inválido.");

  const { data: alvo } = await supabase
    .from("lenco")
    .select("fotolenco, fotoentrega")
    .eq("idlenco", id)
    .maybeSingle();
  if (!alvo) voltarCadastro("erro", "Cadastro não encontrado.");

  const { error } = await supabase.from("lenco").delete().eq("idlenco", id);
  if (error) voltarCadastro("erro", "Não foi possível excluir o cadastro.");

  const caminhos = [alvo.fotolenco, alvo.fotoentrega].filter(Boolean) as string[];
  if (caminhos.length) await supabase.storage.from(BUCKET_LENCOS).remove(caminhos);
  voltarCadastro("ok", "Cadastro excluído.");
}
