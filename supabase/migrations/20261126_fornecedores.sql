-- Cadastro de fornecedores e busca textual (nome + descrição).
-- A tabela é privada: só quem tem a chave de menu "fornecedores" liberada
-- em public.usuario_menu pode ler ou gravar (RLS via private.pode_acesso).

create table if not exists public.fornecedor (
  idfornecedor bigint generated always as identity primary key,
  nome text not null check (btrim(nome) <> ''),
  endereco text,
  telefone text,
  celular text,
  nomecontato text,
  localizacao text,
  email text,
  tipo text not null check (tipo in ('Serviço', 'Material', 'Locação')),
  descricao text,
  busca tsvector generated always as (
    to_tsvector('portuguese'::regconfig, coalesce(nome, '') || ' ' || coalesce(descricao, ''))
  ) stored,
  constraint fornecedor_contato check (
    btrim(coalesce(telefone, '')) <> '' or btrim(coalesce(celular, '')) <> ''
  )
);

create index if not exists fornecedor_busca_idx on public.fornecedor using gin (busca);

alter table public.fornecedor enable row level security;

drop policy if exists fornecedor_acesso on public.fornecedor;
create policy fornecedor_acesso on public.fornecedor
  for all to authenticated
  using (private.pode_acesso('fornecedores'))
  with check (private.pode_acesso('fornecedores'));

-- websearch_to_tsquery entende a sintaxe de busca da web (palavras, aspas,
-- OR e exclusão com "-"). A ordem é por relevância, como numa busca comum.
create or replace function public.buscar_fornecedores(p_termo text default null)
returns table (
  idfornecedor bigint,
  nome text,
  endereco text,
  telefone text,
  celular text,
  nomecontato text,
  localizacao text,
  email text,
  tipo text,
  descricao text,
  relevancia real
)
language sql
stable
security invoker
set search_path = public
as $$
  with termo as (
    select
      btrim(coalesce(p_termo, '')) as texto,
      websearch_to_tsquery('portuguese'::regconfig, btrim(coalesce(p_termo, ''))) as consulta
  )
  select
    f.idfornecedor,
    f.nome,
    f.endereco,
    f.telefone,
    f.celular,
    f.nomecontato,
    f.localizacao,
    f.email,
    f.tipo,
    f.descricao,
    case when t.texto = '' then 0::real else ts_rank_cd(f.busca, t.consulta) end as relevancia
  from public.fornecedor f
  cross join termo t
  where t.texto = ''
     or f.busca @@ t.consulta
     or f.nome ilike '%' || t.texto || '%'
     or f.descricao ilike '%' || t.texto || '%'
  order by
    (t.texto <> '' and (f.busca @@ t.consulta or f.nome ilike '%' || t.texto || '%' or f.descricao ilike '%' || t.texto || '%')) desc,
    relevancia desc,
    f.nome asc;
$$;

grant execute on function public.buscar_fornecedores(text) to anon, authenticated;

-- Quem já pode Ramos (cadastros) passa a ver Fornecedores. Novos usuários
-- recebem a chave automaticamente pela função acessosIniciais(), em src/lib/menu.ts.
insert into public.usuario_menu (idusuario, chave, liberado)
select idusuario, 'fornecedores', true
from public.usuario_menu
where chave = 'ramos' and liberado
on conflict (idusuario, chave) do nothing;
