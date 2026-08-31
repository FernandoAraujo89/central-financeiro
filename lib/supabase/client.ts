"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em componentes client-side ("use client").
 * Lê as credenciais públicas das variáveis de ambiente NEXT_PUBLIC_*.
 *
 * A criação é "lazy" (função, não uma instância no escopo do módulo) para
 * que a ausência das env vars não derrube o build/import em tempo de
 * carregamento do módulo — o erro só aparece se o código realmente tentar
 * usar o cliente sem as credenciais configuradas.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(url, anonKey);
}
