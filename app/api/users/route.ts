import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-helpers";
import { createUserSchema } from "@/lib/validation";
import { permissions } from "@/lib/permissions";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { supabase } = auth;

  const { data, error } = await supabase.from("users").select("*").order("full_name");
  if (error) return serverError(error);
  return NextResponse.json({ data });
}

/**
 * Cria um novo usuário (admin only). Usa a service role key para criar o
 * usuário diretamente no Supabase Auth (convite por e-mail/senha
 * temporária) — o trigger on_auth_user_created cria a linha em
 * public.users automaticamente; em seguida ajustamos a role desejada.
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user } = auth;
  if (!permissions.canManageUsers(user.role)) return forbidden();

  const json = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(json);
  if (!parsed.success) return badRequest("Dados de usuário inválidos.", parsed.error.flatten());

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch (err) {
    return serverError(err);
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password || crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name, role: parsed.data.role },
  });

  if (error || !created.user) return serverError(error || new Error("Falha ao criar usuário."));

  await admin
    .from("users")
    .update({ full_name: parsed.data.full_name, role: parsed.data.role })
    .eq("id", created.user.id);

  const { data: profile } = await admin.from("users").select("*").eq("id", created.user.id).single();

  return NextResponse.json({ data: profile }, { status: 201 });
}
