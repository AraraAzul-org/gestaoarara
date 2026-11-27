-- Campanhas, blocos de rifas e distribuição/acerto.
-- A chave "campanha" comanda cadastro; "campanhas" é somente leitura e
-- "entregablocos" permite retirar/acertar sem poder alterar o cadastro.

create table if not exists public.campanha (
  idcampanha bigint generated always as identity primary key,
  titulo text not null check (btrim(titulo) <> ''),
  datainicial date not null,
  datafinal date not null,
  premios text,
  datasorteio date,
  valorbilhete numeric(12, 2) not null check (valorbilhete > 0),
  valortotal numeric(14, 2) not null default 0 check (valortotal >= 0),
  valorpremios numeric(12, 2) check (valorpremios >= 0),
  descritivo text,
  status text not null check (status in ('rascunho', 'iniciada', 'finalizada')),
  ganhadores text,
  quantblocos integer not null default 0 check (quantblocos >= 0),
  quantidades jsonb not null default '[]'::jsonb,
  numeracaoinicial integer not null default 1 check (numeracaoinicial > 0),
  constraint campanha_periodo check (datafinal >= datainicial),
  constraint campanha_finalizada_ganhadores
    check (status <> 'finalizada' or btrim(coalesce(ganhadores, '')) <> '')
);

create table if not exists public.campanha_bloco (
  idbloco bigint generated always as identity primary key,
  idcampanha bigint not null references public.campanha (idcampanha) on delete cascade,
  numero integer not null check (numero > 0),
  quantbilhetes integer not null check (quantbilhetes > 0),
  numeracaoinicial integer not null check (numeracaoinicial > 0),
  numeracaofinal integer not null check (numeracaofinal > 0),
  constraint campanha_bloco_numeracao check (numeracaofinal >= numeracaoinicial),
  constraint campanha_bloco_numero_unico unique (idcampanha, numero)
);

create table if not exists public.campanha_distribuicao (
  iddistribuicao bigint generated always as identity primary key,
  idcampanha bigint not null references public.campanha (idcampanha) on delete cascade,
  idbloco bigint not null unique references public.campanha_bloco (idbloco) on delete cascade,
  tipo text check (tipo in ('Associado', 'Jovem')),
  idassociado bigint references public.usuario (idusuario) on delete set null,
  idjovem bigint references public.jovem (idjovem) on delete set null,
  nome text,
  descricao text,
  dataretirada date,
  quantrifas integer not null check (quantrifas > 0),
  dataacerto date,
  quantvendida integer not null default 0 check (quantvendida >= 0),
  valoracerto numeric(14, 2) not null default 0 check (valoracerto >= 0),
  situacao text not null check (situacao in ('disponivel', 'retirado', 'acertado')),
  constraint campanha_distribuicao_pessoa check (
    (tipo = 'Associado' and idjovem is null)
    or (tipo = 'Jovem' and idassociado is null)
    or (
      tipo is null and idassociado is null and idjovem is null
      and nome is null and dataretirada is null
    )
  ),
  constraint campanha_distribuicao_situacao check (
    (
      situacao = 'disponivel' and dataacerto is null
      and quantvendida = 0 and valoracerto = 0
    )
    or (
      situacao = 'retirado' and dataacerto is null
      and quantvendida = 0 and valoracerto = 0
      and tipo is not null and btrim(coalesce(nome, '')) <> ''
      and dataretirada is not null
    )
    or (
      situacao = 'acertado' and dataacerto is not null
      and tipo is not null and btrim(coalesce(nome, '')) <> ''
      and dataretirada is not null and quantvendida <= quantrifas
    )
  )
);

create index if not exists campanha_ordem_idx
  on public.campanha (status, datainicial, idcampanha);
create index if not exists campanha_bloco_ordem_idx
  on public.campanha_bloco (idcampanha, numero);
create index if not exists campanha_distribuicao_ordem_idx
  on public.campanha_distribuicao (idcampanha, situacao);

alter table public.campanha enable row level security;
alter table public.campanha_bloco enable row level security;
alter table public.campanha_distribuicao enable row level security;

grant select, insert, update, delete on public.campanha to authenticated;
grant select, insert, update, delete on public.campanha_bloco to authenticated;
grant select, insert, update, delete on public.campanha_distribuicao to authenticated;

drop policy if exists campanha_acesso on public.campanha;
create policy campanha_acesso on public.campanha for all to authenticated
  using (private.pode_acesso('campanha'))
  with check (private.pode_acesso('campanha'));

drop policy if exists campanha_leitura on public.campanha;
create policy campanha_leitura on public.campanha for select to authenticated
  using (private.pode_acesso('campanhas') or private.pode_acesso('entregablocos'));

