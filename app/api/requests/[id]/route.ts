import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, notFound, serverError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";


export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const { data: request, error } = await supabase
    .from("financial_requests")
    .select(
      `*, company:companies(*),
       requester:users!financial_requests_requester_id_fkey(*),
       assignee:users!financial_requests_assignee_id_fkey(*),
       authorization_responsible:users!financial_requests_authorization_responsible_id_fkey(*)`
    )
    .eq("id", params.id)
    .single();

  if (error || !request) return notFound("Solicitação não encontrada.");
  if (user.role === "solicitante" && request.requester_id !== user.id) return forbidden();

  const [{ data: comments }, { data: attachments }, { data: history }, { data: assignees }] = await Promise.all([
    supabase
      .from("request_comments")
      .select("*, author:users(*)")
      .eq("request_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.from("request_attachments").select("*").eq("request_id", params.id).order("created_at", { ascending: true }),
    supabase
      .from("request_history")
      .select("*, actor:users(*)")
      .eq("request_id", params.id)
      .order("created_at", { ascending: true }),
    supabase.from("request_assignees").select("*, user:users(*)").eq("request_id", params.id),
  ]);

  return NextResponse.json({
    data: {
      ...request,
      comments: comments || [],
      attachments: attachments || [],
      history: history || [],
      watchers: assignees || [],
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const { data: existing } = await supabase.from("financial_requests").select("*").eq("id", params.id).single();
  if (!existing) return notFound("Solicitação não encontrada.");

  const isOwnerEditingDraft = user.role === "solicitante" && existing.requester_id === user.id && existing.status === "nova";
  const isStaff = user.role === "analista_financeiro" || user.role === "administrador";
  if (!isOwnerEditingDraft && !isStaff) return forbidden();

  const json = await req.json().catch(() => ({}));
  const allowedFields = [
    "title",
    "client_name",
    "document",
    "client_type",
    "total_amount",
    "discount_amount",
    "payment_method",
    "invoice_numbers",
    "reason",
    "details",
    "type_specific_data",
    "priority",
  ];
  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in json) update[field] = json[field];
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ data: existing });

  await supabase.rpc("set_config_actor", { actor_id: user.id }).then(() => {}, () => {});

  const { data, error } = await supabase.from("financial_requests").update(update).eq("id", params.id).select("*").single();
  if (error) return serverError(error);
  return NextResponse.json({ data });
}
