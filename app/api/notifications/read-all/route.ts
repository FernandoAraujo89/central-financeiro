import { NextResponse } from "next/server";
import { getAuthedUser, unauthorized, serverError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";


export async function POST() {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  if (error) return serverError(error);
  return NextResponse.json({ ok: true });
}
