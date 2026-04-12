"use client";

import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Mail, Inbox, Send, Archive, Paperclip, ExternalLink,
  AlertTriangle, Shield, Link2, ChevronRight, X, Plus,
  Building2, Wrench, Receipt, ArrowRightLeft, FileText,
  User, Clock, Tag, CornerUpLeft, MoreHorizontal,
  PenSquare, Edit3, Trash2, FolderArchive, Calendar, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { hasPermission, isBoardMember } from "@/lib/permissions";
import type { Role } from "@prisma/client";

// ============================================================
// Tagg-baserad datamodell
// ============================================================
//
// Varje meddelande har 0–N taggar. Taggar ersätter mappar/flikar.
//
// Systemtaggar (sätts automatiskt):
//   inkommen    — inkommande meddelande
//   skickat     — skickat meddelande
//   utkast      — ej skickat, under redigering
//   flaggat     — BRF-specifik bedrägerivarning
//   oläst       — ej öppnat
//
// Ärendetaggar (sätts vid koppling):
//   ÖVL-2026-007, Felanmälan #142, etc.
//
// Verksamhetsårstaggar:
//   2026, 2025, 2024...
//
// Manuella taggar (sätts av användaren):
//   väntar svar, akut, revisor, etc.

type MockMailbox = {
  id: string;
  name: string;
  slug: string;
  emailAddress: string;
};

type MockMessage = {
  id: string;
  mailboxSlug: string;
  direction: "inbound" | "outbound";
  fromAddress: string;
  fromName: string;
  toAddresses: string;
  subject: string;
  bodyPreview: string;
  bodyText: string;
  receivedAt: Date;
  threadId: string;
  tags: string[];
  entityType?: string;
  entityId?: string;
  entityTitle?: string;
  attachments: { name: string; size: number }[];
  flags: MockFlag[];
  senderMatch?: {
    type: "exact" | "fuzzy" | "external" | "unknown";
    name?: string;
    apartment?: string;
    role?: string;
  };
  draftSource?: string;
};

type MockFlag = {
  level: "critical" | "warning" | "info";
  message: string;
};

// Systemtaggar — fasta, visas med ikon och färg
const SYSTEM_TAGS: Record<string, { label: string; color: string; icon?: typeof Tag }> = {
  "inkommen":     { label: "Inkommen",     color: "bg-blue-100 text-blue-700" },
  "skickat":      { label: "Skickat",      color: "bg-gray-100 text-gray-600", icon: Send },
  "utkast":       { label: "Utkast",       color: "bg-amber-100 text-amber-700", icon: Edit3 },
  "flaggat":      { label: "Flaggat",      color: "bg-red-100 text-red-700", icon: AlertTriangle },
  "oläst":        { label: "Oläst",        color: "bg-blue-50 text-blue-600" },
  "väntar svar":  { label: "Väntar svar",  color: "bg-purple-100 text-purple-700", icon: Clock },
};

const MOCK_MAILBOXES: MockMailbox[] = [
  { id: "mb1", name: "Styrelsen", slug: "styrelsen", emailAddress: "styrelsen@brfexempel.se" },
  { id: "mb2", name: "Förvaltning", slug: "forvaltning", emailAddress: "forvaltning@brfexempel.se" },
  { id: "mb3", name: "Ekonomi", slug: "ekonomi", emailAddress: "ekonomi@brfexempel.se" },
];

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000);

