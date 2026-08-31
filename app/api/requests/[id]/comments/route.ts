import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-helpers";
import { createCommentSchema } from "@/lib/validation";
import { mentionEmail, newReplyEmail, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const { data: request } = await supabase.from("financial_requests").select("*").eq("id", params.id).single();
  if (!request) return notFound();
  if (user.role === "solicitante" && request.requester_id !== user.id) return forbidden();

  const json = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(json);
  if (!parsed.success) return badRequest("Comentário inválido.", parsed.error.flatten());

  const { data: comment, error } = await supabase
    .from("request_comments")
    .insert({
      request_id: params.id,
      author_id: user.id,
      body: parsed.data.body,
      mentioned_user_ids: parsed.data.mentioned_user_ids || [],
    })
    .select("*, author:users(*)")
    .single();

  if (error) return serverError(error);

  if (parsed.data.attachment_ids && parsed.data.attachment_ids.length > 0) {
    await supabase.from("request_attachments").update({ request_id: params.id }).in("id", parsed.data.attachment_ids);
  }

  // Log manual no histórico (comentário) — mais legível do que um trigger genérico
  await supabase.from("request_history").insert({
    request_id: params.id,
    actor_id: user.id,
    action: `${user.full_name} comentou na solicitação.`,
  });

  // Notifica menções
  const mentionedIds = parsed.data.mentioned_user_ids || [];
  if (mentionedIds.length > 0) {
    const { data: mentionedUsers } = await supabase.from("users").select("*").in("id", mentionedIds);
    if (mentionedUsers) {
      await supabase.from("notifications").insert(
        mentionedUsers.map((u: { id: string }) => ({
          user_id: u.id,
          request_id: params.id,
          type: "mencao",
          title: `Você foi mencionado na solicitação ${request.request_number}`,
          body: parsed.data.body,
        }))
      );
      for (const u of mentionedUsers as Array<{ id: string; email: string }>) {
        const { subject, html } = mentionEmail({
          requestNumber: request.request_number,
          requestId: params.id,
          mentionedByName: user.full_name,
          commentBody: parsed.data.body,
        });
        await sendEmail({ to: u.email, subject, html });
      }
    }
  }

  // Se quem comentou é staff e não é o próprio solicitante, avisa o solicitante original ("novo retorno")
  if (user.role !== "solicitante" && request.requester_id !== user.id) {
    const { data: requester } = await supabase.from("users").select("*").eq("id", request.requester_id).single();
    if (requester) {
      await supabase.from("notifications").insert({
        user_id: requester.id,
        request_id: params.id,
        type: "novo_retorno",
        title: `Novo retorno na solicitação ${request.request_number}`,
        body: parsed.data.body,
      });
      const { subject, html } = newReplyEmail({
        requestNumber: request.request_number,
        requestId: params.id,
        analystName: user.full_name,
        commentBody: parsed.data.body,
      });
      await sendEmail({ to: requester.email, subject, html });
    }
  }

  return NextResponse.json({ data: comment }, { status: 201 });
}
