import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para Server Components / Route Handlers / Server Actions.
 * Usa os cookies da requisição para manter a sessão do usuário (via @supabase/ssr).
 *
 * Criação "lazy": só lança erro se for efetivamente chamada sem as env vars,
 * nunca no import do módulo — isso evita quebrar `next build` quando as
 * credenciais reais ainda não existem no ambiente de build.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const cookieStore = cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // chamado a partir de um Server Component — o middleware cuida do refresh
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // idem
        }
      },
    },
  });
}

/**
 * Cliente com a service role key — ignora RLS. Usar SOMENTE em rotas de API
 * server-side, após checar a role do usuário autenticado manualmente.
 * Nunca importar em código client-side.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase (service role) não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseJsClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
