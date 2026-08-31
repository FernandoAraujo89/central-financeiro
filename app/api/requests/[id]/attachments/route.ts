import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, notFound, badRequest, serverError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";


const ALLOWED_EXT = ["pdf", "png", "jpg", "jpeg", "xlsx", "docx"];
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

/**
 * Recebe um arquivo via multipart/form-data, envia para o bucket
 * "request-attachments" do Supabase Storage e cria a linha correspondente
 * em request_attachments. O :id da rota pode ser "novo" quando o upload
 * acontece antes da criação da solicitação (formulário de nova
 * solicitação) — nesse caso o anexo fica "solto" e é vinculado depois via
 * attachment_ids no POST /api/requests.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  if (params.id !== "novo") {
    const { data: request } = await supabase.from("financial_requests").select("id, requester_id").eq("id", params.id).single();
    if (!request) return notFound();
    if (user.role === "solicitante" && request.requester_id !== user.id) return forbidden();
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return badRequest("Envie o arquivo como multipart/form-data.");

  const file = formData.get("file");
  if (!(file instanceof File)) return badRequest("Nenhum arquivo enviado.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_EXT.includes(ext)) {
    return badRequest(`Tipo de arquivo não permitido. Use: ${ALLOWED_EXT.join(", ")}.`);
  }
  if (file.size > MAX_SIZE) {
    return badRequest("Arquivo muito grande (máx. 15MB).");
  }

  const path = `${params.id}/${crypto.randomUUID()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("request-attachments")
    .upload(path, arrayBuffer, { contentType: file.type });

  if (uploadError) return serverError(uploadError);

  const { data: attachment, error } = await supabase
    .from("request_attachments")
    .insert({
      request_id: params.id === "novo" ? null : params.id,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      content_type: file.type,
      uploaded_by: user.id,
    })
    .select("*")
    .single();

  if (error) return serverError(error);

  if (params.id !== "novo") {
    await supabase.from("request_history").insert({
      request_id: params.id,
      actor_id: user.id,
      action: `${user.full_name} anexou o arquivo "${file.name}".`,
    });
  }

  return NextResponse.json({ data: attachment }, { status: 201 });
}
