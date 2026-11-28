"use client";

import { useState } from "react";
import {
  STATUS_CAMPANHA,
  linhasDaCampanha,
  valorDoBloco,
  type BlocoCampanha,
  type Campanha,
} from "@/lib/campanhas";
import { formatarReais, mascararMoeda, numeroMoeda, textoMoeda } from "@/lib/moeda";
import { semAcento } from "@/lib/texto";

type LinhaFormulario = { folhas: string; inicio: string; fim: string };

const campo =
  "w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20";
const campoTabelaNumero =
  "w-16 rounded border border-gray-300 px-1.5 py-1.5 text-right text-sm tabular-nums focus:border-azul focus:outline-none focus:ring-2 focus:ring-azul/20";
const rotulo =
  "flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600";
const btn = "rounded bg-azul px-3 py-1.5 text-sm font-medium text-white hover:bg-azul-escuro";

function linhasIniciais(campanha: Campanha | null, blocos: BlocoCampanha[]): LinhaFormulario[] {
  const bruto = blocos.length
    ? blocos
        .slice()
        .sort((a, b) => a.numero - b.numero)
        .map((b) => ({
          folhas: String(b.quantbilhetes),
          inicio: String(b.numeracaoinicial),
          fim: String(b.numeracaofinal),
        }))
    : linhasDaCampanha(campanha).map((l) => ({
        folhas: String(l.folhas || ""),
        inicio: String(l.inicio || ""),
        fim: String(l.fim || ""),
      }));
  return bruto;
}

