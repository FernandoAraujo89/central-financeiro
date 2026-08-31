// Tipos compartilhados do domínio Fin-Hub.
// Espelham as tabelas definidas em supabase/migrations/0001_init.sql

export type UserRole = "solicitante" | "analista_financeiro" | "administrador";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export type RequestStatus =
  | "nova"
  | "em_analise"
  | "em_validacao"
  | "aguardando_informacoes"
  | "aguardando_responsavel"
  | "aprovada"
  | "reprovada"
  | "cancelada"
  | "concluida";

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  nova: "Nova",
  em_analise: "Em análise",
  em_validacao: "Em validação",
  aguardando_informacoes: "Aguardando informações",
  aguardando_responsavel: "Aguardando responsável",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
  concluida: "Concluída",
};

export type RequestPriority = "baixa" | "normal" | "alta" | "urgente";

export const REQUEST_PRIORITY_LABELS: Record<RequestPriority, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export type RequestType =
  | "cancelamento"
  | "renegociacao"
  | "parcial"
  | "geracao_boletos"
  | "desconto";

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  cancelamento: "Cancelamento",
  renegociacao: "Renegociação",
  parcial: "Parcial",
  geracao_boletos: "Geração de boletos",
  desconto: "Desconto",
};

export type ClientType = "pessoa_fisica" | "pessoa_juridica";

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  pessoa_fisica: "Pessoa Física",
  pessoa_juridica: "Pessoa Jurídica",
};

export type PaymentMethod = "boleto" | "pix" | "cartao" | "transferencia" | "outro";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  boleto: "Boleto",
  pix: "PIX",
  cartao: "Cartão",
  transferencia: "Transferência",
  outro: "Outro",
};

export interface TypeSpecificData {
  // renegociação
  valor_original?: number;
  valor_renegociado?: number;
  quantidade_parcelas?: number;
  nova_data_vencimento?: string;
  // parcial
  valor_restante?: number;
  // geração de boletos
  quantidade_boletos?: number;
  primeiro_vencimento?: string;
  intervalo_vencimentos?: number;
  // desconto
  valor_desconto?: number;
  valor_final?: number;
}

export interface FinancialRequest {
  id: string;
  request_number: string; // FIN-000123
  title: string;
  company_id: string;
  requester_id: string;
  client_type: ClientType;
  document: string;
  client_name: string;
  request_type: RequestType;
  authorization_responsible_id: string | null;
  total_amount: number | null;
  discount_amount: number | null;
  payment_method: PaymentMethod | null;
  invoice_numbers: string | null;
  reason: string;
  details: string | null;
  type_specific_data: TypeSpecificData | null;
  status: RequestStatus;
  priority: RequestPriority;
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  // joins (opcionais, preenchidos por queries)
  company?: Company;
  requester?: AppUser;
  assignee?: AppUser | null;
  authorization_responsible?: AppUser | null;
}

export interface RequestAttachment {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface RequestComment {
  id: string;
  request_id: string;
  author_id: string;
  body: string;
  mentioned_user_ids: string[] | null;
  created_at: string;
  author?: AppUser;
  attachments?: RequestAttachment[];
}

export interface RequestHistory {
  id: string;
  request_id: string;
  actor_id: string | null;
  action: string;
  created_at: string;
  actor?: AppUser;
}

export interface RequestAssignee {
  id: string;
  request_id: string;
  user_id: string;
  is_primary: boolean;
  created_at: string;
  user?: AppUser;
}

export type NotificationType =
  | "nova_solicitacao"
  | "mencao"
  | "responsavel_alterado"
  | "novo_retorno"
  | "status_alterado";

export interface AppNotification {
  id: string;
  user_id: string;
  request_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

export interface RequestFilters {
  status?: RequestStatus[];
  company_id?: string;
  requester_id?: string;
  request_type?: RequestType;
  assignee_id?: string;
  date_from?: string;
  date_to?: string;
  client_name?: string;
  document?: string;
  search?: string;
  page?: number;
  page_size?: number;
}