const MOCK_MESSAGES: MockMessage[] = [
  // === Styrelsen — innevarande år ===
  {
    id: "m1", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "anna.bergman@maklarfirman.se", fromName: "Anna Bergman",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Överlåtelse — Storgatan 1A lgh 1008",
    bodyPreview: "Jag företräder säljaren Maria Svensson avseende försäljning av bostadsrätt lgh 1008...",
    bodyText: "Hej,\n\nJag företräder säljaren Maria Svensson avseende försäljning av bostadsrätt lgh 1008. Köpare är Johan och Lisa Andersson.\n\nTillträde planeras 2026-06-01. Köpesumma 2 850 000 kr.\n\nBifogar:\n- Överlåtelseavtal (signerat)\n- Medlemsansökan köpare\n- Lånelöfte Handelsbanken\n\nVänligen bekräfta mottagande och meddela överlåtelseavgift.\n\nMed vänlig hälsning,\nAnna Bergman, Fastighetsmäklare\nMäklarfirman AB",
    receivedAt: hoursAgo(2), threadId: "t1",
    tags: ["inkommen", "oläst", "2026", "ÖVL-2026-007"],
    attachments: [
      { name: "overlatelseavtal_lgh1008.pdf", size: 245000 },
      { name: "medlemsansokan_andersson.pdf", size: 128000 },
      { name: "lanelofte_handelsbanken.pdf", size: 89000 },
    ],
    flags: [],
    senderMatch: { type: "external", name: "Anna Bergman", role: "Mäklare — Mäklarfirman AB" },
  },
  {
    id: "m2", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "maria.svensson72@gmail.com", fromName: "Maria Svensson",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Motion till årsstämman — laddstolpar i garaget",
    bodyPreview: "Hej styrelsen, jag vill lämna in en motion till kommande årsstämma...",
    bodyText: "Hej styrelsen,\n\nJag vill lämna in en motion till kommande årsstämma.\n\nBakgrund:\nAllt fler i föreningen har elbil eller planerar att skaffa. Idag finns inga laddmöjligheter i garaget.\n\nYrkande:\nJag yrkar att styrelsen utreder möjligheten att installera laddstolpar i föreningens garage och presenterar en plan med kostnadsuppskattning till nästa ordinarie stämma.\n\nMed vänlig hälsning,\nMaria Svensson, lgh 1008",
    receivedAt: hoursAgo(5), threadId: "t2",
    tags: ["inkommen", "oläst", "2026"],
    attachments: [],
    flags: [
      { level: "warning", message: "E-postadressen finns inte i medlemsregistret. Möjlig match: Maria Svensson, lgh 1008." },
    ],
    senderMatch: { type: "fuzzy", name: "Maria Svensson", apartment: "lgh 1008" },
  },
  {
    id: "m3", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "anna.pettersson@gmail.com", fromName: "Anna Pettersson",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Pappa Karl Pettersson har gått bort",
    bodyPreview: "Hej, jag vill meddela att min far Karl Pettersson i lgh 3001 avled den 1 mars...",
    bodyText: "Hej,\n\njag vill meddela att min far Karl Pettersson i lgh 3001 avled den 1 mars. Vi håller på med bouppteckning och återkommer om lägenheten.\n\nDet står en del post i hans brevlåda.\n\nMed vänliga hälsningar,\nAnna Pettersson",
    receivedAt: daysAgo(3), threadId: "t3",
    tags: ["inkommen", "2026", "dödsfall", "lgh 3001"],
    attachments: [],
    flags: [
      { level: "info", message: "Möjligt dödsfall. Karl Pettersson, lgh 3001, medlem sedan 2005." },
      { level: "info", message: "Ärendetyp: Omhändertagande — inte överlåtelse. Ägarskifte skapas separat när dödsboet är redo." },
    ],
    senderMatch: { type: "unknown", name: "Anna Pettersson" },
  },
  {
    id: "m4", mailboxSlug: "styrelsen", direction: "outbound",
    fromAddress: "styrelsen@brfexempel.se", fromName: "Styrelsen, BRF Exempelgården",
    toAddresses: "anna.pettersson@gmail.com",
    subject: "Re: Pappa Karl Pettersson har gått bort",
    bodyPreview: "Hej Anna, vi beklagar sorgen efter Karl...",
    bodyText: "Hej Anna,\n\nVi beklagar sorgen efter Karl. Vi har noterat informationen.\n\nVad gäller lägenheten:\n- Månadsavgiften fortsätter att gälla tills vidare\n- Ni behöver inte skynda — ta den tid ni behöver\n- När bouppteckningen är klar och ni vet hur ni vill\n  göra med lägenheten, hör av er till oss så hjälper\n  vi till med det praktiska\n- Vi kan hjälpa till att vidarebefordra post om ni önskar\n\nOm Karl hade nycklar till gemensamma utrymmen, kontakta\noss så löser vi det.\n\nVi finns här om det är något.\n\nMed varma hälsningar,\nStyrelsen, BRF Exempelgården",
    receivedAt: daysAgo(2), threadId: "t3",
    tags: ["skickat", "2026", "dödsfall", "lgh 3001"],
    entityType: "Task", entityId: "task-001", entityTitle: "Omhändertagande — Karl Pettersson, lgh 3001",
    attachments: [],
    flags: [],
  },

  // === Förvaltning ===
  {
    id: "m5", mailboxSlug: "forvaltning", direction: "inbound",
    fromAddress: "erik.lindqvist@hotmail.com", fromName: "Erik Lindqvist",
    toAddresses: "forvaltning@brfexempel.se",
    subject: "Läcker från taket i källaren",
    bodyPreview: "Hej, det droppar vatten från taket i källargång B, precis utanför förråd 12...",
    bodyText: "Hej, det droppar vatten från taket i källargång B, precis utanför förråd 12. Har droppat sedan igår kväll.\n\nMvh Erik i lgh 2003",
    receivedAt: hoursAgo(1), threadId: "t5",
    tags: ["inkommen", "oläst", "2026"],
    attachments: [],
    flags: [
      { level: "warning", message: "E-postadressen finns inte i registret. Möjlig match: Erik Lindqvist, lgh 2003." },
      { level: "info", message: "2 tidigare fuktärenden i källargång B (senaste 12 mån)." },
    ],
    senderMatch: { type: "fuzzy", name: "Erik Lindqvist", apartment: "lgh 2003" },
  },

  // === Ekonomi ===
  {
    id: "m6", mailboxSlug: "ekonomi", direction: "inbound",
    fromAddress: "faktura@anderssonvvs.se", fromName: "Andersson VVS AB",
    toAddresses: "ekonomi@brfexempel.se",
    subject: "Faktura 2026-0142 — BRF Exempelgården",
    bodyPreview: "Bifogad faktura avser reparation av vattenläcka i källargång B...",
    bodyText: "Bifogad faktura avser reparation av vattenläcka i källargång B enligt överenskommelse.\n\nBelopp: 18 750 kr inkl. moms.\nFörfallodag: 2026-05-10.\nBankgiro: 123-4567.",
    receivedAt: hoursAgo(4), threadId: "t6",
    tags: ["inkommen", "oläst", "2026", "Felanmälan #142"],
    entityType: "DamageReport", entityId: "dmg-142", entityTitle: "Felanmälan #142 — Vattenläcka källare B",
    attachments: [{ name: "faktura_2026_0142.pdf", size: 89000 }],
    flags: [],
    senderMatch: { type: "exact", name: "Andersson VVS AB", role: "Leverantör — VVS" },
  },
  {
    id: "m7", mailboxSlug: "ekonomi", direction: "inbound",
    fromAddress: "faktura@brandskyddsnorden.se", fromName: "Brandskyddsnorden",
    toAddresses: "ekonomi@brfexempel.se",
    subject: "Faktura — brandskyddskontroll BRF Exempelgården",
    bodyPreview: "Enligt avtal bifogas faktura för utförd brandskyddskontroll...",
    bodyText: "Enligt avtal bifogas faktura för utförd brandskyddskontroll av gemensamma utrymmen.\n\nBelopp: 4 950 kr inkl. moms\nFörfaller: 2026-05-01\nBankgiro: 987-6543",
    receivedAt: daysAgo(1), threadId: "t7",
    tags: ["inkommen", "flaggat", "2026"],
    attachments: [{ name: "faktura_23891.pdf", size: 67000 }],
    flags: [
      { level: "critical", message: "Okänd leverantör — \"Brandskyddsnorden\" finns inte i systemet." },
      { level: "warning", message: "Ingen beställning eller ärende matchar \"brandskyddskontroll\"." },
      { level: "warning", message: "Mönster matchar katalogfaktura/bedrägeririsk." },
    ],
    senderMatch: { type: "unknown" },
  },

  // === Flaggade — BRF-specifika bluffar som passerat e-postleverantörens filter ===
  {
    id: "m11", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "info@foreningsregistret-sverige.se", fromName: "Föreningsregistret Sverige",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Förnyelse av registrering — BRF Exempelgården",
    bodyPreview: "Er registrering löper ut. Förnya idag för att behålla er synlighet...",
    bodyText: "BRF Exempelgården\nOrg.nr: 769000-XXXX\n\nEr registrering i Föreningsregistret Sverige löper ut 2026-05-01.\n\nFörnya er registrering idag för att säkerställa att er förening\nfortsatt syns i vårt register.\n\nÅrsavgift: 2 990 kr\nBankgiro: 456-7890\nOCR: 7690001234\n\nVid utebliven betalning avregistreras er förening.\n\nMed vänlig hälsning,\nFöreningsregistret Sverige AB\nBox 12345, 111 11 Stockholm",
    receivedAt: daysAgo(2), threadId: "t11",
    tags: ["inkommen", "flaggat", "2026"],
    attachments: [],
    flags: [
      { level: "critical", message: "Känt BRF-riktat bedrägeri — \"Föreningsregistret\" är inte en myndighet. Bolagsverket sköter föreningsregister." },
      { level: "info", message: "E-postleverantörens spamfilter släppte igenom detta — mailet har giltig SPF/DKIM." },
    ],
    senderMatch: { type: "unknown" },
  },
  {
    id: "m13", mailboxSlug: "ekonomi", direction: "inbound",
    fromAddress: "avtal@hissservice-sverige.se", fromName: "Hissservice Sverige",
    toAddresses: "ekonomi@brfexempel.se",
    subject: "Förfallet serviceavtal — hissanläggning BRF Exempelgården",
    bodyPreview: "Ert serviceavtal för hissanläggningen har löpt ut. Förnya omgående...",
    bodyText: "BRF Exempelgården\n\nVi noterar att ert serviceavtal för hissanläggningen har löpt ut.\nEnligt Boverkets föreskrifter krävs regelbunden service.\n\nFörnya ert avtal idag:\nÅrsavgift: 14 900 kr/hiss\nAntal hissar: 3 st\nTotalt: 44 700 kr\n\nBankgiro: 234-5678\n\nVid utebliven service riskerar föreningen att förlora\nbesiktningsgodkännande.\n\nHissservice Sverige AB",
    receivedAt: daysAgo(3), threadId: "t13",
    tags: ["inkommen", "flaggat", "2026"],
    attachments: [{ name: "serviceavtal_2026.pdf", size: 156000 }],
    flags: [
      { level: "critical", message: "Falskt serviceavtal — er hisservice sköts av KONE AB (registrerad i Hemmet). Denna avsändare är okänd." },
      { level: "warning", message: "Högt belopp (44 700 kr) + hot om förlorat godkännande — klassisk BRF-bluff." },
    ],
    senderMatch: { type: "unknown" },
  },

  // === Utkast — skapade från andra funktioner ===
  {
    id: "m8", mailboxSlug: "styrelsen", direction: "outbound",
    fromAddress: "styrelsen@brfexempel.se", fromName: "Styrelsen, BRF Exempelgården",
    toAddresses: "anna.bergman@maklarfirman.se",
    subject: "Re: Överlåtelse — Storgatan 1A lgh 1008",
    bodyPreview: "Tack, vi har mottagit underlagen för överlåtelse av lgh 1008...",
    bodyText: "Hej Anna,\n\nTack, vi har mottagit underlagen för överlåtelse av lgh 1008.\nÄrendenummer: ÖVL-2026-007.\n\nÖverlåtelseavgift: 1 495 kr (betalas av säljaren).\nPantsättningsavgift: 630 kr (vid ny pant).\n\nVi återkommer med besked om medlemskap efter styrelsens\nprövning. Handläggningstid normalt 2–4 veckor.\n\nMed vänliga hälsningar,\nStyrelsen, BRF Exempelgården",
    receivedAt: hoursAgo(1), threadId: "t1",
    tags: ["utkast", "2026", "ÖVL-2026-007"],
    entityType: "TransferCase", entityId: "ovl-007", entityTitle: "Överlåtelse lgh 1008 — Svensson → Andersson",
    attachments: [],
    flags: [],
    draftSource: "Överlåtelser → ÖVL-2026-007",
  },
  {
    id: "m10", mailboxSlug: "forvaltning", direction: "outbound",
    fromAddress: "forvaltning@brfexempel.se", fromName: "Förvaltning, BRF Exempelgården",
    toAddresses: "erik.lindqvist@hotmail.com",
    subject: "Re: Läcker från taket i källaren",
    bodyPreview: "Hej Erik, tack för din felanmälan. Vi har registrerat ärendet...",
    bodyText: "Hej Erik,\n\nTack för din felanmälan om vattenläcka i källargång B.\nVi har registrerat ärendet (referens: #142).\n\nVi har kontaktat VVS-jour och en tekniker kommer ut\nimorgon mellan 08:00–10:00.\n\nDu kan följa ärendet i Hemmet:\nhttps://hemmet.brfexempel.se/boende/skadeanmalan/142\n\nMed vänliga hälsningar,\nFörvaltning, BRF Exempelgården",
    receivedAt: hoursAgo(0.5), threadId: "t5",
    tags: ["utkast", "2026", "Felanmälan #142"],
    entityType: "DamageReport", entityId: "dmg-142", entityTitle: "Felanmälan #142 — Vattenläcka källare B",
    attachments: [],
    flags: [],
    draftSource: "Felanmälan → #142",
  },

  // === Arkiv — verksamhetsår 2025 ===
  {
    id: "a1", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "maria.ek@maklarhuset.se", fromName: "Maria Ek",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Överlåtelse — lgh 2014, köpare Svensson-Ek",
    bodyPreview: "Bifogar underlag för överlåtelse...",
    bodyText: "Hej,\n\nBifogar underlag för överlåtelse av lgh 2014.\nKöpare: Per och Maria Svensson-Ek.\nTillträde: 2025-09-01.\n\nMed vänlig hälsning,\nMaria Ek, Mäklarhuset",
    receivedAt: new Date("2025-08-15"), threadId: "a-t1",
    tags: ["inkommen", "2025", "ÖVL-2025-003"],
    entityType: "TransferCase", entityId: "ovl-2025-003", entityTitle: "Överlåtelse lgh 2014 (2025)",
    attachments: [{ name: "overlatelseavtal_lgh2014.pdf", size: 220000 }],
    flags: [],
    senderMatch: { type: "external", name: "Maria Ek", role: "Mäklare — Mäklarhuset" },
  },
  {
    id: "a2", mailboxSlug: "styrelsen", direction: "outbound",
    fromAddress: "styrelsen@brfexempel.se", fromName: "Styrelsen, BRF Exempelgården",
    toAddresses: "maria.ek@maklarhuset.se",
    subject: "Re: Överlåtelse — lgh 2014, köpare Svensson-Ek",
    bodyPreview: "Tack, vi har mottagit underlagen...",
    bodyText: "Hej Maria,\n\nTack, vi har mottagit underlagen.\nÖverlåtelseavgift: 1 470 kr.\n\nMed vänliga hälsningar,\nStyrelsen, BRF Exempelgården",
    receivedAt: new Date("2025-08-16"), threadId: "a-t1",
    tags: ["skickat", "2025", "ÖVL-2025-003"],
    entityType: "TransferCase", entityId: "ovl-2025-003", entityTitle: "Överlåtelse lgh 2014 (2025)",
    attachments: [],
    flags: [],
  },
  {
    id: "a3", mailboxSlug: "ekonomi", direction: "inbound",
    fromAddress: "karin.lindberg@revisionsfirman.se", fromName: "Karin Lindberg",
    toAddresses: "ekonomi@brfexempel.se",
    subject: "Revisionsberättelse BRF Exempelgården 2024",
    bodyPreview: "Bifogar revisionsberättelse för räkenskapsåret 2024...",
    bodyText: "Hej,\n\nBifogar revisionsberättelse för räkenskapsåret 2024.\nJag tillstyrker att stämman fastställer balansräkningen.\n\nMed vänlig hälsning,\nKarin Lindberg, Auktoriserad revisor",
    receivedAt: new Date("2025-04-10"), threadId: "a-t2",
    tags: ["inkommen", "2025", "Revision 2024"],
    entityType: "AnnualReport", entityId: "ar-2024", entityTitle: "Årsredovisning 2024",
    attachments: [{ name: "revisionsberattelse_2024.pdf", size: 340000 }],
    flags: [],
    senderMatch: { type: "external", name: "Karin Lindberg", role: "Revisor — Revisionsfirman AB" },
  },
  {
    id: "a4", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "lars.berg@gmail.com", fromName: "Lars Berg",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Motion — cykelrum i källaren",
    bodyPreview: "Jag yrkar att föreningen inreder ett cykelrum...",
    bodyText: "Hej styrelsen,\n\nJag yrkar att föreningen inreder ett cykelrum i källare A.\nDet finns idag ingen ordentlig plats att förvara cyklar.\n\nMvh Lars Berg, lgh 1004",
    receivedAt: new Date("2025-02-20"), threadId: "a-t4",
    tags: ["inkommen", "2025", "Motion cykelrum"],
    entityType: "Motion", entityId: "mot-2025-002", entityTitle: "Motion: Cykelrum i källaren (bifall 2025)",
    attachments: [],
    flags: [],
    senderMatch: { type: "exact", name: "Lars Berg", apartment: "lgh 1004" },
  },
];

