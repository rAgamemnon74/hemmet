import { Role } from "@prisma/client";

export type Permission =
  // Meetings
  | "meeting:create"
  | "meeting:edit"
  | "meeting:view"
  | "meeting:vote"
  | "meeting:protocol"
  | "meeting:assign_roles"
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
  // Annual report & audit
  | "annual_report:edit"
  | "annual_report:view"
  | "audit:perform"
  | "audit:view"
  // Membership applications
  | "application:submit"
  | "application:review"
  // Admin
  | "admin:users"
  | "admin:integrations"
  | "admin:settings";

// Shared permission sets to reduce duplication
const BOARD_COMMON: Permission[] = [
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
  "annual_report:edit", "annual_report:view",
  "audit:view",
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    ...BOARD_COMMON,
    "meeting:create", "meeting:assign_roles",
    "annual:schedule",
    "expense:approve",
    "report:manage",
    "member:edit",
    "audit:perform",
    "application:review",
    "admin:users", "admin:integrations", "admin:settings",
  ],
  BOARD_CHAIRPERSON: [
    ...BOARD_COMMON,
    "meeting:create", "meeting:assign_roles",
    "annual:schedule",
    "expense:approve",
    "report:manage",
    "member:edit",
    "application:review",
    "admin:users", "admin:integrations",
  ],
  BOARD_SECRETARY: [
    ...BOARD_COMMON,
    "meeting:create", "meeting:assign_roles",
    "meeting:protocol",
  ],
  BOARD_TREASURER: [
    ...BOARD_COMMON,
    "expense:approve",
  ],
  BOARD_PROPERTY_MGR: [
    ...BOARD_COMMON,
    "report:manage",
  ],
  BOARD_ENVIRONMENT: [...BOARD_COMMON],
  BOARD_EVENTS: [...BOARD_COMMON],
  BOARD_MEMBER: [...BOARD_COMMON],
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
    "annual_report:view",
    "audit:view",
  ],
  AUDITOR: [
    "annual:view",
    "annual_report:view",
    "audit:perform", "audit:view",
    "document:view_board",
    "announcement:view",
    "member:view_registry",
  ],
  MEMBER: [
    "annual:view", "annual:vote",
    "motion:submit",
    "report:submit",
    "suggestion:submit",
    "announcement:view",
    "annual_report:view",
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

export function isAuditor(roles: Role[]): boolean {
  return roles.includes(Role.AUDITOR);
}

export function isAdmin(roles: Role[]): boolean {
  return roles.includes(Role.ADMIN);
}
