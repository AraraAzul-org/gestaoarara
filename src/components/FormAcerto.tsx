"use client";

import { useState } from "react";
import { formatarReais } from "@/lib/moeda";

const campo =
  "w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20";
const rotulo =
  "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600";

export function FormAcerto({
  action,
  idcampanha,
  idbloco,
  quantRetirada,
  valorBilhete,
  dataacerto,
}: {
  action: (formData: FormData) => Promise<void>;
  idcampanha: number;
  idbloco: number;
  quantRetirada: number;
  valorBilhete: number;
  dataacerto: string;
}) {
  const [vendida, setVendida] = useState(String(quantRetirada));
  const quantidade = Math.max(0, Number(vendida) || 0);
  const valor = Math.round(quantidade * valorBilhete * 100) / 100;
  const devolvido = Math.max(0, quantRetirada - quantidade);

  return (
    <form action={action} className="mt-2 grid gap-3 rounded-lg border border-gray-200 bg-gray-50/60 p-3">
      <input type="hidden" name="idcampanha" value={idcampanha} />
      <input type="hidden" name="idbloco" value={idbloco} />
      <p className="text-xs text-gray-600">
        Retiradas: <strong>{quantRetirada}</strong> · valor do bilhete:{" "}
        <strong>{formatarReais(valorBilhete)}</strong>. Você pode acertar apenas parte das rifas.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={rotulo}>
          Quantidade acertada / vendida *
          <input
            name="quantvendida"
            type="number"
            min={0}
            max={quantRetirada}
            required
            value={vendida}
            onChange={(e) => setVendida(e.target.value)}
            className={`${campo} tabular-nums`}
          />
        </label>
        <label className={`${rotulo} max-w-[150px]`}>
          Data do acerto (automática)
          <input type="date" readOnly value={dataacerto} className={campo} />
        </label>
      </div>
      <p className="text-sm text-gray-700">
        Valor do acerto ({quantidade} × {formatarReais(valorBilhete)}):{" "}
        <strong className="text-azul">{formatarReais(valor)}</strong> · Devolvido:{" "}
        <strong>{devolvido}</strong> rifa(s)
      </p>
      <p className="rounded border-l-4 border-l-amarelo bg-amarelo-claro p-2 text-xs text-gray-700">
        O que não foi vendido volta como devolvido. O valor do acerto é a quantidade vendida
        multiplicada pelo valor do bilhete cadastrado nesta campanha.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Confirmar acerto
        </button>
      </div>
    </form>
  );
}