// Verksamhetsår
const FISCAL_YEARS = ["2026", "2025", "2024"];
const CURRENT_YEAR = "2026";

// ============================================================
// Utility
// ============================================================

const flagIcons = { critical: AlertTriangle, warning: Shield, info: Tag };
const flagColors = {
  critical: "text-red-600 bg-red-50 border-red-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  info: "text-blue-600 bg-blue-50 border-blue-200",
};

const senderMatchColors = {
  exact: "text-green-700 bg-green-50",
  fuzzy: "text-amber-700 bg-amber-50",
  external: "text-blue-700 bg-blue-50",
  unknown: "text-gray-600 bg-gray-100",
};
const senderMatchLabels = {
  exact: "Verifierad", fuzzy: "Möjlig match", external: "Extern part", unknown: "Okänd avsändare",
};

const caseTypeOptions = [
  { value: "DamageReport", label: "Felanmälan", icon: Wrench },
  { value: "TransferCase", label: "Överlåtelse", icon: ArrowRightLeft },
  { value: "Motion", label: "Motion", icon: FileText },
  { value: "Expense", label: "Utgift/Faktura", icon: Receipt },
  { value: "Task", label: "Uppgift", icon: FileText },
  { value: "Suggestion", label: "Förslag", icon: FileText },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TagBadge({ tag, active, onClick }: { tag: string; active?: boolean; onClick?: () => void }) {
  const sys = SYSTEM_TAGS[tag];
  const Icon = sys?.icon;
  const color = active
    ? "bg-blue-600 text-white border-blue-600"
    : sys
      ? `${sys.color} border-transparent`
      : "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
        onClick && "cursor-pointer hover:opacity-80",
        color
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {sys?.label ?? tag}
    </button>
  );
}

