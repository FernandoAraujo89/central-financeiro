"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label, Input, Textarea } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserSelect } from "@/components/features/user-select";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { maskDocument, maskCurrencyInput, parseBRLInput, onlyDigits, isValidDocument } from "@/lib/masks";
import {
  CLIENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  REQUEST_TYPE_LABELS,
  type ClientType,
  type Company,
  type AppUser,
  type PaymentMethod,
  type RequestType,
} from "@/lib/types";
import { UploadCloud, X, FileText, Loader2, CheckCircle2 } from "lucide-react";

interface UploadedFile {
  id: string;
  file_name: string;
  file_size: number | null;
}

export function RequestForm({ companies, users, currentUser }: { companies: Company[]; users: AppUser[]; currentUser: AppUser }) {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = React.useState("");
  const [companyId, setCompanyId] = React.useState<string>("");
  const [requestType, setRequestType] = React.useState<RequestType>("cancelamento");
  const [clientType, setClientType] = React.useState<ClientType>("pessoa_juridica");
  const [document, setDocument] = React.useState("");
  const [clientName, setClientName] = React.useState("");
  const [responsibleId, setResponsibleId] = React.useState<string | null>(null);
  const [totalAmount, setTotalAmount] = React.useState("");
  const [discountAmount, setDiscountAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod | "">("");
  const [invoiceNumbers, setInvoiceNumbers] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState("");

  // campos específicos por tipo
  const [valorOriginal, setValorOriginal] = React.useState("");
  const [valorRenegociado, setValorRenegociado] = React.useState("");
  const [quantidadeParcelas, setQuantidadeParcelas] = React.useState("");
  const [novaDataVencimento, setNovaDataVencimento] = React.useState("");
  const [quantidadeBoletos, setQuantidadeBoletos] = React.useState("");
  const [primeiroVencimento, setPrimeiroVencimento] = React.useState("");
  const [intervaloVencimentos, setIntervaloVencimentos] = React.useState("");
  const [valorDesconto, setValorDesconto] = React.useState("");

  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [successNumber, setSuccessNumber] = React.useState<string | null>(null);

  const totalAmountNum = parseBRLInput(totalAmount);
  const discountAmountNum = parseBRLInput(discountAmount);
  const valorOriginalNum = parseBRLInput(valorOriginal);
  const valorRenegociadoNum = parseBRLInput(valorRenegociado);
  const valorDescontoNum = parseBRLInput(valorDesconto);

  const valorRestante = totalAmountNum !== null && discountAmountNum !== null ? totalAmountNum - discountAmountNum : null;
  const valorFinalDesconto = valorOriginalNum !== null && valorDescontoNum !== null ? valorOriginalNum - valorDescontoNum : null;

  async function handleFileUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/requests/novo/attachments", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) {
          toast({ title: "Falha ao enviar anexo", description: json.error, variant: "error" });
          continue;
        }
        setFiles((prev) => [...prev, { id: json.data.id, file_name: json.data.file_name, file_size: json.data.file_size }]);
      }
    } finally {
      setUploading(false);
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (title.trim().length < 3) newErrors.title = "Informe um título com pelo menos 3 caracteres.";
    if (!companyId) newErrors.companyId = "Selecione a empresa solicitante.";
    if (!isValidDocument(document, clientType)) newErrors.document = `${clientType === "pessoa_fisica" ? "CPF" : "CNPJ"} inválido.`;
    if (clientName.trim().length < 2) newErrors.clientName = "Informe o nome do cliente.";
    if (reason.trim().length < 3) newErrors.reason = "Descreva o motivo da solicitação.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast({ title: "Revise os campos destacados", variant: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const type_specific_data: Record<string, unknown> = {};
      if (requestType === "renegociacao") {
        Object.assign(type_specific_data, {
          valor_original: valorOriginalNum,
          valor_renegociado: valorRenegociadoNum,
          quantidade_parcelas: quantidadeParcelas ? parseInt(quantidadeParcelas) : null,
          nova_data_vencimento: novaDataVencimento || null,
        });
      } else if (requestType === "parcial") {
        Object.assign(type_specific_data, { valor_restante: valorRestante });
      } else if (requestType === "geracao_boletos") {
        Object.assign(type_specific_data, {
          quantidade_boletos: quantidadeBoletos ? parseInt(quantidadeBoletos) : null,
          primeiro_vencimento: primeiroVencimento || null,
          intervalo_vencimentos: intervaloVencimentos ? parseInt(intervaloVencimentos) : null,
        });
      } else if (requestType === "desconto") {
        Object.assign(type_specific_data, {
          valor_original: valorOriginalNum,
          valor_desconto: valorDescontoNum,
          valor_final: valorFinalDesconto,
        });
      }

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          company_id: companyId,
          client_type: clientType,
          document: onlyDigits(document),
          client_name: clientName,
          request_type: requestType,
          authorization_responsible_id: responsibleId,
          total_amount: totalAmountNum,
          discount_amount: discountAmountNum,
          payment_method: paymentMethod || null,
          invoice_numbers: invoiceNumbers || null,
          reason,
          details: details || null,
          type_specific_data,
          attachment_ids: files.map((f) => f.id),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Não foi possível enviar", description: json.error || "Verifique os dados.", variant: "error" });
        setSubmitting(false);
        return;
      }
      setSuccessNumber(json.data.request_number);
      toast({ title: "Solicitação enviada com sucesso.", description: `Nº da solicitação: ${json.data.request_number}`, variant: "success" });
      setTimeout(() => router.push(`/solicitacoes/${json.data.id}`), 1200);
    } catch (err) {
      toast({
        title: "Supabase não configurado",
        description: "Configure as variáveis de ambiente para habilitar o envio.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (successNumber) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 py-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <p className="text-lg font-semibold text-emerald-800">Solicitação enviada com sucesso.</p>
        <p className="text-sm text-emerald-700">Nº da solicitação: {successNumber}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-800">Identificação</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Título / Identificação da Demanda *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Cancelamento de contrato — Cliente XPTO" />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <Label>Empresa Solicitante *</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.companyId && <p className="mt-1 text-xs text-red-600">{errors.companyId}</p>}
          </div>

          <div>
            <Label>Solicitante</Label>
            <Input value={currentUser.full_name} disabled />
          </div>

          <div>
            <Label>Tipo de Solicitação Financeira *</Label>
            <Select value={requestType} onValueChange={(v) => setRequestType(v as RequestType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Responsável pela autorização</Label>
            <UserSelect users={users} value={responsibleId} onChange={setResponsibleId} placeholder="Opcional" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-800">Dados do cliente</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Tipo de Cliente *</Label>
            <Select value={clientType} onValueChange={(v) => (setClientType(v as ClientType), setDocument(""))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CLIENT_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{clientType === "pessoa_fisica" ? "CPF *" : "CNPJ *"}</Label>
            <Input
              value={document}
              onChange={(e) => setDocument(maskDocument(e.target.value, clientType))}
              placeholder={clientType === "pessoa_fisica" ? "000.000.000-00" : "00.000.000/0000-00"}
            />
            {errors.document && <p className="mt-1 text-xs text-red-600">{errors.document}</p>}
          </div>

          <div className="md:col-span-2">
            <Label>Nome do Cliente *</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Razão social ou nome completo" />
            {errors.clientName && <p className="mt-1 text-xs text-red-600">{errors.clientName}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-800">Detalhes financeiros</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Valor Total</Label>
            <Input value={totalAmount} onChange={(e) => setTotalAmount(maskCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
          </div>

          {(requestType === "parcial") && (
            <div>
              <Label>Valor a Abater</Label>
              <Input value={discountAmount} onChange={(e) => setDiscountAmount(maskCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
            </div>
          )}

          <div>
            <Label>Forma de Pagamento</Label>
            <Select value={paymentMethod || "none"} onValueChange={(v) => setPaymentMethod(v === "none" ? "" : (v as PaymentMethod))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informado</SelectItem>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Número dos Boletos</Label>
            <Input value={invoiceNumbers} onChange={(e) => setInvoiceNumbers(e.target.value)} placeholder="Ex.: 000123, 000124, 000125…" />
          </div>

          {requestType === "parcial" && valorRestante !== null && (
            <div className="md:col-span-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              Valor restante (calculado): <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorRestante)}</strong>
            </div>
          )}
        </div>
      </section>

      {requestType === "renegociacao" && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-800">Dados da renegociação</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label>Valor original</Label>
              <Input value={valorOriginal} onChange={(e) => setValorOriginal(maskCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
            </div>
            <div>
              <Label>Valor renegociado</Label>
              <Input value={valorRenegociado} onChange={(e) => setValorRenegociado(maskCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
            </div>
            <div>
              <Label>Quantidade de parcelas</Label>
              <Input type="number" min={1} value={quantidadeParcelas} onChange={(e) => setQuantidadeParcelas(e.target.value)} />
            </div>
            <div>
              <Label>Nova data de vencimento</Label>
              <Input type="date" value={novaDataVencimento} onChange={(e) => setNovaDataVencimento(e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {requestType === "geracao_boletos" && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-800">Dados da geração de boletos</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label>Quantidade de boletos</Label>
              <Input type="number" min={1} value={quantidadeBoletos} onChange={(e) => setQuantidadeBoletos(e.target.value)} />
            </div>
            <div>
              <Label>Primeiro vencimento</Label>
              <Input type="date" value={primeiroVencimento} onChange={(e) => setPrimeiroVencimento(e.target.value)} />
            </div>
            <div>
              <Label>Intervalo entre vencimentos (dias)</Label>
              <Input type="number" min={1} value={intervaloVencimentos} onChange={(e) => setIntervaloVencimentos(e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {requestType === "desconto" && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-neutral-800">Dados do desconto</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label>Valor original</Label>
              <Input value={valorOriginal} onChange={(e) => setValorOriginal(maskCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
            </div>
            <div>
              <Label>Valor do desconto</Label>
              <Input value={valorDesconto} onChange={(e) => setValorDesconto(maskCurrencyInput(e.target.value))} placeholder="R$ 0,00" />
            </div>
            {valorFinalDesconto !== null && (
              <div className="md:col-span-2 rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                Valor final (calculado): <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorFinalDesconto)}</strong>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-800">Anexos</h2>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center hover:border-primary-400 hover:bg-primary-50/40">
          <UploadCloud className="h-7 w-7 text-neutral-400" />
          <span className="text-sm text-neutral-600">
            <strong className="text-primary-600">Clique para enviar</strong> ou arraste os arquivos
          </span>
          <span className="text-xs text-neutral-400">PDF, PNG, JPG, JPEG, XLSX ou DOCX — até 15MB cada</span>
          <input
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </label>
        {uploading && (
          <p className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Enviando arquivo(s)…
          </p>
        )}
        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-neutral-700 truncate">
                  <FileText className="h-4 w-4 text-neutral-400 shrink-0" /> {f.file_name}
                </span>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))} className="text-neutral-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-neutral-800">Motivo e observações</h2>
        <div className="space-y-5">
          <div>
            <Label>Motivo *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Descreva o motivo da solicitação" />
            {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason}</p>}
          </div>
          <div>
            <Label>Observações / Detalhes</Label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Informações adicionais (opcional)" />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 pb-8">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar solicitação
        </Button>
      </div>
    </form>
  );
}
