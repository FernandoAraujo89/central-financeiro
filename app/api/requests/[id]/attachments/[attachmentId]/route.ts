import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, notFound, serverError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const SIGNED_URL_EXPIRES_IN = 60; // segundos

/**
 * Gera uma URL assinada e temporária para abrir/baixar um anexo.
 * O arquivo fica em um bucket privado no Supabase Storage — o front-end
 * nunca tem acesso direto ao `file_path`, só a esta URL de curta duração,
 * gerada depois de confirmar que o usuário tem acesso à solicitação.
 * Passe `?download=1` para forçar o download (Content-Disposition: attachment)
 * em vez de abrir o arquivo no navegador.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string; attachmentId: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const { data: request } = await supabase.from("financial_requests").select("id, requester_id").eq("id", params.id).single();
  if (!request) return notFound("Solicitação não encontrada.");
  if (user.role === "solicitante" && request.requester_id !== user.id) return forbidden();

  const { data: attachment } = await supabase
    .from("request_attachments")
    .select("*")
    .eq("id", params.attachmentId)
    .eq("request_id", params.id)
    .single();
  if (!attachment) return notFound("Anexo não encontrado.");

  const download = req.nextUrl.searchParams.get("download") === "1";

  const { data: signed, error } = await supabase.storage
    .from("request-attachments")
    .createSignedUrl(attachment.file_path, SIGNED_URL_EXPIRES_IN, download ? { download: attachment.file_name } : undefined);

  if (error || !signed) return serverError(error || new Error("Não foi possível gerar o link do anexo."));

  return NextResponse.json({ data: { url: signed.signedUrl, file_name: attachment.file_name, content_type: attachment.content_type } });
}
