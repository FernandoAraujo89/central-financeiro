import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, badRequest, serverError } from "@/lib/api-helpers";
import { createCompanySchema } from "@/lib/validation";
import { permissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { supabase } = auth;

  const { data, error } = await supabase.from("companies").select("*").order("name");
  if (error) return serverError(error);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;
  if (!permissions.canManageCompanies(user.role)) return forbidden();

  const json = await req.json().catch(() => null);
  const parsed = createCompanySchema.safeParse(json);
  if (!parsed.success) return badRequest("Dados inválidos.", parsed.error.flatten());

  const { data, error } = await supabase.from("companies").insert(parsed.data).select("*").single();
  if (error) return serverError(error);
  return NextResponse.json({ data }, { status: 201 });
}
