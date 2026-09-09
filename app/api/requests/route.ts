import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, badRequest, serverError } from "@/lib/api-helpers";
import { createRequestSchema } from "@/lib/validation";
import { newRequestEmail, sendEmail } from "@/lib/email";
import { REQUEST_TYPE_LABELS } from "@/lib/types";
import { formatBRL } from "@/lib/masks";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const params = req.nextUrl.searchParams;
  let query = supabase
    .from("financial_requests")
    .select(
      "*, company:companies(*), requester:users!financial_requests_requester_id_fkey(*), assignee:users!financial_requests_assignee_id_fkey(*)",
      { count: "exact" }
    );

  // RBAC: solicitante só vê as próprias (RLS já garante no banco; filtramos aqui também por clareza/performance)
  if (user.role === "solicitante") {
    query = query.eq("requester_id", user.id);
  }

  const status = params.get("status");
  if (status) query = query.in("status", status.split(","));

  const companyId = params.get("company_id");
  if (companyId) query = query.eq("company_id", companyId);

  const requesterId = params.get("requester_id");
  if (requesterId) query = query.eq("requester_id", requesterId);

  const requestType = params.get("request_type");
  if (requestType) query = query.eq("request_type", requestType);

  const assigneeId = params.get("assignee_id");
  if (assigneeId) query = query.eq("assignee_id", assigneeId);

  if (params.get("mine") === "1") query = query.eq("requester_id", user.id);
  if (params.get("assigned") === "1") query = query.eq("assignee_id", user.id);

  const dateFrom = params.get("date_from");
  if (dateFrom) query = query.gte("created_at", dateFrom);
  const dateTo = params.get("date_to");
  if (dateTo) query = query.lte("created_at", dateTo);

  const clientName = params.get("client_name");
  if (clientName) query = query.ilike("client_name", `%${clientName}%`);

  const document = params.get("document");
  if (document) query = query.ilike("document", `%${document}%`);

  const search = params.get("search");
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,client_name.ilike.%${search}%,document.ilike.%${search}%,request_number.ilike.%${search}%`
    );
  }

  const page = parseInt(params.get("page") || "1", 10);
  const pageSize = parseInt(params.get("page_size") || "20", 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) return serverError(error);

  return NextResponse.json({ data, count, page, page_size: pageSize });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;

  const json = await req.json().catch(() => null);
  if (!json) return badRequest("JSON inválido.");

  const parsed = createRequestSchema.safeParse(json);
  if (!parsed.success) return badRequest("Dados inválidos.", parsed.error.flatten());

  const payload = parsed.data;

  // O título é sempre gerado no servidor a partir do tipo de solicitação e
  // do nome do cliente ("Tipo - Cliente"), independente do que o cliente
  // tenha enviado — garante a regra mesmo se o formulário for contornado.
  const title = `${REQUEST_TYPE_LABELS[payload.request_type]} - ${payload.client_name}`;

  const { data: request, error } = await supabase
    .from("financial_requests")
    .insert({
      title,
      company_id: payload.company_id,
      requester_id: user.id,
      client_type: payload.client_type,
      document: payload.document,
      client_name: payload.client_name,
      distributor: payload.distributor || null,
      request_type: payload.request_type,
      authorization_responsible: payload.authorization_responsible || null,
      total_amount: payload.total_amount ?? null,
      discount_amount: payload.discount_amount ?? null,
      payment_method: payload.payment_method || null,
      invoice_numbers: payload.invoice_numbers || null,
      reason: payload.reason,
      details: payload.details || null,
      type_specific_data: payload.type_specific_data || {},
      priority: payload.priority || "normal",
    })
    .select("*")
    .single();

  if (error) return serverError(error);

  // Vincula anexos que já foram enviados ao storage antes do submit (fluxo de upload prévio)
  if (payload.attachment_ids && payload.attachment_ids.length > 0) {
    await supabase
      .from("request_attachments")
      .update({ request_id: request.id })
      .in("id", payload.attachment_ids);
  }

  // Notificação in-app + e-mail para o responsável financeiro
  const financialEmail = process.env.FINANCIAL_NOTIFICATION_EMAIL;
  const { data: analysts } = await supabase.from("users").select("id, email").eq("role", "analista_financeiro").eq("active", true);

  if (analysts && analysts.length > 0) {
    await supabase.from("notifications").insert(
      analysts.map((a: { id: string }) => ({
        user_id: a.id,
        request_id: request.id,
        type: "nova_solicitacao",
        title: `Nova solicitação ${request.request_number}`,
        body: request.title,
      }))
    );
  }

  const { subject, html } = newRequestEmail({
    requestNumber: request.request_number,
    requestId: request.id,
    title: request.title,
    clientName: payload.client_name,
    requesterName: user.full_name,
    requestTypeLabel: REQUEST_TYPE_LABELS[payload.request_type],
    totalAmount: payload.total_amount ? formatBRL(payload.total_amount) : null,
  });

  const recipients = [
    ...(financialEmail ? [financialEmail] : []),
    ...(analysts?.map((a: { email: string }) => a.email) || []),
  ];
  if (recipients.length > 0) {
    await sendEmail({ to: Array.from(new Set(recipients)), subject, html });
  }

  return NextResponse.json({ data: request }, { status: 201 });
}
