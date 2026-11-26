-- Consulta de fornecedores separada do cadastro.
-- A política original (fornecedor_acesso, FOR ALL) continua valendo para quem
-- pode cadastrar (chave "fornecedores"). Esta política adicional concede apenas
-- SELECT a quem tiver somente a chave "fornecedoresconsulta" liberada.
-- As políticas são permissivas: basta uma delas para liberar a leitura.

drop policy if exists fornecedor_consulta on public.fornecedor;
create policy fornecedor_consulta on public.fornecedor
  for select to authenticated
  using (private.pode_acesso('fornecedoresconsulta'));
