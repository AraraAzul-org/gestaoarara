-- Lista mínima de pessoas para o campo digitável da entrega de blocos.
-- Evita abrir a leitura completa de usuario/jovem para quem só entrega rifas.

create or replace function public.pessoas_para_entrega()
returns table (id bigint, nome text, tipo text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (
    private.pode_acesso('campanha')
    or private.pode_acesso('campanhas')
    or private.pode_acesso('entregablocos')
  ) then
    raise exception 'Sem permissão para listar pessoas da entrega.' using errcode = '42501';
  end if;

  return query
    select u.idusuario, u.nome, 'Associado'::text
    from public.usuario u
    where u.ativo
    union all
    select j.idjovem, j.nome, 'Jovem'::text
    from public.jovem j
    where j.ativo;
end;
$$;

revoke all on function public.pessoas_para_entrega() from public;
grant execute on function public.pessoas_para_entrega() to authenticated;
