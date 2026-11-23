# Gestão do Grupo

Sistema de gestão do Grupo Escoteiro Arara Azul: cadastro de adultos e jovens, acompanhamento de promessas por ramo,
registro de lenços e aplicação de questionários e avaliações. Cada módulo aparece no menu e na rota somente se estiver
liberado para o usuário na tabela de acessos; dirigentes acompanham os gráficos completos e a documentação técnica.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript, Tailwind CSS, Cache Components)
- [Supabase](https://supabase.com) (Postgres, autenticação, RLS, Storage, RPC e Edge Functions)
- [Vercel](https://vercel.com) (deploy automático a cada push na `main`)

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha com os dados do projeto Supabase
   (Dashboard → Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

3. Instale as dependências e rode o servidor:

```bash
npm install
npm run dev
```

Acesse http://localhost:3000. Antes de publicar, rode `npm run lint` e `npm run build`.

## Ambientes

- Produção: https://gestaoarara.vercel.app e https://gestaoarara.araraazul.org.br
- Repositório: https://github.com/AraraAzul-org/gestaoarara
- Supabase: projeto `gnosjzdguifktkspxwkt`, região `us-west-2`

## Documentação

- Guia do sistema (para qualquer usuário logado): menu **Ajuda** no cabeçalho.
- Documentação técnica (somente Dirigente): **Doc. Técnica** no cabeçalho ou `/doc-tecnica`.
- Backup, restauração e segredos: [.github/BACKUP.md](.github/BACKUP.md).

## Observações

- A chave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` é pública por definição: ela vai
  para o navegador. A proteção dos dados é feita pelo RLS no banco.
- Nunca commite `.env.local` nem chaves secretas. A chave `service_role` usada em
  Server Actions fica apenas no ambiente do servidor.
- O schema, as políticas de acesso (RLS), os triggers e as funções ficam no
  Supabase, não neste repositório.
- Em produção, as variáveis de ambiente são configuradas no Vercel
  (Project Settings → Environment Variables).
