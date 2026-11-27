-- Revoga o EXECUTE implícito concedido ao anon nas RPCs de campanhas.
-- As funções continuam disponíveis apenas para authenticated e validam a
-- permissão específica (campanha, campanhas ou entregablocos) internamente.

revoke all on function public.criar_campanha(jsonb) from public, anon;
revoke all on function public.atualizar_campanha(bigint, jsonb) from public, anon;
revoke all on function public.criar_bloco(bigint, integer) from public, anon;
revoke all on function public.salvar_bloco(bigint, integer, integer, integer) from public, anon;
revoke all on function public.excluir_bloco(bigint) from public, anon;
revoke all on function public.registrar_retirada(bigint, text, bigint, text, date) from public, anon;
revoke all on function public.registrar_acerto(bigint, integer, date) from public, anon;
revoke all on function public.pessoas_para_entrega() from public, anon;
