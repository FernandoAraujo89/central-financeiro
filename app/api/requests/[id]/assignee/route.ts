import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-helpers";
import { updateAssigneeSchema } from "@/lib/validation";
import { permissions } from "@/lib/permissions";
import { assigneeChangedEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  if (!permissions.canChangeAssignee(user.role)) return forbidden();

  const json = await req.json().catch(() => null);
  const parsed = updateAssigneeSchema.safeParse(json);
  if (!parsed.success) return badRequest("Responsável inválido.", parsed.error.flatten());

  const { data: existing } = await supabase.from("financial_requests").select("*").eq("id", params.id).single();
  if (!existing) return notFound();

  await supabase.rpc("set_config_actor", { actor_id: user.id }).then(() => {}, () => {});

  const { data: updated, error } = await supabase
    .from("financial_requests")
    .update({ assignee_id: parsed.data.assignee_id })
    .eq("id", params.id)
    .select("*, company:companies(*), requester:users!financial_requests_requester_id_fkey(*)")
    .single();

  if (error) return serverError(error);

  if (parsed.data.assignee_id) {
    await supabase.from("request_assignees").upsert(
      { request_id: params.id, user_id: parsed.data.assignee_id, is_primary: true },
      { onConflict: "request_id,user_id" }
    );

    const { data: assignee } = await supabase.from("users").select("*").eq("id", parsed.data.assignee_id).single();

    if (assignee) {
      await supabase.from("notifications").insert({
        user_id: assignee.id,
        request_id: params.id,
        type: "responsavel_alterado",
        title: `Solicitação ${updated.request_number} atribuída a você`,
        body: updated.title,
      });

      const { data: lastComment } = await supabase
        .from("request_comments")
        .select("body")
        .eq("request_id", params.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { subject, html } = assigneeChangedEmail({
        requestNumber: updated.request_number,
        requestId: params.id,
        title: updated.title,
        clientName: updated.client_name,
        requestTypeLabel: updated.request_type,
        requesterName: updated.requester?.full_name || "—",
        lastComment: lastComment?.body || null,
      });
      await sendEmail({ to: assignee.email, subject, html });
    }
  }

  return NextResponse.json({ data: updated });
}
