import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-helpers";
import { updateStatusSchema } from "@/lib/validation";
import { permissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  if (!permissions.canChangeStatus(user.role)) return forbidden();

  const json = await req.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(json);
  if (!parsed.success) return badRequest("Status inválido.", parsed.error.flatten());

  const { data: existing } = await supabase.from("financial_requests").select("id, status").eq("id", params.id).single();
  if (!existing) return notFound();

  await supabase.rpc("set_config_actor", { actor_id: user.id }).then(() => {}, () => {});

  const { data, error } = await supabase
    .from("financial_requests")
    .update({ status: parsed.data.status })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return serverError(error);
  return NextResponse.json({ data });
}