// ============================================================
// Main component
// ============================================================

export default function EmailPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];

  const [activeMailbox, setActiveMailbox] = useState("styrelsen");
  const [activeFiscalYear, setActiveFiscalYear] = useState(CURRENT_YEAR);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showCompose, setShowCompose] = useState(false);

  if (!isBoardMember(userRoles)) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <Mail className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Ingen åtkomst</h2>
        <p className="mt-1 text-sm text-gray-500">E-post är tillgängligt för styrelsemedlemmar.</p>
      </div>
    );
  }

  const isCurrentYear = activeFiscalYear === CURRENT_YEAR;

  // Filter: mailbox + fiscal year
  const yearMessages = MOCK_MESSAGES.filter(
    (m) => m.mailboxSlug === activeMailbox && m.tags.includes(activeFiscalYear)
  );

  // All unique tags in this mailbox+year (excluding year tag itself)
  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const m of yearMessages) {
      for (const t of m.tags) {
        if (FISCAL_YEARS.includes(t)) continue; // skip year tags
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }
    return tagCounts;
  }, [yearMessages]);

  // Apply tag filter + search
  const filteredMessages = yearMessages.filter((m) => {
    if (activeTagFilter && !m.tags.includes(activeTagFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.subject.toLowerCase().includes(q)
        || m.fromName.toLowerCase().includes(q)
        || m.toAddresses.toLowerCase().includes(q)
        || m.bodyPreview.toLowerCase().includes(q);
    }
    return true;
  });

  const selected = selectedId ? MOCK_MESSAGES.find((m) => m.id === selectedId) : null;

  // Tag ordering: system tags first, then entity/custom tags
  const systemTagOrder = ["inkommen", "skickat", "utkast", "oläst", "flaggat", "väntar svar"];
  const sortedTags = [...availableTags.entries()].sort(([a], [b]) => {
    const ai = systemTagOrder.indexOf(a);
    const bi = systemTagOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, "sv");
  });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-600" /> E-post
          </h1>
          <p className="mt-1 text-sm text-gray-500">Föreningens rollbaserade e-postinkorgar</p>
        </div>
        {isCurrentYear && (
          <button
            onClick={() => { setShowCompose(true); setSelectedId(null); }}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            <PenSquare className="h-4 w-4" /> Skriv nytt
          </button>
        )}
      </div>

      {/* Mailbox tabs + fiscal year */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          {MOCK_MAILBOXES.map((mb) => {
            const count = MOCK_MESSAGES.filter(
              (m) => m.mailboxSlug === mb.slug && m.tags.includes(activeFiscalYear) && m.tags.includes("oläst")
            ).length;
            return (
              <button
                key={mb.slug}
                onClick={() => { setActiveMailbox(mb.slug); setSelectedId(null); setActiveTagFilter(null); }}
                className={cn(
                  "relative rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  activeMailbox === mb.slug
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                {mb.name}
                {count > 0 && (
                  <span className={cn(
                    "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                    activeMailbox === mb.slug ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                  )}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Fiscal year */}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <div className="flex gap-1">
            {FISCAL_YEARS.map((fy) => (
              <button
                key={fy}
                onClick={() => { setActiveFiscalYear(fy); setSelectedId(null); setActiveTagFilter(null); }}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  activeFiscalYear === fy
                    ? fy === CURRENT_YEAR ? "bg-blue-600 text-white" : "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {fy !== CURRENT_YEAR && <FolderArchive className="inline h-3 w-3 mr-0.5" />}
                {fy}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tag filter bar + search */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTagFilter(null)}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
            !activeTagFilter
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
          )}
        >
          Alla ({yearMessages.length})
        </button>
        {sortedTags.map(([tag, count]) => (
          <TagBadge
            key={tag}
            tag={tag}
            active={activeTagFilter === tag}
            onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
          />
        ))}
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök..."
            className="w-48 rounded-md border border-gray-200 bg-white py-1 pl-8 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Archive banner */}
      {!isCurrentYear && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
          <FolderArchive className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            Arkiv — verksamhetsår <span className="font-semibold">{activeFiscalYear}</span>
          </span>
          <span className="text-xs text-gray-400">Korrespondens arkiverad vid årsavslut.</span>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Message list */}
        <div className={cn(
          "rounded-lg border border-gray-200 bg-white overflow-hidden",
          selected ? "w-2/5 shrink-0" : "w-full"
        )}>
          <div className="border-b border-gray-100 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {filteredMessages.length} meddelanden
              {activeTagFilter && <span className="ml-1 text-gray-400">— filtrerat på &quot;{SYSTEM_TAGS[activeTagFilter]?.label ?? activeTagFilter}&quot;</span>}
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {filteredMessages.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  {searchQuery ? "Inga träffar" : activeTagFilter ? "Inga meddelanden med denna tagg" : "Inga meddelanden"}
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                    selectedId === msg.id && "bg-blue-50",
                    msg.tags.includes("oläst") && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {msg.tags.includes("oläst") && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                        {msg.tags.includes("utkast") && (
                          <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">Utkast</span>
                        )}
                        {msg.tags.includes("flaggat") && (
                          <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">Flaggat</span>
                        )}
                        {msg.direction === "outbound" && !msg.tags.includes("utkast") && (
                          <Send className="h-3 w-3 shrink-0 text-gray-400" />
                        )}
                        <span className={cn(
                          "text-sm truncate",
                          msg.tags.includes("oläst") ? "font-semibold text-gray-900" : "text-gray-700"
                        )}>
                          {msg.direction === "outbound" ? `Till: ${msg.toAddresses}` : msg.fromName}
                        </span>
                      </div>
                      <p className={cn(
                        "mt-0.5 text-sm truncate",
                        msg.tags.includes("oläst") ? "font-medium text-gray-800" : "text-gray-600"
                      )}>
                        {msg.subject}
                      </p>
                      {msg.draftSource ? (
                        <p className="mt-0.5 text-xs text-amber-600 truncate">Från: {msg.draftSource}</p>
                      ) : (
                        <p className="mt-0.5 text-xs text-gray-400 truncate">{msg.bodyPreview}</p>
                      )}
                      {/* Inline tags */}
                      {msg.tags.filter((t) => !FISCAL_YEARS.includes(t) && !["inkommen", "oläst"].includes(t)).length > 0 && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {msg.tags
                            .filter((t) => !FISCAL_YEARS.includes(t) && !["inkommen", "oläst"].includes(t))
                            .map((t) => <TagBadge key={t} tag={t} />)}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-400">
                        {isCurrentYear
                          ? formatDistanceToNow(msg.receivedAt, { locale: sv, addSuffix: true })
                          : format(msg.receivedAt, "d MMM", { locale: sv })}
                      </span>
                      <div className="flex items-center gap-1">
                        {msg.attachments.length > 0 && <Paperclip className="h-3 w-3 text-gray-400" />}
                        {msg.flags.some((f) => f.level === "critical") && <AlertTriangle className="h-3 w-3 text-red-500" />}
                        {msg.entityType && <Link2 className="h-3 w-3 text-green-500" />}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail view */}
        {selected && (
          <div className="flex-1 rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
            {/* Detail header */}
            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 truncate">{selected.subject}</h2>
              <button onClick={() => setSelectedId(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* From/To + tags */}
              <div className="px-5 py-3 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {selected.direction === "outbound" ? "Till" : "Från"}: {selected.direction === "outbound" ? selected.toAddresses : selected.fromName}
                      </span>
                      {selected.senderMatch && (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", senderMatchColors[selected.senderMatch.type])}>
                          {senderMatchLabels[selected.senderMatch.type]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{selected.fromAddress}</p>
                    {selected.senderMatch?.name && selected.senderMatch.type !== "unknown" && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {selected.senderMatch.name}
                        {selected.senderMatch.apartment && ` — ${selected.senderMatch.apartment}`}
                        {selected.senderMatch.role && ` — ${selected.senderMatch.role}`}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {format(selected.receivedAt, "d MMM yyyy HH:mm", { locale: sv })}
                  </span>
                </div>
                {/* Tags on detail */}
                <div className="mt-2 flex gap-1 flex-wrap items-center">
                  {selected.tags.filter((t) => !FISCAL_YEARS.includes(t)).map((t) => (
                    <TagBadge key={t} tag={t} />
                  ))}
                  {isCurrentYear && (
                    <button className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500">
                      <Plus className="h-3 w-3" /> Tagg
                    </button>
                  )}
                </div>
              </div>

              {/* Flags */}
              {selected.flags.length > 0 && (
                <div className="px-5 py-3 space-y-2 border-b border-gray-50">
                  {selected.flags.map((flag, i) => {
                    const Icon = flagIcons[flag.level];
                    return (
                      <div key={i} className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-sm", flagColors[flag.level])}>
                        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{flag.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Linked entity */}
              {selected.entityType && (
                <div className="px-5 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
                    <Link2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">
                      Kopplad till: {selected.entityTitle ?? `${selected.entityType} ${selected.entityId}`}
                    </span>
                    <ChevronRight className="h-3 w-3 text-green-400 ml-auto" />
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selected.attachments.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-50">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Bilagor ({selected.attachments.length})</p>
                  <div className="space-y-1">
                    {selected.attachments.map((att, i) => (
                      <div key={i} className="flex items-center gap-2 rounded bg-gray-50 px-3 py-1.5">
                        <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-blue-600">{att.name}</span>
                        <span className="text-xs text-gray-400">{formatFileSize(att.size)}</span>
                        <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="px-5 py-4">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                  {selected.bodyText}
                </pre>
              </div>
            </div>

            {/* Actions footer — only for current year */}
            {isCurrentYear && (
              <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
                {selected.tags.includes("utkast") && (
                  <>
                    <button onClick={() => setShowCompose(true)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                      <Edit3 className="h-3.5 w-3.5" /> Redigera och skicka
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      <Trash2 className="h-3.5 w-3.5" /> Ta bort
                    </button>
                    {selected.draftSource && (
                      <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                        <Link2 className="h-3 w-3" /> {selected.draftSource}
                      </span>
                    )}
                  </>
                )}
                {selected.tags.includes("flaggat") && !selected.tags.includes("utkast") && (
                  <>
                    <button className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                      <Shield className="h-3.5 w-3.5" /> Blockera domän
                    </button>
                    <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      <Inbox className="h-3.5 w-3.5" /> Inte bluff
                    </button>
                    <button className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      <Trash2 className="h-3.5 w-3.5" /> Ta bort
                    </button>
                  </>
                )}
                {selected.tags.includes("inkommen") && !selected.tags.includes("flaggat") && (
                  <>
                    <button onClick={() => setShowCompose(true)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                      <CornerUpLeft className="h-3.5 w-3.5" /> Svara
                    </button>
                    {!selected.entityType && (
                      <>
                        <button onClick={() => setShowCreateCase(true)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100">
                          <Plus className="h-3.5 w-3.5" /> Skapa ärende
                        </button>
                        <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                          <Link2 className="h-3.5 w-3.5" /> Koppla till ärende
                        </button>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <AlertTriangle className="h-3.5 w-3.5" /> Flagga
                      </button>
                      <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                        <Archive className="h-3.5 w-3.5" /> Arkivera
                      </button>
                    </div>
                  </>
                )}
                {selected.tags.includes("skickat") && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Send className="h-3 w-3" /> Skickat {format(selected.receivedAt, "d MMM yyyy", { locale: sv })}
                  </span>
                )}
              </div>
            )}

            {/* Create case dialog */}
            {showCreateCase && selected.direction === "inbound" && (
              <CreateCaseDialog message={selected} onClose={() => setShowCreateCase(false)} />
            )}
          </div>
        )}
      </div>

      {/* Compose dialog */}
      {showCompose && (
        <ComposeDialog
          mailbox={MOCK_MAILBOXES.find((mb) => mb.slug === activeMailbox)!}
          replyTo={selected?.tags.includes("inkommen") ? selected : undefined}
          draft={selected?.tags.includes("utkast") ? selected : undefined}
          onClose={() => setShowCompose(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Create case dialog
// ============================================================

function CreateCaseDialog({ message, onClose }: { message: MockMessage; onClose: () => void }) {
  const [caseType, setCaseType] = useState("");
  const [title, setTitle] = useState(message.subject);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Skapa ärende från e-post</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="rounded-md bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">Från</p>
            <p className="text-sm text-gray-900">{message.fromName} &lt;{message.fromAddress}&gt;</p>
            {message.senderMatch && message.senderMatch.type !== "unknown" && (
              <div className="mt-1 flex items-center gap-1">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", senderMatchColors[message.senderMatch.type])}>
                  {senderMatchLabels[message.senderMatch.type]}
                </span>
                {message.senderMatch.name && (
                  <span className="text-xs text-gray-500">
                    {message.senderMatch.name}{message.senderMatch.apartment ? `, ${message.senderMatch.apartment}` : ""}
                  </span>
                )}
              </div>
            )}
            {message.senderMatch?.type === "unknown" && (
              <p className="mt-1 text-xs text-amber-600">Avsändaren kunde inte identifieras.</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Ärendetyp</label>
            <div className="grid grid-cols-3 gap-2">
              {caseTypeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button key={opt.value} onClick={() => setCaseType(opt.value)}
                    className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                      caseType === opt.value ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                    <Icon className="h-4 w-4" />{opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Titel</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
              Bifoga e-postinnehåll som beskrivning
            </label>
            {message.attachments.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                Spara e-postbilagor som ärendebilagor ({message.attachments.length} st)
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
              Skicka mottagningsbekräftelse till avsändaren
            </label>
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Avbryt</button>
          <button disabled={!caseType || !title}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            Skapa ärende
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Compose / Reply / Edit draft dialog
// ============================================================

function ComposeDialog({ mailbox, replyTo, draft, onClose }: {
  mailbox: MockMailbox; replyTo?: MockMessage; draft?: MockMessage; onClose: () => void;
}) {
  const isDraft = !!draft;
  const isReply = !!replyTo;
  const [to, setTo] = useState(draft?.toAddresses ?? replyTo?.fromAddress ?? "");
  const [subject, setSubject] = useState(draft?.subject ?? (replyTo ? `Re: ${replyTo.subject}` : ""));
  const [body, setBody] = useState(draft?.bodyText ?? "");

  const title = isDraft ? "Redigera utkast" : isReply ? `Svara: ${replyTo.fromName}` : "Nytt meddelande";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="w-full max-w-2xl rounded-t-lg sm:rounded-lg border border-gray-200 bg-white shadow-xl flex flex-col max-h-[85vh]">
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {isDraft && draft.draftSource && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">{draft.draftSource}</span>
            )}
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 w-12 shrink-0">Från</label>
            <div className="flex-1 rounded-md bg-gray-50 px-3 py-1.5 text-sm text-gray-600">{mailbox.emailAddress}</div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 w-12 shrink-0">Till</label>
            <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder="mottagare@example.com"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 w-12 shrink-0">Ämne</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ämnesrad"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          {(draft?.entityType || replyTo?.entityType) && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
              <Link2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-700">Kopplad till: {draft?.entityTitle ?? replyTo?.entityTitle ?? "Ärende"}</span>
            </div>
          )}
          <textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Skriv ditt meddelande..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-sans leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y" />
          {isReply && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-1">
                {format(replyTo.receivedAt, "d MMM yyyy HH:mm", { locale: sv })} — {replyTo.fromName}:
              </p>
              <pre className="whitespace-pre-wrap font-sans text-xs text-gray-500 leading-relaxed max-h-32 overflow-y-auto">{replyTo.bodyText}</pre>
            </div>
          )}
          <div>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Paperclip className="h-3.5 w-3.5" /> Bifoga fil
            </button>
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2 shrink-0">
          <button disabled={!to || !subject || !body}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> Skicka
          </button>
          <button disabled={!to || !subject}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <Edit3 className="h-3.5 w-3.5" /> Spara som utkast
          </button>
          <button onClick={onClose}
            className="ml-auto rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}
