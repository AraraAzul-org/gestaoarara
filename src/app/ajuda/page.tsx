import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarSessao } from "@/lib/eu";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = { title: "Ajuda · Gestão do Grupo" };
export const instant = false;

const INDICE = [
  ["primeiros-passos", "Primeiros passos"],
  ["dashboard", "Dashboard"],
  ["jovens", "Jovens"],
  ["promessas", "Promessas"],
  ["lencos", "Lenços"],
  ["cadastros", "Cadastros"],
  ["campanhas", "Campanhas e rifas"],
  ["minhas-avaliacoes", "Minhas avaliações"],
  ["meu-ppf", "Meu PPF"],
  ["meus-assessorados", "Meus assessorados"],
  ["parecer", "Parecer"],
  ["resultados", "Resultados"],
  ["acessolog", "Log de acesso"],
  ["permissoes", "Permissões"],
  ["faq", "Perguntas frequentes"],
] as const;

function Secao({
  id,
  titulo,
  rota,
  children,
}: {
  id: string;
  titulo: string;
  rota?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mt-6 scroll-mt-4 overflow-hidden rounded-lg border border-gray-200 border-l-4 border-l-amarelo bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-azul">{titulo}</h2>
        {rota && (
          <Link href={rota} className="text-xs font-medium text-azul underline">
            Abrir módulo
          </Link>
        )}
      </div>
      <div className="mt-2 space-y-2 text-sm text-gray-700">{children}</div>
    </section>
  );
}

function Passos({ children }: { children: React.ReactNode }) {
  return <ol className="ml-5 list-decimal space-y-1">{children}</ol>;
}

function Itens({ children }: { children: React.ReactNode }) {
  return <ul className="ml-5 list-disc space-y-1">{children}</ul>;
}

function Nota({ titulo = "Dica", children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <p className="rounded border border-amarelo/40 bg-amarelo/10 px-3 py-2 text-xs text-gray-700">
      <strong>{titulo}:</strong> {children}
    </p>
  );
}

