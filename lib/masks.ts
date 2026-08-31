// Máscaras e utilitários de formatação para CPF, CNPJ e valores em BRL.

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCNPJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskDocument(value: string, clientType: "pessoa_fisica" | "pessoa_juridica"): string {
  return clientType === "pessoa_fisica" ? maskCPF(value) : maskCNPJ(value);
}

export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === parseInt(cpf[10]);
}

export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(cnpj[i]) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const d1 = calc(12);
  const d2 = calc(13);
  return d1 === parseInt(cnpj[12]) && d2 === parseInt(cnpj[13]);
}

export function isValidDocument(value: string, clientType: "pessoa_fisica" | "pessoa_juridica"): boolean {
  return clientType === "pessoa_fisica" ? isValidCPF(value) : isValidCNPJ(value);
}

// --- Moeda (BRL) ---

/** Formata um número em reais: 1250.5 -> "R$ 1.250,50" */
export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Converte uma string de input (livre) em número. Aceita "1.250,50" ou "1250.5" ou dígitos puros de centavos. */
export function parseBRLInput(value: string): number | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  return parseInt(digits, 10) / 100;
}

/** Formata dígitos brutos (como digitados) para exibição tipo máscara de centavos: "125050" -> "R$ 1.250,50" */
export function maskCurrencyInput(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, "");
  if (!digits) return "";
  const value = parseInt(digits, 10) / 100;
  return formatBRL(value);
}
