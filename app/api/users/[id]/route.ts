import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, serverError, badRequest } from "@/lib/api-helpers";
import { updateUserSchema } from "@/lib/validation";
import { permissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";


export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;
  if (!permissions.canManageUsers(user.role)) return forbidden();

  const json = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(json);
  if (!parsed.success) return badRequest("Dados inválidos.", parsed.error.flatten());

  const { data, error } = await supabase.from("users").update(parsed.data).eq("id", params.id).select("*").single();
  if (error) return serverError(error);
  return NextResponse.json({ data });
}