export default async function Ajuda() {
  const supabase = await createClient();
  const sessao = await carregarSessao(supabase);
  if (!sessao) redirect("/login");

  return (
    <Shell>
      <main className="max-w-5xl p-4">
        <h1 className="text-xl font-semibold text-azul">Ajuda — Guia do sistema</h1>
        <p className="mt-1 text-sm text-gray-600">
          Guia completo da Gestão do Grupo do Grupo Escoteiro Arara Azul. Aqui você encontra para que serve cada
          tela, como preencher os formulários e quais regras de acesso se aplicam.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          O menu lateral mostra somente os módulos liberados para o seu usuário. Se algum item faltar, peça à direção
          para liberá-lo na tela de acessos — não é possível liberar o próprio menu por aqui.
        </p>

        <nav className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm" aria-label="Índice da ajuda">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Neste guia</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {INDICE.map(([id, rotulo]) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded bg-azul/5 px-2 py-1 text-xs font-medium text-azul hover:bg-azul/10"
              >
                {rotulo}
              </a>
            ))}
          </div>
        </nav>

        <Secao id="primeiros-passos" titulo="Primeiros passos">
          <Passos>
            <li>
              Entre com o e-mail cadastrado pela direção e a sua senha. Se a senha ainda for temporária, o sistema vai
              pedir para criar uma nova em <strong>Minha senha</strong> antes de liberar as outras telas.
            </li>
            <li>
              No topo da tela: <strong>Minha senha</strong> altera a senha (mínimo de 8 caracteres),{" "}
              <strong>Ajuda</strong> abre este guia, <strong>Doc. Técnica</strong> abre a documentação para dirigentes e{" "}
              <strong>Sair</strong> encerra a sessão.
            </li>
            <li>
              Use o menu lateral para navegar. O grupo <strong>Cadastros</strong> começa fechado: clique no ▶ para abrir
              o submenu, onde ficam Jovens, Associados, Ramos, Funções, Situações, Fornecedores, Cadastro de campanha,
              Avaliações, Questionários e Lenços. No grupo <strong>Geral</strong> fica <strong>Campanhas</strong> (consulta);
              a <strong>Entrega de blocos</strong> é acessada por um botão dentro dessa tela, não é item do menu. A consulta
              somente leitura de fornecedores fica fora desse grupo, no item <strong>Fornecedores</strong> (somente leitura).
              O item com fundo branco e texto azul indica a tela atual.
            </li>
            <li>
              Se aparecer “Nenhum menu liberado” ou “Acesso não liberado”, seu cadastro ainda não tem liberações ou está
              inativo. Procure a direção do grupo.
            </li>
          </Passos>
          <Nota>
            Este guia é livre para qualquer pessoa logada: ele fica no cabeçalho, não ocupa o menu lateral e não depende
            das liberações da tabela de acessos.
          </Nota>
        </Secao>

        <Secao id="dashboard" titulo="Dashboard" rota="/">
          <p>
            É a página inicial. Se o seu usuário tiver a chave do Dashboard, você cai nela ao entrar; se não tiver, o
            sistema abre a primeira tela liberada. No topo aparecem seu nome, cargo e a avaliação aberta mais recente
            (ou “Nenhuma avaliação aberta”).
          </p>
          <Itens>
            <li>
              <strong>Associados por situação:</strong> gráfico de barras com a quantidade de associados e o tempo médio
              na situação. Só entram associados ativos e que fazem parte do grupo. A ordem das situações é fixa:
              Formação não iniciada, Curso Preliminar, Nível Preliminar, Curso Intermediário, Nível Intermediário, Curso
              Avançado e Nível Avançado; quem está sem situação fica por último. Esse bloco exige a liberação de
              Resultados. A antiga tabela de associados não é mais exibida.
            </li>
            <li>
              <strong>Associados por Ramos e Jovens por ramo:</strong> para dirigentes, dois gráficos adicionais mostram o
              total de adultos ativos do grupo em cada ramo (inclusive “Sem ramo”) e de jovens ativos somente em
              Filhotes, Lobinho, Escoteiro, Sênior e Pioneiro — ramos fixos, independentemente do cadastro da tabela de
              ramos. Com isso o Dashboard passa a ter três gráficos. O gráfico de jovens tem filtro por ramo: o dirigente
              pode escolher um ramo ou ver todos; o escotista vê automaticamente somente o ramo do próprio usuário, sem
              possibilidade de trocar.
            </li>
            <li>
              <strong>Promessas do ramo:</strong> para escotistas, mostra quem completa anos de promessa no mês atual,
              no mesmo ramo do usuário, com Nome, Tipo, Registro, Data, Dedução, Anos de promessa e Anos no ramo. Quem
              tem liberação de Resultados não vê esse bloco, pois já acompanha os resultados gerais.
            </li>
            <li>
              <strong>Sem promessa / acolhida:</strong> logo abaixo, para escotistas, lista os adultos e jovens ativos
              do próprio ramo que ainda não têm promessa registrada — ou acolhida, no caso dos filhotes — com Nome,
              Tipo, Registro, Data do registro, Tempo até hoje e Situação. A lista não depende do mês.
            </li>
            <li>
              Associados que não fazem parte do grupo veem o aviso de que seu acesso está limitado a Meus assessorados.
            </li>
          </Itens>
        </Secao>

        <Secao id="jovens" titulo="Jovens" rota="/jovens">
          <p>Cadastro e acompanhamento dos jovens, com cálculo automático de anos de promessa e de tempo no ramo.</p>
          <Itens>
            <li>
              <strong>Busca:</strong> informe parte do nome (acentos e maiúsculas são ignorados) e clique em{" "}
              <strong>Pesquisar</strong>. A lista só aparece depois da pesquisa. Use <strong>Mostra Inativos</strong> para
              incluir jovens inativados e <strong>Limpar filtro</strong> para recomeçar.
            </li>
            <li>
              <strong>Ramo:</strong> dirigentes (função que avalia e linha Dirigente) podem escolher um ramo ou{" "}
              <strong>Todos os ramos</strong>, tanto na listagem quanto no gráfico do Dashboard. Quem não é dirigente fica
              limitado ao próprio ramo: na listagem não recebe o filtro e no Dashboard vê o ramo fixado. Qualquer pessoa
              com acesso a Jovens pode cadastrar ou editar jovens de qualquer ramo.
            </li>
            <li>
              <strong>Cadastrar:</strong> abre o formulário na própria tela. Primeira linha: Registro (alfanumérico),
              Nome e Ramo. Segunda linha: Data de registro, Data de nascimento e Data da medalha Bons Serviços.
            </li>
            <li>
              Depois do campo <strong>Ativo</strong> vêm os blocos por ramo. Em Filhotes vale a data de acolhida; em
              Lobinho, Escoteiro, Sênior e Pioneiro informe data de passagem, data da promessa e dedução em anos. A
              prévia mostra os anos calculados até o fim do mês, o total de deduções e os anos em cada ramo.
            </li>
            <li>
              Ao desmarcar Ativo, o sistema registra a data e quem inativou. Na linha de um jovem use{" "}
              <strong>Editar</strong> para corrigir os dados. Registro duplicado é recusado.
            </li>
            <li>
              A importação em massa é feita pela direção fora do aplicativo, com planilha modelo e script próprios; não
              há botão de importação nesta tela.
            </li>
          </Itens>
        </Secao>

        <Secao id="promessas" titulo="Promessas" rota="/promessas">
          <p>
            Acompanha as promessas (e a acolhida dos filhotes). A tela abre sempre no mês atual e mostra duas visões
            separadas.
          </p>
          <Itens>
            <li>
              <strong>Filtros:</strong> Seletor de mês e, para dirigentes, o campo <strong>Ramo</strong> com o botão{" "}
              <strong>Filtrar</strong>. Quem não é dirigente fica preso ao próprio ramo.
            </li>
            <li>
              <strong>Tabela principal:</strong> pessoas com promessa/acolhida no mês escolhido. Colunas: Nome, Tipo,
              Ramo, Registro, Data, Dedução, Anos de promessa e Anos no ramo.
            </li>
            <li>
              <strong>Sem promessa / acolhida:</strong> quem ainda não tem o registro — acolhida para filhotes, promessa
              para os demais. Mostra Nome, Tipo, Ramo, Registro, Data do registro, Tempo até hoje e Situação.
            </li>
          </Itens>
          <Nota>
            A lista “Sem promessa / acolhida” não é afetada pelo mês. Para não dirigentes ela usa o ramo do próprio
            usuário; para dirigentes ela acompanha o ramo escolhido no filtro da tela.
          </Nota>
        </Secao>

        <Secao id="lencos" titulo="Lenços" rota="/lencos">
          <p>Registro dos lenços trocados pelo grupo, com consulta por UF e fotos do lenço e da entrega.</p>
          <Itens>
            <li>
              <strong>Consulta:</strong> mostra o último lenço trocado (com fotos), o gráfico <strong>Lenços por UF</strong>{" "}
              e a tabela de todos os lenços. Clique em uma UF no gráfico para filtrar; use{" "}
              <strong>Limpar filtro (UF)</strong> para voltar. Não há botão de cadastro nesta tela.
            </li>
            <li>
              <strong>Cadastro:</strong> fica em <strong>Cadastros › Lenços</strong>. Informe grupo escoteiro, número do
              lenço (até 4 casas), UF, data, nome do escoteiro, nome no Arara Azul, nome da atividade e observação. As
              datas usam o campo de data do navegador.
            </li>
            <li>
              As fotos aceitas são JPG, PNG e WEBP, de até 5 MB cada. Ficam armazenadas de forma privada e são exibidas
              por links temporários válidos por 1 hora. Na consulta individual é possível editar o cadastro; a exclusão
              não pede confirmação, então tenha cuidado.
            </li>
          </Itens>
        </Secao>

        <Secao id="cadastros" titulo="Cadastros">
          <p>
            O submenu <strong>Cadastros</strong> reúne Jovens, Associados, Ramos, Funções, Situações, Fornecedores,
            Cadastro de campanha, Avaliações, Questionários e Lenços. Cada item pode ser liberado separadamente na tela
            de acessos.
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Jovens:</strong> cadastro e acompanhamento dos jovens. Ficou aqui junto aos demais cadastros; a
              consulta de lenços continua no item “Lenços”. A liberação usa a chave <code>jovens</code>.
            </li>
            <li>
              <strong>Associados:</strong> o formulário cria o login e o cadastro de adultos. Campos principais: Nome,
              Registro (até 15 caracteres), E-mail de login, Linha de atuação, Função, Ramo, Situação, APF, datas de
              situação e promessa, dedução e a prévia de anos de promessa. A senha inicial tem no mínimo 8 caracteres e
              o adulto é obrigado a trocá-la no primeiro acesso. Os checkboxes definem se a pessoa faz parte do grupo,
              se pode acessar Cadastros e se está ativa. O botão <strong>Salvar e ir aos acessos</strong> grava e abre
              direto a tela de liberações. Na lista, use <strong>Filtrar</strong>, <strong>Definir</strong> (acessos) e{" "}
              <strong>Editar</strong>; na edição há também <strong>Redefinir senha</strong> /{" "}
              <strong>Criar acesso</strong>. Não é possível inativar a si mesmo.
            </li>
            <li>
              <strong>Acessos:</strong> tela “Liberação de menus”. Marque uma a uma as telas que o associado pode usar e
              clique em <strong>Salvar liberações</strong>. Em <strong>Copiar permissões de</strong>, escolha o associado
              de origem e clique em <strong>Copiar permissões</strong>: as marcas dele substituem as do associado atual e
              já ficam gravadas. Ao editar o próprio usuário, Associados e Log de acesso ficam protegidos (“mantido”).
            </li>
            <li>
              <strong>Ramos, Funções e Situações:</strong> tabelas básicas usadas em filtros e cadastros. Adicione com{" "}
              <strong>Adicionar</strong>, edite no próprio registro e confirme com <strong>Salvar</strong>. Para excluir,
              clique na lixeira e depois em <strong>Confirmar exclusão</strong>. Em Funções, o checkbox{" "}
              <strong>Avalia (diretor)</strong> identifica quem pode avaliar; itens em uso não podem ser excluídos.
            </li>
            <li>
              <strong>Fornecedores:</strong> cadastro de serviços, materiais e locações. Campos: Nome, Tipo (Serviço,
              Material ou Locação), Endereço, Localização, Telefone, Celular, Nome do contato, E-mail e Descrição dos
              serviços/materiais. Nome é obrigatório e é preciso informar telefone ou celular: telefone com máscara{" "}
              <code>(99) 9999-9999</code> e celular com máscara <code>(99) 99999-9999</code>. Em <strong>Consultar</strong>,
              digite uma palavra do nome ou da descrição (por exemplo, <code>cisal</code>) e clique em{" "}
              <strong>Buscar</strong>: a busca ignora acentos, ordena por relevância e aceita aspas para frase exata,{" "}
              <code>OR</code> e <code>-</code>. Use <strong>Novo fornecedor</strong> para incluir e, em cada registro,{" "}
              <strong>Editar</strong> ou <strong>Excluir</strong>. O cadastro só aparece para quem tem a liberação específica
              “Fornecedores”. Em <strong>Fornecedores</strong>, fora de Cadastros, a mesma busca funciona sem botões de
               alteração; essa liberação pode ser dada só a quem deve consultar. Em cada resultado da consulta há o botão{" "}
              <strong>WhatsApp</strong>: ele abre o aplicativo com os dados do fornecedor já escritos na mensagem para
               você escolher o contato e enviar. Nada é enviado automaticamente.
            </li>
            <li>
              <strong>Cadastro de campanha:</strong> cria a campanha de rifas com título, período, data do sorteio,
              bilhete em reais, prêmios e descritivo. Na lista editável informe as <strong>folhas</strong> por bloco e
              clique em <strong>Gerar blocos</strong> (em branco gera 1 bloco). A folha inicial e a final ficam gravadas;
              o total de folhas e o valor total aparecem no rodapé. Depois de gerar, blocos novos entram pelo detalhe da
              campanha e não recalculam os anteriores. Para <strong>finalizar</strong>, descreva os ganhadores.
            </li>
            <li>
              <strong>Avaliações:</strong> uma avaliação nasce como <strong>Rascunho</strong> e passa a{" "}
              <strong>Aberta</strong> quando você gera as avaliações individuais. Crie com Descrição, Questionário, Prazo
              e a opção de gerar PPF ao concluir a etapa do APF. Use <strong>Gerar avaliações</strong> ou{" "}
              <strong>Incluir novos adultos</strong> para selecionar os participantes. Em avaliações abertas é possível
              editar a opção de PPF e <strong>Cancelar avaliação</strong> (quando há respostas, é preciso digitar
              CANCELAR). Excluir só é permitido quando não há respostas.
            </li>
            <li>
              <strong>Questionários:</strong> cadastre o questionário e suas etapas. Cada etapa define quem responde (
              <strong>Associado</strong>, <strong>APF</strong> ou <strong>Diretor</strong>), se pontua (
              <strong>Pontua</strong> ou <strong>Não Pontua</strong>), a nota mínima e as perguntas. Perguntas podem ser <strong>Pontuada</strong> (com opções e notas) ou{" "}
              <strong>Descritiva</strong> (texto livre, com limite de 2000 caracteres na resposta). Perguntas com
              respostas não mudam de tipo e não podem ser excluídas.
            </li>
            <li>
              <strong>Lenços:</strong> cadastro e edição dos registros de lenços. Número e UF ficam na mesma linha; a
              observação ocupa uma linha e, abaixo dela, vêm a foto do lenço e a foto da entrega, uma por linha. A
              consulta fica no item separado “Lenços”, no grupo Geral do menu.
            </li>
          </ul>
        </Secao>

        <Secao id="campanhas" titulo="Campanhas e rifas" rota="/campanhas">
          <p>
            Três telas complementares: <strong>Cadastro de campanha</strong> (em Cadastros), <strong>Campanhas</strong>{" "}
            (consulta, em Geral) e <strong>Entrega de blocos</strong> (aberta pelo botão na tela Campanhas).
          </p>
          <Itens>
            <li>
              <strong>Cadastro:</strong> o valor do bilhete é obrigatório e aparece com máscara <code>R$ ...</code>.
              <strong> Valor do bloco = valor do bilhete × folhas do bloco</strong>. Cada bloco tem sua própria quantidade de folhas e
              sua numeração inicial/final. A lista permite editar folhas e numeração antes de gerar; após gerar, use o
              detalhe da campanha para incluir, editar ou excluir blocos disponíveis.
            </li>
            <li>
              <strong>Consulta:</strong> campanhas em aberto vêm primeiro e finalizadas depois. Os cartões mostram
              bilhetes, entregues, aguardando acerto, acertados, valor acertado e devolvidos. Abra <strong>Ver blocos</strong>{" "}
              para o detalhe com a numeração gravada de cada bloco.
            </li>
            <li>
              <strong>Entrega:</strong> escolha a campanha no seletor. Para cada bloco use <strong>Retirar</strong> (sempre
              do bloco inteiro) ou <strong>Acertar</strong>: o formulário abre em uma tela própria e fecha ao concluir; a
              lista de blocos só atualiza as informações das linhas. Depois do acerto o botão fica <strong>Encerrado</strong>.
              A situação <strong>Aguardando</strong> indica bloco retirado e ainda não acertado.
            </li>
            <li>
              No campo de pessoa, digite ou escolha um nome da lista: o tipo vem entre parênteses, como{" "}
              <code>Nome (Associado)</code> ou <code>Nome (Jovem)</code>. O nome do terceiro vai em uma linha separada.
            </li>
            <li>
              O acerto pode ser parcial: informe <strong>Quantidade acertada / vendida</strong> e a data.{" "}
              <strong>Valor do acerto = quantidade vendida × valor do bilhete</strong>; o restante volta como{" "}
              <strong>Devolvido</strong>. Os totais aparecem no rodapé da tabela.
            </li>
          </Itens>
          <Nota>
            A liberação <code>campanha</code> permite cadastrar e alterar; <code>campanhas</code> é somente leitura;{" "}
            <code>entregablocos</code> permite retirar e acertar sem mexer no cadastro.
          </Nota>
        </Secao>

        <Secao id="minhas-avaliacoes" titulo="Minhas avaliações" rota="/minhas-avaliacoes">
          <p>Avaliações atribuídas a você. Na lista aparecem descrição, prazo, selo de situação e barra de progresso.</p>
          <Itens>
            <li>
              Situações possíveis: <strong>Não iniciada</strong>, <strong>Em andamento</strong>,{" "}
              <strong>Prazo vencido</strong> e <strong>Concluída</strong>. No dia do prazo ainda dá para responder.
            </li>
            <li>
              Abra com <strong>Responder</strong>, <strong>Continuar</strong> ou <strong>Ver respostas</strong>. Cada
              etapa mostra o código e a pergunta; assinale uma opção ou escreva a resposta descritiva.
            </li>
            <li>
              Use <strong>Salvar respostas</strong> para gravar parcialmente e voltar depois.{" "}
              <strong>Concluir avaliação</strong> só é habilitado quando todas as perguntas da sua etapa foram
              respondidas; depois de concluída, a etapa fica somente leitura.
            </li>
            <li>
              A conclusão segue a ordem: <strong>associado → APF → direção</strong>. Você não consegue concluir a sua
              parte novamente após o envio, e a nota só aparece quando a avaliação está concluída.
            </li>
          </Itens>
        </Secao>

        <Secao id="meu-ppf" titulo="Meu PPF" rota="/meu-ppf">
          <p>
            O Plano Pessoal de Formação é gerado automaticamente quando o seu APF conclui uma avaliação marcada com
            “Gerar PPF”. Ele reúne as perguntas em que a resposta ficou abaixo da nota mínima.
          </p>
          <Itens>
            <li>
              Na lista, planos <strong>Abertos</strong> aparecem primeiro. Abra com <strong>Abrir PPF</strong>.
            </li>
            <li>
              Para cada item gerado, preencha <strong>Ação que será realizada</strong> e{" "}
              <strong>Data prevista</strong> e clique em <strong>Salvar PPF</strong>. Esses itens não podem ser
              excluídos.
            </li>
            <li>
              Em <strong>Itens adicionados por mim</strong> você pode incluir, editar e excluir itens próprios com
              Descrição e Data prevista.
            </li>
            <li>
              Com o plano pronto, use <strong>Gerar relatório em PDF</strong> — o arquivo é baixado no formato usado
              para envio no paxtu100. Quando o PPF é fechado, tudo fica somente leitura.
            </li>
          </Itens>
        </Secao>

        <Secao id="meus-assessorados" titulo="Meus assessorados" rota="/meus-assessorados">
          <p>
            Área do APF (assessor pessoal de formação). A lista mostra os adultos vinculados a você no campo “APF” do
            cadastro; clique em <strong>Ver avaliações</strong> para acompanhar cada um.
          </p>
          <Itens>
            <li>
              Por avaliação, veja a nota do associado, o prazo, as barras de progresso <strong>Associado</strong> e{" "}
              <strong>APF</strong> e os selos de conclusão.
            </li>
            <li>
              Com <strong>Ver respostas e responder</strong> você lê as respostas do associado e preenche a sua etapa de
              APF. O botão <strong>Concluir avaliação</strong> fica bloqueado enquanto o associado não concluir a dele.
            </li>
            <li>
              <strong>PPF (somente leitura)</strong> mostra o plano do assessorado como subsídio para a conversa com
              ele. Quem preenche ações e datas é o próprio associado.
            </li>
          </Itens>
        </Secao>

        <Secao id="parecer" titulo="Parecer" rota="/parecer">
          <p>
            Área da direção para registrar o parecer final. Só aparecem avaliações cujo questionário tenha uma etapa de
            nível <strong>Diretor</strong>.
          </p>
          <Itens>
            <li>
              A lista mostra prazo, situação e, para cada pessoa, se Associado, APF e Direção já concluíram. Use{" "}
              <strong>Dar parecer</strong> ou <strong>Ver parecer</strong>.
            </li>
            <li>
              Na tela de parecer você lê as respostas do associado e do APF (somente leitura) e responde à etapa da
              direção com <strong>Salvar respostas</strong> e <strong>Concluir avaliação</strong>.
            </li>
            <li>
              A conclusão da direção só é liberada depois que o associado e o APF concluíram as etapas anteriores.
            </li>
          </Itens>
        </Secao>

        <Secao id="resultados" titulo="Resultados" rota="/resultados">
          <p>Relatórios consolidados das avaliações por questionário, com radar de notas e situação dos participantes.</p>
          <Itens>
            <li>
              A tela abre vazia. Preencha <strong>Avaliação</strong> (parte do nome), <strong>De</strong> e/ou{" "}
              <strong>Até</strong> e clique em <strong>Consultar</strong>. O período considera a data de geração e o
              prazo de cada avaliação. Use <strong>Limpar filtro</strong> para recomeçar.
            </li>
            <li>
              Em <strong>Ver radar</strong>, o gráfico traz um polígono por associado e a média da avaliação. A legenda
              permite mostrar/ocultar pessoas, com atalhos <strong>Ocultar todos</strong> e <strong>Mostrar todos</strong>.
              São necessárias pelo menos três etapas pontuadas para desenhar o radar.
            </li>
            <li>
              O cartão <strong>Média da avaliação</strong> traz o percentual e a média por etapa; a tabela{" "}
              <strong>Associados e notas</strong> mostra Ramo, Associado, Situação e Nota.
            </li>
          </Itens>
        </Secao>

        <Secao id="acessolog" titulo="Log de acesso" rota="/acessolog">
          <p>Consulta restrita à direção: registra quais telas foram visitadas, por quem e quando.</p>
          <Itens>
            <li>
              A tela abre vazia. Filtre por <strong>De</strong>, <strong>Até</strong> e, se quiser, por{" "}
              <strong>Usuário</strong>, depois clique em <strong>Consultar</strong>. Há também{" "}
              <strong>Limpar filtro</strong>.
            </li>
            <li>
              O resultado traz Data e hora, Usuário, Registro e Opção consultada, do mais recente para o mais antigo,
              limitado a 1000 registros. Cada mudança de tela gera uma entrada automaticamente.
            </li>
          </Itens>
          <Nota titulo="Importante">
            A liberação do Log de acesso vale no menu e também na regra de leitura do banco: marcá-la ou desmarcá-la na
            tela de acessos altera os dois lados.
          </Nota>
        </Secao>

        <Secao id="permissoes" titulo="Permissões: como funcionam">
          <p>
            O controle de acesso é feito pela tabela de liberações do usuário: <strong>só a tabela manda</strong>. Cada
            módulo corresponde a uma chave; se a chave não estiver liberada, o item não aparece no menu e a rota é
            bloqueada.
          </p>
          <Itens>
            <li>
              Ser membro do grupo, ocupar determinado cargo ou ter acesso a cadastros{" "}
              <strong>não libera menus por si só</strong>. Esses dados apenas definem as liberações iniciais no momento
              em que o associado é criado. Depois disso, a tela de acessos é a fonte da verdade.
            </li>
            <li>
              Na criação: quem não faz parte do grupo recebe somente Meus assessorados; quem faz parte recebe Dashboard,
              Jovens, Promessas, Lenços, cadastro de Lenços, Minhas avaliações, Meu PPF e Meus assessorados. Função que
              avalia ou “Permite acesso aos Cadastros” acrescenta todos os cadastros; função que avalia somada à linha
              Dirigente acrescenta Parecer, Resultados e Log de acesso. Jovens está no grupo Cadastros, mas continua
              entre as liberações padrão de quem faz parte do grupo.
            </li>
            <li>
              A condição de dirigente continua valendo para filtros de dados (ramo em Jovens e Promessas), mas não
              substitui a liberação da chave do menu. O mesmo vale para a função que avalia em relação às avaliações.
            </li>
            <li>
              A ordem do menu é fixa: <strong>Dashboard primeiro</strong> e os demais itens em ordem alfabética dentro
              de cada grupo.
            </li>
          </Itens>
        </Secao>

        <Secao id="faq" titulo="Perguntas frequentes">
          <Itens>
            <li>
              <strong>Por que não vejo um módulo no menu?</strong> Porque a chave correspondente não está liberada para
              o seu usuário. Peça à direção para ajustar em Acessos.
            </li>
            <li>
              <strong>Por que a Ajuda não aparece no menu?</strong> Porque ela fica no cabeçalho, ao lado de Minha senha
              e Sair, e é livre para todos os usuários logados.
            </li>
            <li>
              <strong>Não encontro o cadastro de lenços.</strong> Ele está dentro de Cadastros; a consulta é o item
              “Lenços” no menu lateral.
            </li>
            <li>
              <strong>Onde fica o cadastro de jovens?</strong> Dentro de <strong>Cadastros › Jovens</strong>. Ele usa a
              mesma chave de liberação de antes (<code>jovens</code>), então não é preciso ajustar os acessos por causa
              da mudança de lugar.
            </li>
            <li>
              <strong>O que é “Não Pontua”?</strong> É o estado de uma etapa do questionário cujas respostas são
              registradas, mas não entram na nota. Aparece um único selo com esse texto; quando a etapa pontua, o selo
              mostra “Pontua”.
            </li>
            <li>
              <strong>Não vejo “Doc. Técnica” no topo.</strong> Esse link aparece somente para usuários da linha
              Dirigente com função que avalia. Ele abre a documentação técnica do sistema.
            </li>
            <li>
              <strong>Esqueci a senha.</strong> Se você ainda consegue entrar, use Minha senha no topo. Caso contrário,
              peça uma senha temporária à direção; ela será trocada no primeiro acesso.
            </li>
            <li>
              <strong>Uma data aparece como “—”.</strong> Significa que o campo não foi preenchido no cadastro da pessoa
              ou do jovem; edite o registro para completar.
            </li>
            <li>
              <strong>Concluí minha avaliação e agora?</strong> A etapa seguinte é do APF e depois da direção. Você pode
              acompanhar o andamento em Minhas avaliações e, quando houver PPF, preencher as ações em Meu PPF.
            </li>
          </Itens>
        </Secao>

        <p className="mt-6 text-center text-xs text-gray-500">
          Gestão do Grupo · Grupo Escoteiro Arara Azul — em caso de dúvida, procure a direção do grupo.
        </p>
      </main>
    </Shell>
  );
}
