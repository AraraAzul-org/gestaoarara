import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { carregarEu } from "@/lib/eu";

export async function Cabecalho() {
  const supabase = await createClient();
  const eu = await carregarEu(supabase);

  return (
    <header className="border-b-4 border-amarelo bg-azul text-white">
      <div className="flex flex-wrap items-center gap-3 p-3.5">
        {/* 61 acompanha as variantes otimizadas do logo (64×74 / 128×148); 62 gerava aviso de proporção. */}
        <Image src="/logo.png" alt="Grupo Escoteiro Arara Azul" width={53} height={61} priority />
        <span className="flex-1 font-semibold">Gestão do Grupo</span>
        <Link href="/trocar-senha" className="text-sm underline">Minha senha</Link>
        <Link href="/ajuda" className="text-sm underline">Ajuda</Link>
        {eu?.dirigente && (
          <Link href="/doc-tecnica" className="text-sm underline">
            Doc. Técnica
          </Link>
        )}
        <form action="/auth/signout" method="post">
          <button className="text-sm underline">Sair</button>
        </form>
      </div>
    </header>
  );
}
