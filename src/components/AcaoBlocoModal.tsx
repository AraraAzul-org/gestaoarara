"use client";

import { useEffect, useId, useRef, useState } from "react";

const neutro =
  "rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50";

// Abre a ação em uma tela própria (modal). A lista de blocos continua igual:
// depois de confirmar, a página recarrega e só as informações das linhas mudam.
export function AcaoBlocoModal({
  rotulo,
  titulo,
  className = "rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50",
  children,
}: {
  rotulo: string;
  titulo: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const gatilho = useRef<HTMLButtonElement>(null);
  const botaoFechar = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (!aberto) return;
    botaoFechar.current?.focus();
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const fechar = () => {
    setAberto(false);
    gatilho.current?.focus();
  };

  return (
    <>
      <button
        ref={gatilho}
        type="button"
        onClick={() => setAberto(true)}
        className={className}
      >
        {rotulo}
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) fechar();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 text-left shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={idTitulo} className="text-base font-semibold text-azul">
                {titulo}
              </h2>
              <button
                ref={botaoFechar}
                type="button"
                onClick={fechar}
                className={neutro}
              >
                Fechar
              </button>
            </div>
            <div className="mt-3">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
