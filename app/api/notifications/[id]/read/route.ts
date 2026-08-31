import { NextResponse } from "next/server";
import { getAuthedUser, unauthorized, serverError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";


export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return serverError(error);
  return NextResponse.json({ data });
}
