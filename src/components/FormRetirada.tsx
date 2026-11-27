"use client";

import { useState } from "react";
import type { PessoaSugestao } from "@/lib/campanhas";
import { formatarReais } from "@/lib/moeda";
import { semAcento } from "@/lib/texto";

const campo =
  "w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20";
const rotulo =
  "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600";
const btn = "rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro";

export function FormRetirada({
  action,
  idcampanha,
  idbloco,
  numero,
  numeracao,
  folhas,
  valorBloco,
  pessoas,
  hoje,
}: {
  action: (formData: FormData) => Promise<void>;
  idcampanha: number;
  idbloco: number;
  numero: number;
  numeracao: string;
  folhas: number;
  valorBloco: number;
  pessoas: PessoaSugestao[];
  hoje: string;
}) {
  const [texto, setTexto] = useState("");
  const [idpessoa, setIdpessoa] = useState(0);
  const [tipo, setTipo] = useState("");
  const listaId = `pessoas-retirada-${idbloco}`;

  function resolver(valor: string) {
    const alvo = semAcento(valor.trim());
    const encontrada = pessoas.find(
      (p) =>
        semAcento(`${p.nome} (${p.tipo})`) === alvo || semAcento(p.nome) === alvo,
    );
    setIdpessoa(encontrada?.id ?? 0);
    setTipo(encontrada?.tipo ?? "");
  }

  return (
    <form action={action} className="mt-2 grid gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
      <input type="hidden" name="idcampanha" value={idcampanha} />
      <input type="hidden" name="idbloco" value={idbloco} />
      <input type="hidden" name="idpessoa" value={idpessoa} />
      <input type="hidden" name="tipo" value={tipo} />
      <p className="text-xs text-gray-600">
        Bloco <strong>{numero}</strong> · rifas <strong>{numeracao}</strong> ·{" "}
        <strong>{folhas}</strong> folhas (bloco inteiro) · valor do bloco{" "}
        <strong>{formatarReais(valorBloco)}</strong>. A retirada é sempre do bloco inteiro;
        a divisão ocorre só no acerto.
      </p>
      <label className={rotulo}>
        Associado ou jovem *
        <input
          name="pessoa"
          list={listaId}
          required
          autoComplete="off"
          placeholder="Digite o nome"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            resolver(e.target.value);
          }}
          onBlur={() => resolver(texto)}
          className={campo}
        />
        <datalist id={listaId}>
          {pessoas.map((p) => (
            <option key={`${p.tipo}-${p.id}`} value={`${p.nome} (${p.tipo})`} />
          ))}
        </datalist>
      </label>
      <span className="-mt-2 text-[11px] text-gray-500">
        Digite ou escolha uma pessoa da lista; o tipo aparece depois do nome.
      </span>
      <label className={rotulo}>
        Nome do terceiro (se houver)
        <input
          name="descricao"
          maxLength={200}
          placeholder="Ex.: Sra. Tereza"
          className={campo}
        />
      </label>
      <label className={`${rotulo} max-w-[150px]`}>
        Data da retirada *
        <input name="dataretirada" type="date" required defaultValue={hoje} className={campo} />
      </label>
      <p className="text-xs text-gray-600">
        Quantidade de rifas entregues: <strong>{folhas}</strong> (fixa, igual ao bloco).
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btn}>
          Confirmar retirada
        </button>
      </div>
    </form>
  );
}
