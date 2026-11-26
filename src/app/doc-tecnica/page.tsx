import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarSessao } from "@/lib/eu";
import { Shell } from "@/components/Shell";
import { primeiraRota } from "@/lib/menu";

export const instant = false;

const cartao = "mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm";
const titulo = "text-base font-semibold text-azul";

function Secao({ id, titulo: nome, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cartao}>
      <h2 className={titulo}>{nome}</h2>
      <div className="mt-2 space-y-2 text-sm text-gray-700">{children}</div>
    </section>
  );
}

export default async function DocumentacaoTecnica() {
  const supabase = await createClient();
  const sessao = await carregarSessao(supabase);
  if (!sessao) redirect("/login");
  const { eu, email } = sessao;
  if (!eu) {
    return (
      <Shell>
        <main className="max-w-xl p-6">
          <h1 className="text-xl font-semibold text-azul">Acesso não liberado</h1>
          <p className="mt-2 text-sm">O e-mail {email} não está cadastrado ou está inativo.</p>
        </main>
      </Shell>
    );
  }
  if (!eu.acessos.has("inicio")) redirect(primeiraRota(eu.acessos));
  // A barra superior só mostra o link para dirigentes; a rota também protege o conteúdo.
  if (!eu.dirigente) redirect("/");

  return (
    <Shell>
      <main className="max-w-5xl p-4 lg:p-6">
        <h1 className="text-xl font-semibold text-azul">Documentação técnica</h1>
        <p className="mt-1 text-sm text-gray-600">
          Visão operacional da Gestão do Grupo: ambientes, autenticação, banco, storage, backup e restauração. Acesso
          restrito ao perfil Dirigente.
        </p>

        <nav className={cartao} aria-label="Índice da documentação técnica">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Neste documento</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {[
              ["visao", "Visão geral"],
              ["ambientes", "Ambientes"],
              ["acesso", "Acesso e permissões"],
              ["dados", "Banco de dados"],
              ["storage", "Storage"],
              ["backup", "Backup e restore"],
              ["segredos", "Segredos e variáveis"],
              ["operacao", "Operação local"],
            ].map(([id, rotulo]) => (
              <a key={id} href={`#${id}`} className="rounded bg-azul/10 px-2 py-1 text-azul hover:bg-azul/20">
                {rotulo}
              </a>
            ))}
          </div>
        </nav>

        <Secao id="visao" titulo="Visão geral e stack">
          <p>
            Aplicação web para gestão de adultos, jovens, promessas, lenços, questionários e avaliações do Grupo
            Escoteiro Arara Azul. O dashboard respeita o ramo do usuário e os acessos liberados no banco.
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Frontend/backend:</strong> Next.js 16.4.5 (App Router, React 19, TypeScript, Tailwind CSS 4),
              com Cache Components habilitado.
            </li>
            <li>
              <strong>Dados e autenticação:</strong> Supabase (Postgres, Auth, Storage, RLS, RPC e Edge Functions).
            </li>
            <li>
              <strong>Hospedagem:</strong> Vercel, com deploy automático a cada push na branch <code>main</code>.
            </li>
            <li>
              <strong>Backup:</strong> GitHub Actions + Dropbox (criptografia AES256, somente nuvem).
            </li>
          </ul>
        </Secao>

        <Secao id="ambientes" titulo="Ambientes e endereços">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Produção:</strong>{" "}
              <a className="text-azul underline" href="https://gestaoarara.vercel.app" target="_blank" rel="noreferrer">
                gestaoarara.vercel.app
              </a>{" "}
              e{" "}
              <a
                className="text-azul underline"
                href="https://gestaoarara.araraazul.org.br"
                target="_blank"
                rel="noreferrer"
              >
                gestaoarara.araraazul.org.br
              </a>
              .
            </li>
            <li>
              <strong>Projeto Supabase:</strong> Gestão Arara Azul (<code>gnosjzdguifktkspxwkt</code>), região{" "}
              <code>us-west-2</code>, organização AraraAzul.
            </li>
            <li>
              <strong>Repositório:</strong>{" "}
              <a
                className="text-azul underline"
                href="https://github.com/AraraAzul-org/gestaoarara"
                target="_blank"
                rel="noreferrer"
              >
                AraraAzul-org/gestaoarara
              </a>
              , branch <code>main</code>.
            </li>
            <li>
              <strong>Local:</strong> <code>npm run dev</code> em <code>http://localhost:3000</code>.
            </li>
          </ul>
        </Secao>

        <Secao id="acesso" titulo="Autenticação e autorização">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              A sessão é lida com <code>@supabase/ssr</code>. O proxy (<code>src/proxy.ts</code>) redireciona quem não
              está autenticado para <code>/login</code> e força <code>/trocar-senha</code> quando{" "}
              <code>app_metadata.trocar_senha</code> é verdadeiro. Rotas públicas: <code>/login</code>,{" "}
              <code>/auth</code>, <code>/privacidade</code>, <code>/termos</code>.
            </li>
            <li>
              O vínculo de login é feito por <code>usuario.auth_user_id = claims.sub</code>. O e-mail e o UUID vêm dos
              claims; nome, linha, ramo e cargo vêm da tabela <code>usuario</code>.
            </li>
            <li>
              <strong>Menus e rotas:</strong> a fonte da verdade é <code>usuario_menu.chave</code> com{" "}
              <code>liberado = true</code>. Esconder um item do menu também bloqueia a rota. Em{" "}
              <code>fornecedor</code>, a gravação exige <code>private.pode_acesso(&apos;fornecedores&apos;)</code>,
              enquanto a leitura aceita também <code>fornecedoresconsulta</code> numa política <code>SELECT</code>
              separada. Assim a consulta em <code>/consulta-fornecedores</code> pode ser liberada sem dar acesso ao
              cadastro. A busca usa <code>websearch_to_tsquery</code> com configuração <code>portuguese</code> e índice
              GIN na coluna gerada <code>busca</code>.
            </li>
            <li>
              <strong>Dirigente:</strong> <code>cargo.avalia = true</code> <em>e</em> <code>usuario.linha =
              &quot;Dirigente&quot;</code>. É o perfil que vê “Doc. Técnica” e os gráficos completos. Já{" "}
              <code>diretor</code> significa apenas <code>cargo.avalia</code> e vale para regras de avaliação.
            </li>
            <li>
              <strong>Escotista:</strong> <code>membrogrupo = true</code> sem a liberação <code>resultados</code>. No
              dashboard, vê o gráfico de jovens, as promessas do próprio ramo (<code>usuario.idramo</code>) e a lista
              de adultos/jovens do ramo sem promessa (ou sem acolhida, para filhotes).
            </li>
            <li>
              Criação/alteração de login e e-mail passa pela Edge Function <code>gerir-acesso</code> (v4,{" "}
              <code>verify_jwt = false</code>) e pela tabela temporária <code>cadastros_autorizados</code>.
            </li>
          </ul>
        </Secao>

        <Secao id="dados" titulo="Banco de dados">
          <p>
            O schema, as políticas de RLS, os triggers e as funções vivem no projeto Supabase, não neste repositório.
            Há 22 migrações aplicadas em <code>supabase_migrations.schema_migrations</code>, de{" "}
            <code>20261106104809</code> (criar_tabelas_autoavaliacao) a <code>20261120025723</code> (cria_modulo_lencos).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-1 pr-3">Tabela (public)</th>
                  <th className="py-1 pr-3">Linhas</th>
                  <th className="py-1">Papel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["usuario", "43", "Adultos, vínculo de login, ramo e linha"],
                  ["usuario_menu", "731", "Liberações de menu por usuário"],
                  ["jovem", "77", "Cadastro de jovens e datas de promessa"],
                  ["ramo / situacao / cargo", "7 / 7 / 10", "Tabelas de apoio"],
                  ["fornecedor", "0", "Fornecedores e busca textual por nome/descrição"],
                  ["questionario / etapa", "2 / 8", "Questionários e etapas (Pontua / Não Pontua)"],
                  ["pergunta / pontuacao", "32 / 124", "Perguntas e opções com nota"],
                  ["resposta / avaliacao / avaliacaousuario", "124 / 1 / 5", "Respostas e ciclos de avaliação"],
                  ["ppf / ppfitem", "3 / 43", "Plano de progressão pessoal"],
                  ["lenco", "1", "Registros de lenços"],
                  ["acessolog", "188", "Log de acesso por opção do menu"],
                  ["cadastros_autorizados", "0", "Autorização temporária de criação de login"],
                ].map(([tabela, linhas, papel]) => (
                  <tr key={tabela}>
                    <td className="py-1 pr-3 font-medium text-gray-900">
                      <code>{tabela}</code>
                    </td>
                    <td className="py-1 pr-3">{linhas}</td>
                    <td className="py-1">{papel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Contagens observadas em 23/11/2026; o backup diário grava contagens atualizadas em <code>manifest.json</code>.
          </p>
          <p>
            RPCs usadas pelo app: <code>registrar_acesso</code>, <code>cancelar_avaliacao</code>,{" "}
            <code>gerar_avaliacao</code>, <code>gerar_avaliacao_selecionados</code>, <code>concluir_nivel</code> e{" "}
            <code>gerar_ppf</code>.
          </p>
        </Secao>

        <Secao id="storage" titulo="Storage">
          <p>
            Bucket privado <code>lencos</code>. As fotos do lenço e da entrega são enviadas para{" "}
            <code>{"{idusuario}/{uuid}.{extensao}"}</code> e exibidas por URLs assinadas válidas por 1 hora
            (<code>src/lib/lencos.ts</code>). Limite: JPG, PNG ou WEBP de até 5 MB por arquivo.
          </p>
          <p className="text-xs text-gray-500">Os bytes dos objetos não saem no dump SQL: o backup os baixa separadamente.</p>
        </Secao>

        <Secao id="backup" titulo="Backup e restauração">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Diário:</strong> <code>backup-diario.yml</code> às 03:00 UTC (00:00 Brasília) + execução manual.
              Exporta papéis, schema, dados, migrações, metadados, config do Auth, todos os objetos do Storage e o
              código das Edge Functions; compacta, cifra em AES256, valida sha256 e descriptografa antes e depois do
              upload. Retenção de 30 dias (3 arquivos mais recentes) no Dropbox.
            </li>
            <li>
              <strong>Mensal:</strong> <code>restore-mensal.yml</code> no dia 1º às 04:00 UTC (01:00 Brasília) + manual.
              Baixa o backup mais recente, valida sha256, sobe stack Supabase local, restaura e compara contagens.
            </li>
            <li>
              <strong>Restore manual:</strong> aplicar na ordem <code>roles.sql</code>, <code>schema.sql</code>,{" "}
              <code>data.sql</code>, <code>migrations.sql</code>; reenviar <code>storage/&lt;bucket&gt;/...</code>;
              reimplantar <code>functions/&lt;slug&gt;/</code>; aplicar <code>auth-config.json</code>; ajustar envs do
              Vercel e segredos de funções que a API não lê.
            </li>
            <li>
              <strong>Última validação:</strong> backup <code>45264909991</code> e restore <code>45265368607</code>,
              ambos concluídos em 23/11/2026 com sha256 conferido.
            </li>
            <li>
              Procedimento completo e solução de problemas:{" "}
              <a
                className="text-azul underline"
                href="https://github.com/AraraAzul-org/gestaoarara/blob/main/.github/BACKUP.md"
                target="_blank"
                rel="noreferrer"
              >
                .github/BACKUP.md
              </a>
              .
            </li>
          </ul>
        </Secao>

        <Secao id="segredos" titulo="Segredos e variáveis">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Navegador (públicos):</strong> <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
              <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>. Estão em <code>.env.local</code> (ignorado pelo git) e
              no Vercel. A proteção é feita por RLS.
            </li>
            <li>
              <strong>Servidor (não vai ao navegador):</strong> <code>SUPABASE_SERVICE_ROLE_KEY</code> está reservada
              para <code>src/lib/supabase/admin.ts</code> (uso em Server Actions). Hoje não há consumo ativo dela na
              aplicação e ela não está configurada no Vercel.
            </li>
            <li>
              <strong>GitHub Actions:</strong> <code>SUPABASE_DB_URL</code>, <code>SUPABASE_DB_PASSWORD</code>,{" "}
              <code>SUPABASE_SERVICE_ROLE_KEY_V2</code> (<code>sb_secret_...</code>),{" "}
              <code>SUPABASE_ACCESS_TOKEN</code>, <code>BACKUP_PASSPHRASE</code>, <code>DROPBOX_APP_KEY</code>,{" "}
              <code>DROPBOX_APP_SECRET</code> e <code>DROPBOX_REFRESH_TOKEN</code>. Nenhum valor é exibido em logs.
            </li>
            <li>
              O segredo antigo <code>SUPABASE_SERVICE_ROLE_KEY</code> segue cadastrado no GitHub, mas{" "}
              <strong>não é mais usado</strong> pelo backup; a chave em uso é a <code>_V2</code>.
            </li>
            <li>Nunca commite <code>.env.local</code>, tokens ou chaves secretas.</li>
          </ul>
        </Secao>

        <Secao id="operacao" titulo="Operação local">
          <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-white">{`cp .env.example .env.local
npm install
npm run dev       # http://localhost:3000
npm run lint
npm run build`}</pre>
          <p>
            Antes de publicar: validar build e lint, conferir as telas com usuários de teste, commitar, dar push na{" "}
            <code>main</code> e conferir o deploy no Vercel. As regras específicas deste Next.js 16 estão em{" "}
            <code>AGENTS.md</code> e na documentação instalada em <code>node_modules/next/dist/docs/</code>.
          </p>
          <p>
            Voltar para a <Link href="/" className="text-azul underline">Dashboard</Link> ou abrir a{" "}
            <Link href="/ajuda" className="text-azul underline">Ajuda</Link>.
          </p>
        </Secao>
      </main>
    </Shell>
  );
}
