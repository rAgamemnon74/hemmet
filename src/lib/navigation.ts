import {
  Home,
  Users,
  CalendarDays,
  FileText,
  Receipt,
  CheckSquare,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Megaphone,
  Settings,
  Vote,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "./permissions";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  children?: NavItem[];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: "Översikt",
    items: [
      { label: "Dashboard", href: "/", icon: Home },
    ],
  },
  {
    title: "Styrelse",
    items: [
      { label: "Möten", href: "/styrelse/moten", icon: CalendarDays, permission: "meeting:view" },
      { label: "Ärenden", href: "/styrelse/arenden", icon: CheckSquare, permission: "task:view" },
      { label: "Beslut", href: "/styrelse/beslut", icon: BookOpen, permission: "meeting:view" },
      { label: "Utlägg", href: "/styrelse/utlagg", icon: Receipt, permission: "expense:submit" },
      { label: "Dokument", href: "/styrelse/dokument", icon: FileText, permission: "document:view_board" },
    ],
  },
  {
    title: "Medlemmar",
    items: [
      { label: "Motioner", href: "/medlem/motioner", icon: Vote, permission: "motion:submit" },
      { label: "Årsmöte", href: "/medlem/arsmote", icon: Users, permission: "annual:view" },
      { label: "Medlemsregister", href: "/medlem/register", icon: Building2, permission: "member:view_registry" },
    ],
  },
  {
    title: "Boende",
    items: [
      { label: "Felanmälan", href: "/boende/skadeanmalan", icon: AlertTriangle, permission: "report:submit" },
      { label: "Förslag", href: "/boende/forslag", icon: Lightbulb, permission: "suggestion:submit" },
    ],
  },
  {
    title: "Information",
    items: [
      { label: "Anslagstavla", href: "/info", icon: Megaphone, permission: "announcement:view" },
    ],
  },
  {
    title: "Administration",
    items: [
      { label: "Inställningar", href: "/installningar", icon: Settings, permission: "admin:integrations" },
    ],
  },
];
