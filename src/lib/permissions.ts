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
  // Nominations
  | "nomination:view"
  | "nomination:submit"
  | "nomination:manage"
  | "nomination:finalize"
  // Transfers
  | "transfer:create"
  | "transfer:review"
  | "transfer:manage_financial"
  | "transfer:view"
  // Contracts & Procurement
  | "contract:view"
  | "contract:manage"
  | "procurement:view"
  | "procurement:manage"
  | "contractor:view"
  | "contractor:manage"
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
  "contract:view", "procurement:view", "contractor:view",
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
    "transfer:create", "transfer:review", "transfer:manage_financial", "transfer:view",
    "contract:manage", "procurement:manage", "contractor:manage",
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
    "transfer:create", "transfer:review", "transfer:view",
    "contract:manage", "procurement:manage", "contractor:manage",
    "admin:users", "admin:integrations",
  ],
  BOARD_SECRETARY: [
    ...BOARD_COMMON,
    "meeting:create", "meeting:assign_roles",
    "meeting:protocol",
    "transfer:view",
  ],
  BOARD_TREASURER: [
    ...BOARD_COMMON,
    "expense:approve",
    "application:review",
    "transfer:create", "transfer:manage_financial", "transfer:view",
    "contract:manage", "procurement:manage", "contractor:manage",
  ],
  BOARD_PROPERTY_MGR: [
    ...BOARD_COMMON,
    "report:manage",
    "contract:manage", "procurement:manage", "contractor:manage",
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
    "meeting:view", "meeting:protocol",
    "expense:view_all",
    "document:view_board",
    "announcement:view",
    "member:view_registry",
    "contract:view", "procurement:view", "contractor:view",
  ],
  AUDITOR_SUBSTITUTE: [
    "annual:view",
    "annual_report:view",
    "audit:view",
    "meeting:view",
    "document:view_board",
    "announcement:view",
    "member:view_registry",
  ],
  NOMINATING_COMMITTEE: [
    "annual:view", "annual:vote",
    "nomination:view", "nomination:manage",
    "member:view_registry",
    "announcement:view",
  ],
  NOMINATING_COMMITTEE_CHAIR: [
    "annual:view", "annual:vote",
    "nomination:view", "nomination:manage", "nomination:finalize",
    "member:view_registry",
    "announcement:view",
  ],
  MEMBER: [
    "annual:view", "annual:vote",
    "motion:submit",
    "nomination:view", "nomination:submit",
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
