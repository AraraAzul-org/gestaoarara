-- O valor do acerto é sempre a quantidade vendida multiplicada pelo valor do
-- bilhete vigente no cadastro da campanha. Quando o bilhete é alterado, os
-- acertos já registrados daquela campanha são recalculados junto com o total.
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

  update public.campanha_distribuicao d
     set valoracerto = round(d.quantvendida * c.valorbilhete, 2)
    from public.campanha c
   where c.idcampanha = p_idcampanha
     and d.idcampanha = p_idcampanha
     and d.situacao = 'acertado';
end;
$$;

-- Corrige acertos gravados antes de uma eventual alteração do valor do bilhete.
select private.recalcular_valortotal_campanha(idcampanha) from public.campanha;