drop policy if exists campanha_bloco_acesso on public.campanha_bloco;
create policy campanha_bloco_acesso on public.campanha_bloco for all to authenticated
  using (private.pode_acesso('campanha'))
  with check (private.pode_acesso('campanha'));

drop policy if exists campanha_bloco_leitura on public.campanha_bloco;
create policy campanha_bloco_leitura on public.campanha_bloco for select to authenticated
  using (private.pode_acesso('campanhas') or private.pode_acesso('entregablocos'));

drop policy if exists campanha_distribuicao_acesso on public.campanha_distribuicao;
create policy campanha_distribuicao_acesso on public.campanha_distribuicao for all to authenticated
  using (private.pode_acesso('campanha'))
  with check (private.pode_acesso('campanha'));

drop policy if exists campanha_distribuicao_leitura on public.campanha_distribuicao;
create policy campanha_distribuicao_leitura on public.campanha_distribuicao for select to authenticated
  using (private.pode_acesso('campanhas') or private.pode_acesso('entregablocos'));

-- Triggers mantêm o valor total e a configuração derivada dos blocos gravados.
create or replace function private.recalcular_valortotal_campanha(p_idcampanha bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.campanha c
     set valortotal = coalesce((
       select round(c.valorbilhete * sum(b.quantbilhetes), 2)
       from public.campanha_bloco b
       where b.idcampanha = c.idcampanha
     ), 0)
   where c.idcampanha = p_idcampanha;
end;
$$;

create or replace function private.atualizar_config_campanha(p_idcampanha bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.campanha c
     set quantblocos = (
           select count(*)::integer from public.campanha_bloco b
           where b.idcampanha = c.idcampanha
         ),
         quantidades = coalesce((
           select jsonb_agg(
             jsonb_build_object(
               'folhas', b.quantbilhetes,
               'inicio', b.numeracaoinicial,
               'fim', b.numeracaofinal
             ) order by b.numero
           )
           from public.campanha_bloco b
           where b.idcampanha = c.idcampanha
         ), '[]'::jsonb)
   where c.idcampanha = p_idcampanha;
end;
$$;

create or replace function private.campanha_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
begin
  if tg_table_name = 'campanha' then
    v_id := new.idcampanha;
    perform private.recalcular_valortotal_campanha(v_id);
  elsif tg_table_name = 'campanha_bloco' then
    if tg_op = 'DELETE' then
      v_id := old.idcampanha;
    else
      v_id := new.idcampanha;
      if tg_op = 'UPDATE' and old.idcampanha <> new.idcampanha then
        perform private.recalcular_valortotal_campanha(old.idcampanha);
        perform private.atualizar_config_campanha(old.idcampanha);
      end if;
    end if;
    if exists (select 1 from public.campanha where idcampanha = v_id) then
      perform private.recalcular_valortotal_campanha(v_id);
      perform private.atualizar_config_campanha(v_id);
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists campanha_total_sync on public.campanha;
create trigger campanha_total_sync
  after insert or update of valorbilhete on public.campanha
  for each row execute function private.campanha_sync_trigger();

drop trigger if exists campanha_bloco_sync on public.campanha_bloco;
create trigger campanha_bloco_sync
  after insert or update or delete on public.campanha_bloco
  for each row execute function private.campanha_sync_trigger();

create or replace function private.inserir_blocos(p_idcampanha bigint, p_blocos jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_bloco jsonb;
  v_numero integer;
  v_folhas integer;
  v_inicio integer;
  v_fim integer;
  v_idbloco bigint;
  v_total integer;
begin
  v_total := coalesce(jsonb_array_length(p_blocos), 0);
  if v_total = 0 then
    return;
  end if;
  if v_total > 1000 then
    raise exception 'Limite de 1000 blocos por campanha.';
  end if;

  select coalesce(max(numero), 0) + 1 into v_numero
  from public.campanha_bloco where idcampanha = p_idcampanha;

  for v_bloco in select value from jsonb_array_elements(p_blocos) as t(value) loop
    v_folhas := (v_bloco->>'folhas')::integer;
    v_inicio := (v_bloco->>'inicio')::integer;
    v_fim := (v_bloco->>'fim')::integer;
    if v_folhas is null or v_folhas <= 0 or v_inicio is null or v_inicio <= 0
       or v_fim is null or v_fim < v_inicio then
      raise exception 'Cada bloco precisa de folhas e numeração válidas.';
    end if;

    insert into public.campanha_bloco
      (idcampanha, numero, quantbilhetes, numeracaoinicial, numeracaofinal)
    values (p_idcampanha, v_numero, v_folhas, v_inicio, v_fim)
    returning idbloco into v_idbloco;

    insert into public.campanha_distribuicao
      (idcampanha, idbloco, quantrifas, situacao)
    values (p_idcampanha, v_idbloco, v_folhas, 'disponivel');

    v_numero := v_numero + 1;
  end loop;

  perform private.atualizar_config_campanha(p_idcampanha);
end;
$$;

create or replace function public.criar_campanha(p_dados jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id bigint;
  v_status text;
  v_blocos jsonb;
begin
  if not private.pode_acesso('campanha') then
    raise exception 'Sem permissão para cadastrar campanhas.' using errcode = '42501';
  end if;

  v_status := p_dados->>'status';
  v_blocos := coalesce(p_dados->'blocos', '[]'::jsonb);
  if v_status <> 'rascunho' and jsonb_array_length(v_blocos) = 0 then
    raise exception 'Cadastre ao menos um bloco na lista de blocos.';
  end if;

  insert into public.campanha (
    titulo, datainicial, datafinal, premios, datasorteio,
    valorbilhete, valorpremios, descritivo, status, ganhadores,
    quantblocos, quantidades, numeracaoinicial
  ) values (
    btrim(p_dados->>'titulo'),
    (p_dados->>'datainicial')::date,
    (p_dados->>'datafinal')::date,
    nullif(btrim(coalesce(p_dados->>'premios', '')), ''),
    nullif(p_dados->>'datasorteio', '')::date,
    (p_dados->>'valorbilhete')::numeric,
    nullif(p_dados->>'valorpremios', '')::numeric,
    nullif(btrim(coalesce(p_dados->>'descritivo', '')), ''),
    v_status,
    nullif(btrim(coalesce(p_dados->>'ganhadores', '')), ''),
    jsonb_array_length(v_blocos),
    v_blocos,
    coalesce((p_dados->>'numeracaoinicial')::integer, 1)
  )
  returning idcampanha into v_id;

  if v_status <> 'rascunho' then
    perform private.inserir_blocos(v_id, v_blocos);
  end if;

  return v_id;
end;
$$;

create or replace function public.atualizar_campanha(p_idcampanha bigint, p_dados jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_blocos jsonb;
  v_ja_gerou boolean;
begin
  if not private.pode_acesso('campanha') then
    raise exception 'Sem permissão para alterar campanhas.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.campanha where idcampanha = p_idcampanha) then
    raise exception 'Campanha não encontrada.';
  end if;

  v_status := p_dados->>'status';
  v_blocos := coalesce(p_dados->'blocos', '[]'::jsonb);
  select exists(
    select 1 from public.campanha_bloco where idcampanha = p_idcampanha
  ) into v_ja_gerou;

  if not v_ja_gerou and v_status <> 'rascunho' and jsonb_array_length(v_blocos) = 0 then
    raise exception 'Cadastre ao menos um bloco na lista de blocos.';
  end if;

  update public.campanha c
     set titulo = btrim(p_dados->>'titulo'),
         datainicial = (p_dados->>'datainicial')::date,
         datafinal = (p_dados->>'datafinal')::date,
         premios = nullif(btrim(coalesce(p_dados->>'premios', '')), ''),
         datasorteio = nullif(p_dados->>'datasorteio', '')::date,
         valorbilhete = (p_dados->>'valorbilhete')::numeric,
         valorpremios = nullif(p_dados->>'valorpremios', '')::numeric,
         descritivo = nullif(btrim(coalesce(p_dados->>'descritivo', '')), ''),
         status = v_status,
         ganhadores = nullif(btrim(coalesce(p_dados->>'ganhadores', '')), ''),
         quantblocos = case when v_ja_gerou then c.quantblocos else jsonb_array_length(v_blocos) end,
         quantidades = case when v_ja_gerou then c.quantidades else v_blocos end,
         numeracaoinicial = coalesce((p_dados->>'numeracaoinicial')::integer, c.numeracaoinicial)
   where c.idcampanha = p_idcampanha;

  if not v_ja_gerou and v_status <> 'rascunho' then
    perform private.inserir_blocos(p_idcampanha, v_blocos);
  end if;
end;
$$;

create or replace function public.criar_bloco(p_idcampanha bigint, p_quantbilhetes integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_numero integer;
  v_inicio integer;
  v_idbloco bigint;
begin
  if not private.pode_acesso('campanha') then
    raise exception 'Sem permissão para alterar blocos.' using errcode = '42501';
  end if;
  if p_quantbilhetes is null or p_quantbilhetes <= 0 then
    raise exception 'Informe uma quantidade válida de folhas.';
  end if;

  select status into v_status from public.campanha where idcampanha = p_idcampanha;
  if v_status is null then
    raise exception 'Campanha não encontrada.';
  end if;
  if v_status = 'finalizada' then
    raise exception 'Campanha finalizada não aceita novos blocos.';
  end if;

  -- A numeração nova começa depois da maior folha final já gravada;
  -- os blocos anteriores não são recalculados.
  select coalesce(max(numeracaofinal), 0) + 1 into v_inicio
  from public.campanha_bloco where idcampanha = p_idcampanha;
  select coalesce(max(numero), 0) + 1 into v_numero
  from public.campanha_bloco where idcampanha = p_idcampanha;

  insert into public.campanha_bloco
    (idcampanha, numero, quantbilhetes, numeracaoinicial, numeracaofinal)
  values (p_idcampanha, v_numero, p_quantbilhetes, v_inicio, v_inicio + p_quantbilhetes - 1)
  returning idbloco into v_idbloco;

  insert into public.campanha_distribuicao
    (idcampanha, idbloco, quantrifas, situacao)
  values (p_idcampanha, v_idbloco, p_quantbilhetes, 'disponivel');

  perform private.atualizar_config_campanha(p_idcampanha);
  return v_idbloco;
end;
$$;

create or replace function public.salvar_bloco(
  p_idbloco bigint,
  p_quantbilhetes integer,
  p_inicio integer,
  p_fim integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_idcampanha bigint;
  v_status text;
  v_situacao text;
begin
  if not private.pode_acesso('campanha') then
    raise exception 'Sem permissão para alterar blocos.' using errcode = '42501';
  end if;
  if p_quantbilhetes is null or p_quantbilhetes <= 0
     or p_inicio is null or p_inicio <= 0
     or p_fim is null or p_fim < p_inicio then
    raise exception 'Informe folhas e numeração válidas.';
  end if;

  select b.idcampanha, c.status, d.situacao
    into v_idcampanha, v_status, v_situacao
  from public.campanha_bloco b
  join public.campanha c on c.idcampanha = b.idcampanha
  join public.campanha_distribuicao d on d.idbloco = b.idbloco
  where b.idbloco = p_idbloco;

  if v_idcampanha is null then
    raise exception 'Bloco não encontrado.';
  end if;
  if v_status = 'finalizada' then
    raise exception 'Campanha finalizada não aceita alteração de blocos.';
  end if;
  if v_situacao <> 'disponivel' then
    raise exception 'Só é possível editar blocos que ainda não foram entregues.';
  end if;

  update public.campanha_bloco
     set quantbilhetes = p_quantbilhetes,
         numeracaoinicial = p_inicio,
         numeracaofinal = p_fim
   where idbloco = p_idbloco;
  update public.campanha_distribuicao
     set quantrifas = p_quantbilhetes
   where idbloco = p_idbloco;
  perform private.atualizar_config_campanha(v_idcampanha);
end;
$$;

create or replace function public.excluir_bloco(p_idbloco bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_idcampanha bigint;
  v_status text;
  v_situacao text;
begin
  if not private.pode_acesso('campanha') then
    raise exception 'Sem permissão para excluir blocos.' using errcode = '42501';
  end if;

  select b.idcampanha, c.status, d.situacao
    into v_idcampanha, v_status, v_situacao
  from public.campanha_bloco b
  join public.campanha c on c.idcampanha = b.idcampanha
  join public.campanha_distribuicao d on d.idbloco = b.idbloco
  where b.idbloco = p_idbloco;

  if v_idcampanha is null then
    raise exception 'Bloco não encontrado.';
  end if;
  if v_status = 'finalizada' then
    raise exception 'Campanha finalizada não aceita exclusão de blocos.';
  end if;
  if v_situacao <> 'disponivel' then
    raise exception 'Só é possível excluir blocos que ainda não foram entregues.';
  end if;

  delete from public.campanha_bloco where idbloco = p_idbloco;
  perform private.atualizar_config_campanha(v_idcampanha);
end;
$$;

create or replace function public.registrar_retirada(
  p_idbloco bigint,
  p_tipo text,
  p_idpessoa bigint,
  p_descricao text,
  p_dataretirada date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_idcampanha bigint;
  v_quant integer;
  v_situacao text;
  v_nome text;
begin
  if not (private.pode_acesso('campanha') or private.pode_acesso('entregablocos')) then
    raise exception 'Sem permissão para entregar blocos.' using errcode = '42501';
  end if;
  if p_tipo not in ('Associado', 'Jovem') then
    raise exception 'Escolha um associado ou jovem da lista.';
  end if;
  if p_idpessoa is null or p_dataretirada is null then
    raise exception 'Informe a pessoa e a data da retirada.';
  end if;

  select b.idcampanha, b.quantbilhetes into v_idcampanha, v_quant
  from public.campanha_bloco b where b.idbloco = p_idbloco;
  if v_idcampanha is null then
    raise exception 'Bloco não encontrado.';
  end if;

  select situacao into v_situacao
  from public.campanha_distribuicao where idbloco = p_idbloco;
  if v_situacao is distinct from 'disponivel' then
    raise exception 'Este bloco não está disponível para retirada.';
  end if;

  if p_tipo = 'Associado' then
    select nome into v_nome from public.usuario
    where idusuario = p_idpessoa and ativo;
  else
    select nome into v_nome from public.jovem
    where idjovem = p_idpessoa and ativo;
  end if;
  if v_nome is null then
    raise exception 'Pessoa não encontrada ou inativa.';
  end if;

  update public.campanha_distribuicao
     set tipo = p_tipo,
         idassociado = case when p_tipo = 'Associado' then p_idpessoa end,
         idjovem = case when p_tipo = 'Jovem' then p_idpessoa end,
         nome = v_nome,
         descricao = nullif(btrim(coalesce(p_descricao, '')), ''),
         dataretirada = p_dataretirada,
         quantrifas = v_quant,
         dataacerto = null,
         quantvendida = 0,
         valoracerto = 0,
         situacao = 'retirado'
   where idbloco = p_idbloco;
end;
$$;

create or replace function public.registrar_acerto(
  p_idbloco bigint,
  p_quantvendida integer,
  p_dataacerto date
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quantrifas integer;
  v_situacao text;
  v_valorbilhete numeric;
begin
  if not (private.pode_acesso('campanha') or private.pode_acesso('entregablocos')) then
    raise exception 'Sem permissão para acertar blocos.' using errcode = '42501';
  end if;
  if p_quantvendida is null or p_quantvendida < 0 then
    raise exception 'Informe uma quantidade válida de rifas vendidas.';
  end if;

  select d.quantrifas, d.situacao, c.valorbilhete
    into v_quantrifas, v_situacao, v_valorbilhete
  from public.campanha_distribuicao d
  join public.campanha_bloco b on b.idbloco = d.idbloco
  join public.campanha c on c.idcampanha = d.idcampanha
  where d.idbloco = p_idbloco;

  if v_quantrifas is null then
    raise exception 'Bloco não encontrado.';
  end if;
  if v_situacao <> 'retirado' then
    raise exception 'O bloco precisa estar retirado antes do acerto.';
  end if;
  if p_quantvendida > v_quantrifas then
    raise exception 'A quantidade vendida não pode passar das rifas retiradas.';
  end if;

  update public.campanha_distribuicao
     set quantvendida = p_quantvendida,
         valoracerto = round(p_quantvendida * v_valorbilhete, 2),
         dataacerto = coalesce(p_dataacerto, current_date),
         situacao = 'acertado'
   where idbloco = p_idbloco;
end;
$$;

revoke all on function public.criar_campanha(jsonb) from public;
revoke all on function public.atualizar_campanha(bigint, jsonb) from public;
revoke all on function public.criar_bloco(bigint, integer) from public;
revoke all on function public.salvar_bloco(bigint, integer, integer, integer) from public;
revoke all on function public.excluir_bloco(bigint) from public;
revoke all on function public.registrar_retirada(bigint, text, bigint, text, date) from public;
revoke all on function public.registrar_acerto(bigint, integer, date) from public;

grant execute on function public.criar_campanha(jsonb) to authenticated;
grant execute on function public.atualizar_campanha(bigint, jsonb) to authenticated;
grant execute on function public.criar_bloco(bigint, integer) to authenticated;
grant execute on function public.salvar_bloco(bigint, integer, integer, integer) to authenticated;
grant execute on function public.excluir_bloco(bigint) to authenticated;
grant execute on function public.registrar_retirada(bigint, text, bigint, text, date) to authenticated;
grant execute on function public.registrar_acerto(bigint, integer, date) to authenticated;

-- Liberações iniciais: os mesmos associados que já podem cadastrar fornecedores.
insert into public.usuario_menu (idusuario, chave, liberado)
select u.idusuario, c.chave, true
from (
  select distinct idusuario from public.usuario_menu
  where chave = 'fornecedores' and liberado
) u
cross join (values ('campanha'), ('campanhas'), ('entregablocos')) as c(chave)
on conflict (idusuario, chave) do nothing;
