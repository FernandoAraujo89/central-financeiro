import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser, unauthorized, forbidden, serverError } from "@/lib/api-helpers";
import { permissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * "Excluir" uma empresa faz uma exclusão lógica (active = false) em vez de
 * apagar a linha: solicitações antigas continuam referenciando a empresa
 * pelo company_id, e a empresa some dos formulários/filtros (que já
 * filtram por active = true).
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthedUser();
  if (!auth) return unauthorized();
  const { user, supabase } = auth;
  if (!permissions.canManageCompanies(user.role)) return forbidden();

  const { data, error } = await supabase
    .from("companies")
    .update({ active: false })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return serverError(error);
  return NextResponse.json({ data });
}
