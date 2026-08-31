import type { UserRole } from "./types";

/**
 * Regras de RBAC centralizadas — usadas tanto na UI (esconder/desabilitar
 * controles) quanto nas rotas de API (única fonte de verdade real, já que
 * a UI pode ser contornada).
 */
export const permissions = {
  canViewAllRequests(role: UserRole): boolean {
    return role === "analista_financeiro" || role === "administrador";
  },
  canChangeStatus(role: UserRole): boolean {
    return role === "analista_financeiro" || role === "administrador";
  },
  canChangeAssignee(role: UserRole): boolean {
    return role === "analista_financeiro" || role === "administrador";
  },
  canManageUsers(role: UserRole): boolean {
    return role === "administrador";
  },
  canManageCompanies(role: UserRole): boolean {
    return role === "administrador";
  },
  canManageSettings(role: UserRole): boolean {
    return role === "administrador";
  },
  canComment(_role: UserRole): boolean {
    return true;
  },
  canCreateRequest(_role: UserRole): boolean {
    return true;
  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  solicitante: "Solicitante",
  analista_financeiro: "Analista Financeiro",
  administrador: "Administrador",
};
