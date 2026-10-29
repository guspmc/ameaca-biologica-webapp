-- Proteção adicional: convites só são acessados pelas RPCs SECURITY DEFINER.
-- Sem políticas, acesso direto por roles comuns permanece bloqueado.
-- Aplicada somente no projeto Supabase de TESTE em 28/10/2026.
ALTER TABLE app_private.convites_mesa ENABLE ROW LEVEL SECURITY;
