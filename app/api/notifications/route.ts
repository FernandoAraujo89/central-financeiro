import { NextResponse } from "next/server";
import { getAuthedUser, unauthorized, serverError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";


export async function GET() {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return serverError(error);
  return NextResponse.json({ data });
}
