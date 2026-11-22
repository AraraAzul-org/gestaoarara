"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ITENS_MENU, MENU_GRUPOS, itensMenuOrdenados, type ItemMenu } from "@/lib/menu";

export function MenuItens({ acessos }: { acessos: string[] }) {
  const caminho = usePathname();
  const base = "whitespace-nowrap rounded px-3 py-2 text-sm text-white";
  const liberados = itensMenuOrdenados(
    ITENS_MENU.filter((item) => acessos.includes(item.chave)),
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
      className={`${base} ${extra} ${ativo(item) ? "bg-white font-semibold text-azul" : "hover:bg-white/15"}`}
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

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-azul-escuro bg-azul p-2 md:w-60 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3">
      {MENU_GRUPOS.map((grupo) => {
        const itens = liberados.filter((item) => item.grupo === grupo);
        if (!itens.length) return null;

        if (grupo === "Cadastros") {
          return (
            <div key={grupo} className="flex items-center gap-1 md:mt-2 md:flex-col md:items-stretch md:gap-0.5">
              <button
                type="button"
                onClick={() => setEscolha(!aberto)}
                aria-expanded={aberto}
                aria-controls="menu-cadastros"
                className={`${base} flex shrink-0 items-center gap-1.5 hover:bg-white/15 ${
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
          );
        }

        return (
          <div key={grupo} className="flex gap-1 md:mt-2 md:flex-col md:gap-0.5">
            {itens.map((item) => ligacao(item))}
          </div>
        );
      })}
      {!liberados.length && (
        <span className="px-3 py-2 text-sm text-white/80">Nenhum menu liberado.</span>
      )}
    </nav>
  );
}
