"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ITENS_MENU, itensMenuOrdenados, type ItemMenu } from "@/lib/menu";

export function MenuItens({ acessos }: { acessos: string[] }) {
  const caminho = usePathname();
  // A cor do texto é definida por estado. Se `text-white` ficasse na base, a
  // ordem das utilidades do Tailwind poderia sobrepor o `text-azul` do item
  // ativo e deixar o fundo e a letra brancos.
  const base = "whitespace-nowrap rounded px-3 py-2 text-sm";
  const liberados = itensMenuOrdenados(
    ITENS_MENU.filter((item) => acessos.includes(item.chave) && !item.ocultoNoMenu),
  );

  // Quando duas rotas se sobrepõem (ex.: /lencos e /lencos/cadastro), só a
  // mais específica deve aparecer como selecionada.
  const ativo = (item: ItemMenu) => {
    if (item.href === "/") return caminho === "/";
    const correspondentes = liberados.filter(
      (outro) =>
        outro.href !== "/" &&
        (caminho === outro.href || caminho.startsWith(`${outro.href}/`)),
    );
    if (!correspondentes.length) return false;
    const maisEspecifico = correspondentes.reduce((melhor, atual) =>
      atual.href.length > melhor.href.length ? atual : melhor,
    );
    return maisEspecifico.chave === item.chave;
  };

  const ligacao = (item: ItemMenu, extra = "") => (
    <Link
      key={item.chave}
      href={item.href}
      aria-current={ativo(item) ? "page" : undefined}
      className={`${base} ${extra} ${ativo(item) ? "bg-white font-semibold text-azul" : "text-white hover:bg-white/15"}`}
    >
      {item.rotulo}
    </Link>
  );

  const cadastros = liberados.filter((item) => item.grupo === "Cadastros");
  // O grupo nasce fechado. Se a pessoa estiver dentro de um cadastro, ele abre
  // sozinho para mostrar onde ela está; clicar no título abre e fecha.
  const dentroDeCadastros = cadastros.some(
    (item) => caminho === item.href || caminho.startsWith(`${item.href}/`),
  );
  const [escolha, setEscolha] = useState<boolean | null>(null);
  const aberto = escolha ?? dentroDeCadastros;

  // Sequência única do menu: itens comuns e o bloco recolhível "Cadastros"
  // ordenados pelo rótulo. Dashboard já vem primeiro em `liberados`.
  type Entrada = { tipo: "item"; item: ItemMenu } | { tipo: "cadastros" };
  const entradas: Entrada[] = [
    ...liberados
      .filter((item) => item.grupo !== "Cadastros")
      .map((item): Entrada => ({ tipo: "item", item })),
    ...(cadastros.length ? ([{ tipo: "cadastros" }] as Entrada[]) : []),
  ].sort((a, b) => {
    if (a.tipo === "item" && a.item.chave === "inicio") return -1;
    if (b.tipo === "item" && b.item.chave === "inicio") return 1;
    const rotuloA = a.tipo === "cadastros" ? "Cadastros" : a.item.rotulo;
    const rotuloB = b.tipo === "cadastros" ? "Cadastros" : b.item.rotulo;
    return rotuloA.localeCompare(rotuloB, "pt-BR", { sensitivity: "base" });
  });

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-azul-escuro bg-azul p-2 md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3">
      <div className="flex gap-1 md:mt-2 md:flex-col md:gap-0.5">
        {entradas.map((entrada) =>
          entrada.tipo === "cadastros" ? (
            <div
              key="cadastros"
              className="flex items-center gap-1 md:flex-col md:items-stretch md:gap-0.5"
            >
              <button
                type="button"
                onClick={() => setEscolha(!aberto)}
                aria-expanded={aberto}
                aria-controls="menu-cadastros"
                className={`${base} flex shrink-0 items-center gap-1.5 text-white hover:bg-white/15 ${
                  dentroDeCadastros ? "font-semibold" : ""
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`text-[10px] transition-transform ${aberto ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                Cadastros
              </button>
              {aberto && (
                <div id="menu-cadastros" className="flex gap-1 md:flex-col md:gap-0.5">
                  {cadastros.map((item) => ligacao(item, "md:pl-5"))}
                </div>
              )}
            </div>
          ) : (
            ligacao(entrada.item)
          ),
        )}
      </div>
      {!liberados.length && (
        <span className="px-3 py-2 text-sm text-white/80">Nenhum menu liberado.</span>
      )}
    </nav>
  );
}