export function FormCampanha({
  action,
  campanha,
  blocos = [],
  finalizar = false,
}: {
  action: (formData: FormData) => Promise<void>;
  campanha?: Campanha | null;
  blocos?: BlocoCampanha[];
  finalizar?: boolean;
}) {
  const jaGerou = blocos.length > 0;
  const primeiras = linhasIniciais(campanha ?? null, blocos);
  const [linhas, setLinhas] = useState<LinhaFormulario[]>(primeiras);
  const [status, setStatus] = useState<string>(
    finalizar ? "finalizada" : String(campanha?.status ?? "rascunho"),
  );
  const [valorBilhete, setValorBilhete] = useState(
    campanha ? textoMoeda(campanha.valorbilhete) : "",
  );
  const [valorPremios, setValorPremios] = useState(
    campanha?.valorpremios ? textoMoeda(campanha.valorpremios) : "",
  );
  const [ganhadores, setGanhadores] = useState(String(campanha?.ganhadores ?? ""));
  const [quantidadeBlocos, setQuantidadeBlocos] = useState("");
  const [folhasPorBloco, setFolhasPorBloco] = useState("");
  const [numeracaoInicial, setNumeracaoInicial] = useState(
    campanha && !jaGerou ? String(campanha.numeracaoinicial || "") : "",
  );
  const [erro, setErro] = useState("");

  const folhasTotais = linhas.reduce((soma, linha) => soma + (Number(linha.folhas) || 0), 0);
  const valorTotal = Math.round(numeroMoeda(valorBilhete) * folhasTotais * 100) / 100;
  const primeiraNumeracao = linhas.length
    ? Number(linhas[0].inicio) || Number(numeracaoInicial) || 1
    : Number(numeracaoInicial) || 1;

  function alterarLinha(indice: number, campo: keyof LinhaFormulario, valor: string) {
    setLinhas((anteriores) =>
      anteriores.map((linha, i) => {
        if (i !== indice) return linha;
        const proxima = { ...linha, [campo]: valor };
        if (campo === "folhas" || campo === "inicio") {
          const inicio = Math.max(1, Number(proxima.inicio) || 1);
          const folhas = Math.max(1, Number(proxima.folhas) || 1);
          proxima.fim = String(Math.max(inicio, inicio + folhas - 1));
        }
        return proxima;
      }),
    );
  }

  function gerarBlocos() {
    if (jaGerou) return;
    const folhasTexto = folhasPorBloco.trim();
    if (!folhasTexto) {
      setErro("Informe as folhas por bloco e clique em Gerar blocos.");
      return;
    }
    const folhas = Number(folhasTexto);
    const quantidadeTexto = quantidadeBlocos.trim();
    const quantidade = quantidadeTexto === "" ? 1 : Number(quantidadeTexto);
    if (!Number.isInteger(folhas) || folhas <= 0) {
      setErro("A quantidade de folhas por bloco deve ser um número inteiro maior que zero.");
      return;
    }
    if (!Number.isInteger(quantidade) || quantidade <= 0 || quantidade > 1000) {
      setErro("A quantidade de blocos deve estar entre 1 e 1000.");
      return;
    }

    let cursor = linhas.length
      ? (Number(linhas[linhas.length - 1].fim) || 0) + 1
      : Number(numeracaoInicial) || 1;
    const novas: LinhaFormulario[] = [];
    for (let i = 0; i < quantidade; i += 1) {
      novas.push({
        folhas: String(folhas),
        inicio: String(cursor),
        fim: String(cursor + folhas - 1),
      });
      cursor += folhas;
    }
    setLinhas((anteriores) => [...anteriores, ...novas]);
    setQuantidadeBlocos("");
    setFolhasPorBloco("");
    setNumeracaoInicial("");
    setErro("");
  }

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    if (!(numeroMoeda(valorBilhete) > 0)) {
      evento.preventDefault();
      setErro("Informe o valor do bilhete em reais.");
      return;
    }
    if (status === "finalizada" && !semAcento(ganhadores.trim())) {
      evento.preventDefault();
      setErro("Informe os ganhadores para finalizar a campanha.");
      return;
    }
    if (status !== "rascunho" && !linhas.length) {
      evento.preventDefault();
      setErro("Cadastre ao menos um bloco na lista de blocos.");
      return;
    }
    setErro("");
  }

  const titulo = campanha ? "Editar campanha" : "Nova campanha";

  return (
    <form action={action} onSubmit={aoEnviar} className="mt-2 grid gap-4 sm:grid-cols-2">
      {campanha && <input type="hidden" name="id" value={campanha.idcampanha} />}
      <input
        type="hidden"
        name="numeracaoinicial"
        value={primeiraNumeracao}
      />
      <input
        type="hidden"
        name="blocos"
        value={JSON.stringify(
          linhas.map((linha) => ({
            folhas: Number(linha.folhas) || 0,
            inicio: Number(linha.inicio) || 0,
            fim: Number(linha.fim) || 0,
          })),
        )}
      />

      <label className={`${rotulo} sm:col-span-2`}>
        Título da campanha *
        <input
          name="titulo"
          required
          maxLength={200}
          defaultValue={campanha?.titulo ?? ""}
          className={campo}
        />
      </label>

      <label className={rotulo}>
        Data inicial *
        <input
          name="datainicial"
          type="date"
          required
          defaultValue={campanha?.datainicial ?? ""}
          className={`${campo} max-w-[150px]`}
        />
      </label>
      <label className={rotulo}>
        Data final *
        <input
          name="datafinal"
          type="date"
          required
          defaultValue={campanha?.datafinal ?? ""}
          className={`${campo} max-w-[150px]`}
        />
      </label>
      <label className={rotulo}>
        Data do sorteio
        <input
          name="datasorteio"
          type="date"
          defaultValue={campanha?.datasorteio ?? ""}
          className={`${campo} max-w-[150px]`}
        />
      </label>
      <label className={rotulo}>
        Status *
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className={campo}>
          {STATUS_CAMPANHA.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </label>

      <label className={rotulo}>
        Valor do bilhete (R$) *
        <input
          name="valorbilhete"
          inputMode="decimal"
          required
          placeholder="R$ 0,00"
          value={valorBilhete}
          onChange={(evento) => setValorBilhete(mascararMoeda(evento.target.value))}
          onBlur={() =>
            setValorBilhete(
              valorBilhete.trim() ? textoMoeda(numeroMoeda(valorBilhete)) : "",
            )
          }
          className={`${campo} max-w-[175px] text-right tabular-nums`}
        />
      </label>
      <label className={rotulo}>
        Quantidade de bilhetes (total)
        <input
          readOnly
          tabIndex={-1}
          value={folhasTotais.toLocaleString("pt-BR")}
          className={`${campo} max-w-[175px] bg-gray-50 text-right tabular-nums`}
        />
      </label>
      <label className={rotulo}>
        Valor total da campanha (calculado)
        <input
          readOnly
          tabIndex={-1}
          value={textoMoeda(valorTotal)}
          className={`${campo} max-w-[175px] bg-gray-50 text-right tabular-nums`}
        />
      </label>
      <label className={rotulo}>
        Valor do(s) prêmio(s)
        <input
          name="valorpremios"
          inputMode="decimal"
          placeholder="R$ 0,00"
          value={valorPremios}
          onChange={(evento) => setValorPremios(mascararMoeda(evento.target.value))}
          onBlur={() =>
            setValorPremios(
              valorPremios.trim() ? textoMoeda(numeroMoeda(valorPremios)) : "",
            )
          }
          className={`${campo} max-w-[175px] text-right tabular-nums`}
        />
      </label>

      <label className={`${rotulo} sm:col-span-2`}>
        Prêmios
        <textarea
          name="premios"
          rows={2}
          defaultValue={campanha?.premios ?? ""}
          className={`${campo} resize-y`}
        />
      </label>
      <label className={`${rotulo} sm:col-span-2`}>
        Descritivo da campanha
        <textarea
          name="descritivo"
          rows={2}
          defaultValue={campanha?.descritivo ?? ""}
          className={`${campo} resize-y`}
        />
      </label>

      <section className="rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 p-3 sm:col-span-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-azul">
          Blocos e folhas da campanha
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Informe as <strong>folhas</strong> e clique em <strong>Gerar blocos</strong>: em branco gera 1 bloco;
          informando a quantidade gera vários. A folha inicial e a final ficam gravadas em cada bloco e
          um bloco novo começa depois do último gravado, sem recalcular os anteriores.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className={rotulo}>
            Quantidade de blocos
            <input
              type="number"
              min={1}
              max={1000}
              disabled={jaGerou}
              value={quantidadeBlocos}
              onChange={(e) => setQuantidadeBlocos(e.target.value)}
              placeholder="Ex.: 98"
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Folhas por bloco
            <input
              type="number"
              min={1}
              disabled={jaGerou}
              value={folhasPorBloco}
              onChange={(e) => setFolhasPorBloco(e.target.value)}
              placeholder="Ex.: 20"
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Numeração inicial
            <input
              type="number"
              min={1}
              disabled={jaGerou}
              value={numeracaoInicial}
              onChange={(e) => setNumeracaoInicial(e.target.value)}
              placeholder="Ex.: 100"
              className={campo}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={gerarBlocos} disabled={jaGerou} className={btn}>
            Gerar blocos
          </button>
          <span className="text-xs font-semibold text-indigo-900">
            {linhas.length
              ? `${linhas.length} bloco(s) · ${folhasTotais.toLocaleString("pt-BR")} folha(s) · numeração ${linhas[0].inicio}–${linhas[linhas.length - 1].fim}`
              : "Nenhum bloco · informe as folhas para gerar"}
          </span>
        </div>
        {jaGerou && (
          <p className="mt-2 text-xs text-indigo-900">
            Os blocos desta campanha já foram gerados. Para acrescentar outro, use{" "}
            <strong>Novo bloco</strong> na tela de detalhes da campanha.
          </p>
        )}
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-azul text-[11px] uppercase tracking-wide text-white">
              <tr>
                <th className="px-2 py-2 text-right">Bloco</th>
                <th className="px-2 py-2 text-right">Folha inicial</th>
                <th className="px-2 py-2 text-right">Folhas</th>
                <th className="px-2 py-2 text-right">Folha final</th>
                <th className="px-2 py-2 text-right">Valor do bloco</th>
                <th className="px-2 py-2" aria-label="Ações" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!linhas.length && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-xs text-gray-500">
                    Nenhum bloco cadastrado. Informe as folhas e clique em{" "}
                    <strong>Gerar blocos</strong>.
                  </td>
                </tr>
              )}
              {linhas.map((linha, indice) => (
                <tr key={indice}>
                  <td className="px-2 py-1.5 text-right tabular-nums">{indice + 1}</td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min={1}
                      disabled={jaGerou}
                      value={linha.inicio}
                      onChange={(e) => alterarLinha(indice, "inicio", e.target.value)}
                      className={campoTabelaNumero}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min={1}
                      disabled={jaGerou}
                      value={linha.folhas}
                      onChange={(e) => alterarLinha(indice, "folhas", e.target.value)}
                      className={campoTabelaNumero}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min={1}
                      disabled={jaGerou}
                      value={linha.fim}
                      onChange={(e) => alterarLinha(indice, "fim", e.target.value)}
                      className={campoTabelaNumero}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {formatarReais(valorDoBloco(linha.folhas, valorBilhete))}
                  </td>
                  <td className="px-2 py-1.5">
                    {!jaGerou && (
                      <button
                        type="button"
                        onClick={() => setLinhas((anteriores) => anteriores.filter((_, i) => i !== indice))}
                        className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Remover
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 text-xs font-semibold">
              <tr>
                <th colSpan={2} className="px-2 py-2 text-left">Total de folhas</th>
                <th className="px-2 py-2 text-right tabular-nums">{folhasTotais.toLocaleString("pt-BR")}</th>
                <th className="px-2 py-2" />
                <th className="px-2 py-2 text-right tabular-nums">{textoMoeda(valorTotal)}</th>
                <th className="px-2 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {status === "finalizada" && (
        <label className={`${rotulo} sm:col-span-2`}>
          Descrição dos ganhadores *
          <textarea
            name="ganhadores"
            required
            rows={2}
            value={ganhadores}
            onChange={(e) => setGanhadores(e.target.value)}
            className={`${campo} resize-y`}
          />
        </label>
      )}

      <div className="sm:col-span-2">
        {erro && (
          <p role="alert" className="mb-2 rounded bg-red-50 p-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btn}>
            {titulo === "Editar campanha" ? "Salvar alterações" : "Salvar campanha"}
          </button>
          <span className="text-xs text-gray-600">
            Valor do bloco = valor do bilhete × folhas do bloco. Valor do acerto = quantidade vendida × valor do
            bilhete.
          </span>
        </div>
      </div>
    </form>
  );
}
