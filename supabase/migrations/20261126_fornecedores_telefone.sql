-- Telefone: DDD + 8 dígitos. Celular: DDD + 9 dígitos.
-- Normaliza os registros já gravados para o mesmo padrão visual e impede,
-- inclusive fora da aplicação, que valores com outra quantidade de dígitos
-- sejam salvos.

update public.fornecedor
set telefone = case
      when telefone is not null and length(regexp_replace(telefone, '\D', '', 'g')) = 10
        then '(' || substr(regexp_replace(telefone, '\D', '', 'g'), 1, 2) || ') '
          || substr(regexp_replace(telefone, '\D', '', 'g'), 3, 4) || '-'
          || substr(regexp_replace(telefone, '\D', '', 'g'), 7)
      else telefone
    end,
    celular = case
      when celular is not null and length(regexp_replace(celular, '\D', '', 'g')) = 11
        then '(' || substr(regexp_replace(celular, '\D', '', 'g'), 1, 2) || ') '
          || substr(regexp_replace(celular, '\D', '', 'g'), 3, 5) || '-'
          || substr(regexp_replace(celular, '\D', '', 'g'), 8)
      else celular
    end
where telefone is not null or celular is not null;

alter table public.fornecedor drop constraint if exists fornecedor_telefone_check;
alter table public.fornecedor add constraint fornecedor_telefone_check
  check (telefone is null or length(regexp_replace(telefone, '\D', '', 'g')) = 10);

alter table public.fornecedor drop constraint if exists fornecedor_celular_check;
alter table public.fornecedor add constraint fornecedor_celular_check
  check (celular is null or length(regexp_replace(celular, '\D', '', 'g')) = 11);
