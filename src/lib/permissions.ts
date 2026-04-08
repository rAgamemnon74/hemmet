import { Role } from "@prisma/client";

export type Permission =
  // Meetings
  | "meeting:create"
  | "meeting:edit"
  | "meeting:view"
  | "meeting:vote"
  | "meeting:protocol"
  // Annual meetings
  | "annual:schedule"
  | "annual:view"
  | "annual:vote"
  // Motions
  | "motion:submit"
  | "motion:respond"
  // Expenses
  | "expense:submit"
  | "expense:approve"
  | "expense:view_all"
  // Tasks
  | "task:create"
  | "task:assign"
  | "task:view"
  // Damage reports
  | "report:submit"
  | "report:manage"
  // Suggestions
  | "suggestion:submit"
  | "suggestion:respond"
  // Announcements
  | "announcement:create"
  | "announcement:view"
  // Members
  | "member:view_registry"
  | "member:edit"
  // Documents
  | "document:upload"
  | "document:view_board"
  // Admin
  | "admin:users"
  | "admin:integrations"
  | "admin:settings";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "meeting:create", "meeting:edit", "meeting:view", "meeting:vote", "meeting:protocol",
    "annual:schedule", "annual:view", "annual:vote",
    "motion:submit", "motion:respond",
    "expense:submit", "expense:approve", "expense:view_all",
    "task:create", "task:assign", "task:view",
    "report:submit", "report:manage",
    "suggestion:submit", "suggestion:respond",
    "announcement:create", "announcement:view",
    "member:view_registry", "member:edit",
    "document:upload", "document:view_board",
    "admin:users", "admin:integrations", "admin:settings",
  ],
  BOARD_CHAIRPERSON: [
    "meeting:create", "meeting:edit", "meeting:view", "meeting:vote", "meeting:protocol",
    "annual:schedule", "annual:view", "annual:vote",
    "motion:submit", "motion:respond",
    "expense:submit", "expense:approve", "expense:view_all",
    "task:create", "task:assign", "task:view",
    "report:submit", "report:manage",
    "suggestion:submit", "suggestion:respond",
    "announcement:create", "announcement:view",
    "member:view_registry", "member:edit",
    "document:upload", "document:view_board",
    "admin:users", "admin:integrations",
  ],
  BOARD_TREASURER: [
    "meeting:edit", "meeting:view", "meeting:vote", "meeting:protocol",
    "annual:view", "annual:vote",
    "motion:submit", "motion:respond",
    "expense:submit", "expense:approve", "expense:view_all",
    "task:create", "task:assign", "task:view",
    "report:submit",
    "suggestion:submit", "suggestion:respond",
    "announcement:create", "announcement:view",
    "member:view_registry",
    "document:upload", "document:view_board",
  ],
  BOARD_PROPERTY_MGR: [
    "meeting:edit", "meeting:view", "meeting:vote", "meeting:protocol",
    "annual:view", "annual:vote",
    "motion:submit", "motion:respond",
    "expense:submit", "expense:view_all",
    "task:create", "task:assign", "task:view",
    "report:submit", "report:manage",
    "suggestion:submit", "suggestion:respond",
    "announcement:create", "announcement:view",
    "member:view_registry",
    "document:upload", "document:view_board",
  ],
  BOARD_ENVIRONMENT: [
    "meeting:edit", "meeting:view", "meeting:vote", "meeting:protocol",
    "annual:view", "annual:vote",
    "motion:submit", "motion:respond",
    "expense:submit", "expense:view_all",
    "task:create", "task:assign", "task:view",
    "report:submit",
    "suggestion:submit", "suggestion:respond",
    "announcement:create", "announcement:view",
    "member:view_registry",
    "document:upload", "document:view_board",
  ],
  BOARD_EVENTS: [
    "meeting:edit", "meeting:view", "meeting:vote", "meeting:protocol",
    "annual:view", "annual:vote",
    "motion:submit", "motion:respond",
    "expense:submit", "expense:view_all",
    "task:create", "task:assign", "task:view",
    "report:submit",
    "suggestion:submit", "suggestion:respond",
    "announcement:create", "announcement:view",
    "member:view_registry",
    "document:upload", "document:view_board",
  ],
  BOARD_MEMBER: [
    "meeting:edit", "meeting:view", "meeting:vote", "meeting:protocol",
    "annual:view", "annual:vote",
    "motion:submit", "motion:respond",
    "expense:submit", "expense:view_all",
    "task:create", "task:assign", "task:view",
    "report:submit",
    "suggestion:submit", "suggestion:respond",
    "announcement:create", "announcement:view",
    "member:view_registry",
    "document:upload", "document:view_board",
  ],
  BOARD_SUBSTITUTE: [
    "meeting:view",
    "annual:view", "annual:vote",
    "motion:submit",
    "expense:submit",
    "task:view",
    "report:submit",
    "suggestion:submit",
    "announcement:view",
    "document:view_board",
  ],
  MEMBER: [
    "annual:view", "annual:vote",
    "motion:submit",
    "report:submit",
    "suggestion:submit",
    "announcement:view",
  ],
  RESIDENT: [
    "report:submit",
    "suggestion:submit",
    "announcement:view",
  ],
};

export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  return userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export function hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(userRoles, p));
}

export function getUserPermissions(userRoles: Role[]): Permission[] {
  const permissions = new Set<Permission>();
  for (const role of userRoles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) {
      permissions.add(p);
    }
  }
  return Array.from(permissions);
}

export function isBoardMember(roles: Role[]): boolean {
  return roles.some((r) => r.startsWith("BOARD_") || r === "ADMIN");
}

export function isAdmin(roles: Role[]): boolean {
  return roles.includes(Role.ADMIN);
}
