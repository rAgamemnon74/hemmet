"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Mail, Inbox, Send, Archive, Paperclip, ExternalLink,
  AlertTriangle, Shield, Link2, ChevronRight, X, Plus,
  Building2, Wrench, Receipt, ArrowRightLeft, FileText,
  User, Clock, Tag, CornerUpLeft, MoreHorizontal,
  PenSquare, Edit3, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { hasPermission, isBoardMember } from "@/lib/permissions";
import type { Role } from "@prisma/client";

// ============================================================
// Mock data — ersätts med tRPC-queries i fas 1
// ============================================================

type MockMailbox = {
  id: string;
  name: string;
  slug: string;
  emailAddress: string;
  unreadCount: number;
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
  status: "UNREAD" | "READ" | "LINKED" | "ARCHIVED" | "DRAFT" | "FLAGGED";
  receivedAt: Date;
  threadId: string;
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
  /** Källa som skapade utkastet — visas som kontext */
  draftSource?: string;
};

type MockFlag = {
  level: "critical" | "warning" | "info";
  message: string;
};

const MOCK_MAILBOXES: MockMailbox[] = [
  { id: "mb1", name: "Styrelsen", slug: "styrelsen", emailAddress: "styrelsen@brfexempel.se", unreadCount: 3 },
  { id: "mb2", name: "Förvaltning", slug: "forvaltning", emailAddress: "forvaltning@brfexempel.se", unreadCount: 1 },
  { id: "mb3", name: "Ekonomi", slug: "ekonomi", emailAddress: "ekonomi@brfexempel.se", unreadCount: 2 },
];

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
const hoursAgo = (n: number) => new Date(now.getTime() - n * 3600000);

const MOCK_MESSAGES: MockMessage[] = [
  // Styrelsen
  {
    id: "m1", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "anna.bergman@maklarfirman.se", fromName: "Anna Bergman",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Överlåtelse — Storgatan 1A lgh 1008",
    bodyPreview: "Jag företräder säljaren Maria Svensson avseende försäljning av bostadsrätt lgh 1008...",
    bodyText: "Hej,\n\nJag företräder säljaren Maria Svensson avseende försäljning av bostadsrätt lgh 1008. Köpare är Johan och Lisa Andersson.\n\nTillträde planeras 2026-06-01. Köpesumma 2 850 000 kr.\n\nBifogar:\n- Överlåtelseavtal (signerat)\n- Medlemsansökan köpare\n- Lånelöfte Handelsbanken\n\nVänligen bekräfta mottagande och meddela överlåtelseavgift.\n\nMed vänlig hälsning,\nAnna Bergman, Fastighetsmäklare\nMäklarfirman AB",
    status: "UNREAD", receivedAt: hoursAgo(2), threadId: "t1",
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
    status: "UNREAD", receivedAt: hoursAgo(5), threadId: "t2",
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
    status: "READ", receivedAt: daysAgo(3), threadId: "t3",
    attachments: [],
    flags: [
      { level: "info", message: "Möjligt dödsfallsärende. Karl Pettersson, lgh 3001, medlem sedan 2005." },
    ],
    senderMatch: { type: "unknown", name: "Anna Pettersson" },
  },
  {
    id: "m4", mailboxSlug: "styrelsen", direction: "outbound",
    fromAddress: "styrelsen@brfexempel.se", fromName: "Styrelsen, BRF Exempelgården",
    toAddresses: "anna.pettersson@gmail.com",
    subject: "Re: Pappa Karl Pettersson har gått bort",
    bodyPreview: "Hej Anna, vi beklagar sorgen efter Karl...",
    bodyText: "Hej Anna,\n\nVi beklagar sorgen efter Karl. Vi har noterat informationen.\n\nVad gäller lägenheten:\n- Månadsavgiften fortsätter att gälla tills överlåtelse sker\n- Ni behöver inte skynda — ta den tid ni behöver\n- När bouppteckningen är klar återkommer ni till oss\n\nMed varma hälsningar,\nStyrelsen, BRF Exempelgården",
    status: "LINKED", receivedAt: daysAgo(2), threadId: "t3",
    entityType: "Task", entityId: "task-001", entityTitle: "Dödsfall Karl Pettersson — lgh 3001",
    attachments: [],
    flags: [],
  },

  // Förvaltning
  {
    id: "m5", mailboxSlug: "forvaltning", direction: "inbound",
    fromAddress: "erik.lindqvist@hotmail.com", fromName: "Erik Lindqvist",
    toAddresses: "forvaltning@brfexempel.se",
    subject: "Läcker från taket i källaren",
    bodyPreview: "Hej, det droppar vatten från taket i källargång B, precis utanför förråd 12...",
    bodyText: "Hej, det droppar vatten från taket i källargång B, precis utanför förråd 12. Har droppat sedan igår kväll.\n\nMvh Erik i lgh 2003",
    status: "UNREAD", receivedAt: hoursAgo(1), threadId: "t5",
    attachments: [],
    flags: [
      { level: "warning", message: "E-postadressen finns inte i registret. Möjlig match: Erik Lindqvist, lgh 2003." },
      { level: "info", message: "2 tidigare fuktärenden i källargång B (senaste 12 mån)." },
    ],
    senderMatch: { type: "fuzzy", name: "Erik Lindqvist", apartment: "lgh 2003" },
  },

  // Ekonomi
  {
    id: "m6", mailboxSlug: "ekonomi", direction: "inbound",
    fromAddress: "faktura@anderssonvvs.se", fromName: "Andersson VVS AB",
    toAddresses: "ekonomi@brfexempel.se",
    subject: "Faktura 2026-0142 — BRF Exempelgården",
    bodyPreview: "Bifogad faktura avser reparation av vattenläcka i källargång B...",
    bodyText: "Bifogad faktura avser reparation av vattenläcka i källargång B enligt överenskommelse.\n\nBelopp: 18 750 kr inkl. moms.\nFörfallodag: 2026-05-10.\nBankgiro: 123-4567.",
    status: "UNREAD", receivedAt: hoursAgo(4), threadId: "t6",
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
    status: "UNREAD", receivedAt: daysAgo(1), threadId: "t7",
    attachments: [{ name: "faktura_23891.pdf", size: 67000 }],
    flags: [
      { level: "critical", message: "Okänd leverantör — \"Brandskyddsnorden\" finns inte i systemet." },
      { level: "warning", message: "Ingen beställning eller ärende matchar \"brandskyddskontroll\"." },
      { level: "warning", message: "Mönster matchar katalogfaktura/bedrägeririsk." },
    ],
    senderMatch: { type: "unknown" },
  },

  // Flaggade — passerade e-postleverantörens spamfilter men
  // fångade av Hemmets BRF-specifika skyddslager.
  //
  // Vanlig spam (Viagra, nigeriabrev etc.) stoppas redan av
  // O365/Gmail/Resend via SPF/DKIM/DMARC + ML-filter.
  // Det som når hit ser legitimt ut — korrekt SPF, riktig domän,
  // snyggt formaterad PDF — men riktar sig specifikt mot BRF:er.
  {
    id: "m11", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "info@foreningsregistret-sverige.se", fromName: "Föreningsregistret Sverige",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Förnyelse av registrering — BRF Exempelgården",
    bodyPreview: "Er registrering löper ut. Förnya idag för att behålla er synlighet...",
    bodyText: "BRF Exempelgården\nOrg.nr: 769000-XXXX\n\nEr registrering i Föreningsregistret Sverige löper ut 2026-05-01.\n\nFörnya er registrering idag för att säkerställa att er förening\nfortsatt syns i vårt register.\n\nÅrsavgift: 2 990 kr\nBankgiro: 456-7890\nOCR: 7690001234\n\nVid utebliven betalning avregistreras er förening.\n\nMed vänlig hälsning,\nFöreningsregistret Sverige AB\nBox 12345, 111 11 Stockholm",
    status: "FLAGGED", receivedAt: daysAgo(2), threadId: "t11",
    attachments: [],
    flags: [
      { level: "critical", message: "Känt BRF-riktat bedrägeri — \"Föreningsregistret\" är inte en myndighet. Bolagsverket sköter föreningsregister." },
      { level: "info", message: "E-postleverantörens spamfilter släppte igenom detta — mailet har giltig SPF/DKIM." },
    ],
    senderMatch: { type: "unknown" },
  },
  {
    id: "m12", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "noreply@digitala-arsredovisningen.se", fromName: "Digitala Årsredovisningen",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "Obligatorisk digital inlämning årsredovisning 2025",
    bodyPreview: "Från och med 2025 ska alla bostadsrättsföreningar lämna in digitalt...",
    bodyText: "Till styrelsen för BRF Exempelgården,\n\nFrån och med 2025 ska alla bostadsrättsföreningar lämna in\nårsredovisningen digitalt. Vi erbjuder en komplett lösning.\n\nAnmäl er idag — ordinarie pris 4 900 kr.\nErbjudande t.o.m. 2026-04-30: 2 900 kr\n\nKlicka här för att komma igång: [länk]\n\nDigitala Årsredovisningen AB",
    status: "FLAGGED", receivedAt: daysAgo(4), threadId: "t12",
    attachments: [],
    flags: [
      { level: "critical", message: "Vilseledande — antyder lagkrav att använda just deras tjänst. Årsredovisning lämnas till Bolagsverket." },
      { level: "warning", message: "Tidspress-taktik: erbjudande som \"löper ut\" för att skynda på beslut." },
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
    status: "FLAGGED", receivedAt: daysAgo(3), threadId: "t13",
    attachments: [{ name: "serviceavtal_2026.pdf", size: 156000 }],
    flags: [
      { level: "critical", message: "Falskt serviceavtal — er hisservice sköts av KONE AB (registrerad i Hemmet). Denna avsändare är okänd." },
      { level: "warning", message: "Högt belopp (44 700 kr) + hot om förlorat godkännande — klassisk BRF-bluff." },
    ],
    senderMatch: { type: "unknown" },
  },
  {
    id: "m14", mailboxSlug: "forvaltning", direction: "inbound",
    fromAddress: "kontakt@energideklaration-nu.se", fromName: "Energideklaration Nu",
    toAddresses: "forvaltning@brfexempel.se",
    subject: "Er energideklaration löper ut — boka besiktning idag",
    bodyPreview: "Enligt lag ska alla flerbostadshus ha en giltig energideklaration...",
    bodyText: "Hej,\n\nEnligt lag (2006:985) ska alla flerbostadshus ha en giltig\nenergi­deklaration. Vår kontroll visar att BRF Exempelgårdens\ndeklaration snart löper ut.\n\nBoka en ny energideklaration idag:\nPris: 8 900 kr (ordinarie 12 500 kr)\nErbjudandet gäller t.o.m. fredag.\n\nRing 08-XXX XXX eller svara på detta mail.\n\nEnergi­deklaration Nu AB",
    status: "FLAGGED", receivedAt: daysAgo(5), threadId: "t14",
    attachments: [],
    flags: [
      { level: "warning", message: "Oombedd offert — ingen beställning gjord. Energideklaration är lagkrav men kan beställas fritt." },
      { level: "info", message: "Kontrollera giltighetsdatum via Boverkets register, inte via oombedda mail." },
    ],
    senderMatch: { type: "unknown" },
  },
  {
    id: "m15", mailboxSlug: "styrelsen", direction: "inbound",
    fromAddress: "gdpr-tjanst@dataskyddsgruppen.se", fromName: "Dataskyddsgruppen",
    toAddresses: "styrelsen@brfexempel.se",
    subject: "GDPR-granskning — skyldigheter för BRF Exempelgården",
    bodyPreview: "Som personuppgiftsansvarig har er förening skyldigheter enligt GDPR...",
    bodyText: "Till styrelsen,\n\nSom personuppgiftsansvarig har BRF Exempelgården skyldigheter\nenligt dataskyddsförordningen (GDPR). Brott mot GDPR kan\nmedföra sanktionsavgifter upp till 20 miljoner euro.\n\nVi erbjuder en komplett GDPR-genomgång:\n- Registerförteckning\n- Personuppgiftsbiträdesavtal\n- Informationstexter\n- Rutiner för dataintrång\n\nPris: 9 900 kr (engångsavgift)\n\nBoka idag — svara på detta mail.\n\nDataskyddsgruppen AB",
    status: "FLAGGED", receivedAt: daysAgo(6), threadId: "t15",
    attachments: [],
    flags: [
      { level: "warning", message: "Skrämseltaktik — hänvisar till miljonböter. GDPR gäller men detta är oombedd marknadsföring." },
      { level: "info", message: "GDPR-stöd finns inbyggt i Hemmet (åtkomstloggning, samtycke, gallring). Extern konsult sällan nödvändig." },
    ],
    senderMatch: { type: "unknown" },
  },

  // Utkast — skapade från andra funktioner i systemet
  {
    id: "m8", mailboxSlug: "styrelsen", direction: "outbound",
    fromAddress: "styrelsen@brfexempel.se", fromName: "Styrelsen, BRF Exempelgården",
    toAddresses: "anna.bergman@maklarfirman.se",
    subject: "Re: Överlåtelse — Storgatan 1A lgh 1008",
    bodyPreview: "Tack, vi har mottagit underlagen för överlåtelse av lgh 1008...",
    bodyText: "Hej Anna,\n\nTack, vi har mottagit underlagen för överlåtelse av lgh 1008.\nÄrendenummer: ÖVL-2026-007.\n\nÖverlåtelseavgift: 1 495 kr (betalas av säljaren).\nPantsättningsavgift: 630 kr (vid ny pant).\n\nVi återkommer med besked om medlemskap efter styrelsens\nprövning. Handläggningstid normalt 2–4 veckor.\n\nMed vänliga hälsningar,\nStyrelsen, BRF Exempelgården",
    status: "DRAFT", receivedAt: hoursAgo(1), threadId: "t1",
    entityType: "TransferCase", entityId: "ovl-007", entityTitle: "Överlåtelse lgh 1008 — Svensson → Andersson",
    attachments: [],
    flags: [],
    draftSource: "Överlåtelser → ÖVL-2026-007",
  },
  {
    id: "m9", mailboxSlug: "ekonomi", direction: "outbound",
    fromAddress: "ekonomi@brfexempel.se", fromName: "Kassören, BRF Exempelgården",
    toAddresses: "pant@handelsbanken.se",
    subject: "Pantsättningsbekräftelse — lgh 2003",
    bodyPreview: "BRF Exempelgården bekräftar notering av pant om 1 500 000 kr...",
    bodyText: "Brf Exempelgården bekräftar notering av pant om\n1 500 000 kr i bostadsrätt lgh 2003 för låntagare\nErik Lindqvist.\n\nPantsättningsavgift: 598 kr\nBankgiro för inbetalning: 123-4567\nReferens: PANT-2026-015\n\nMed vänliga hälsningar,\nKassören, BRF Exempelgården",
    status: "DRAFT", receivedAt: hoursAgo(3), threadId: "t9",
    entityType: "MortgageNotation", entityId: "pant-015", entityTitle: "Pantsättning lgh 2003 — Handelsbanken",
    attachments: [],
    flags: [],
    draftSource: "Pantsättning → PANT-2026-015",
  },
  {
    id: "m10", mailboxSlug: "forvaltning", direction: "outbound",
    fromAddress: "forvaltning@brfexempel.se", fromName: "Förvaltning, BRF Exempelgården",
    toAddresses: "erik.lindqvist@hotmail.com",
    subject: "Re: Läcker från taket i källaren",
    bodyPreview: "Hej Erik, tack för din felanmälan. Vi har registrerat ärendet...",
    bodyText: "Hej Erik,\n\nTack för din felanmälan om vattenläcka i källargång B.\nVi har registrerat ärendet (referens: #142).\n\nVi har kontaktat VVS-jour och en tekniker kommer ut\nimorgon mellan 08:00–10:00.\n\nDu kan följa ärendet i Hemmet:\nhttps://hemmet.brfexempel.se/boende/skadeanmalan/142\n\nMed vänliga hälsningar,\nFörvaltning, BRF Exempelgården",
    status: "DRAFT", receivedAt: hoursAgo(0.5), threadId: "t5",
    entityType: "DamageReport", entityId: "dmg-142", entityTitle: "Felanmälan #142 — Vattenläcka källare B",
    attachments: [],
    flags: [],
    draftSource: "Felanmälan → #142",
  },
];

// ============================================================
// Utility
// ============================================================

const flagIcons = {
  critical: AlertTriangle,
  warning: Shield,
  info: Tag,
};

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
  exact: "Verifierad",
  fuzzy: "Möjlig match",
  external: "Extern part",
  unknown: "Okänd avsändare",
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

// ============================================================
// Components
// ============================================================

export default function EmailPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as Role[];

  const [activeMailbox, setActiveMailbox] = useState("styrelsen");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  if (!isBoardMember(userRoles)) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <Mail className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-medium text-gray-900">Ingen åtkomst</h2>
        <p className="mt-1 text-sm text-gray-500">E-post är tillgängligt för styrelsemedlemmar.</p>
      </div>
    );
  }

  const [showFlagged, setShowFlagged] = useState(false);
  const mailboxDrafts = MOCK_MESSAGES.filter((m) => m.mailboxSlug === activeMailbox && m.status === "DRAFT");
  const mailboxFlagged = MOCK_MESSAGES.filter((m) => m.mailboxSlug === activeMailbox && m.status === "FLAGGED");
  const mailboxInbox = MOCK_MESSAGES.filter((m) => m.mailboxSlug === activeMailbox && m.status !== "DRAFT" && m.status !== "FLAGGED");
  const mailboxMessages = showFlagged ? mailboxFlagged : showDrafts ? mailboxDrafts : mailboxInbox;
  const selected = selectedId ? MOCK_MESSAGES.find((m) => m.id === selectedId) : null;

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
        <button
          onClick={() => { setShowCompose(true); setSelectedId(null); }}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          <PenSquare className="h-4 w-4" /> Skriv nytt
        </button>
      </div>

      {/* Mailbox tabs */}
      <div className="mb-4 flex gap-2">
        {MOCK_MAILBOXES.map((mb) => (
          <button
            key={mb.slug}
            onClick={() => { setActiveMailbox(mb.slug); setSelectedId(null); }}
            className={cn(
              "relative rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              activeMailbox === mb.slug
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            {mb.name}
            {mb.unreadCount > 0 && (
              <span className={cn(
                "ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                activeMailbox === mb.slug ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              )}>
                {mb.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Inbox / Drafts / Flagged toggle */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => { setShowDrafts(false); setShowFlagged(false); setSelectedId(null); }}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            !showDrafts && !showFlagged ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Inbox className="inline h-3.5 w-3.5 mr-1" />
          Inkorg
        </button>
        <button
          onClick={() => { setShowDrafts(true); setShowFlagged(false); setSelectedId(null); }}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            showDrafts ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Edit3 className="inline h-3.5 w-3.5 mr-1" />
          Utkast
          {mailboxDrafts.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700">
              {mailboxDrafts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setShowFlagged(true); setShowDrafts(false); setSelectedId(null); }}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            showFlagged ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
          Flaggat
          {mailboxFlagged.length > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-semibold text-red-700">
              {mailboxFlagged.length}
            </span>
          )}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 min-h-[600px]">
        {/* Message list */}
        <div className={cn(
          "rounded-lg border border-gray-200 bg-white overflow-hidden",
          selected ? "w-2/5 shrink-0" : "w-full"
        )}>
          <div className="border-b border-gray-100 px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {mailboxMessages.length} meddelanden
            </span>
            <div className="flex gap-1">
              <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <Archive className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {mailboxMessages.length === 0 ? (
              <div className="py-12 text-center">
                {showFlagged ? (
                  <>
                    <Shield className="mx-auto h-10 w-10 text-green-300" />
                    <p className="mt-2 text-sm text-green-600">Inga flaggade meddelanden</p>
                  </>
                ) : (
                  <>
                    <Inbox className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">Inga meddelanden</p>
                  </>
                )}
              </div>
            ) : (
              mailboxMessages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                    selectedId === msg.id && "bg-blue-50",
                    msg.status === "UNREAD" && "bg-blue-50/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {msg.status === "UNREAD" && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                        )}
                        {msg.status === "DRAFT" && (
                          <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">Utkast</span>
                        )}
                        {msg.status === "FLAGGED" && (
                          <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">Flaggat</span>
                        )}
                        {msg.direction === "outbound" && msg.status !== "DRAFT" && (
                          <Send className="h-3 w-3 shrink-0 text-gray-400" />
                        )}
                        <span className={cn(
                          "text-sm truncate",
                          msg.status === "UNREAD" ? "font-semibold text-gray-900" : "text-gray-700"
                        )}>
                          {msg.direction === "outbound" ? `Till: ${msg.toAddresses}` : msg.fromName}
                        </span>
                      </div>
                      <p className={cn(
                        "mt-0.5 text-sm truncate",
                        msg.status === "UNREAD" ? "font-medium text-gray-800" : "text-gray-600"
                      )}>
                        {msg.subject}
                      </p>
                      {msg.draftSource ? (
                        <p className="mt-0.5 text-xs text-amber-600 truncate">Från: {msg.draftSource}</p>
                      ) : (
                        <p className="mt-0.5 text-xs text-gray-400 truncate">{msg.bodyPreview}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(msg.receivedAt, { locale: sv, addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-1">
                        {msg.attachments.length > 0 && (
                          <Paperclip className="h-3 w-3 text-gray-400" />
                        )}
                        {msg.flags.some((f) => f.level === "critical") && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        {msg.flags.some((f) => f.level === "warning") && !msg.flags.some((f) => f.level === "critical") && (
                          <Shield className="h-3 w-3 text-amber-500" />
                        )}
                        {msg.entityType && (
                          <Link2 className="h-3 w-3 text-green-500" />
                        )}
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
              {/* From/To */}
              <div className="px-5 py-3 border-b border-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {selected.direction === "outbound" ? "Till" : "Från"}: {selected.direction === "outbound" ? selected.toAddresses : selected.fromName}
                      </span>
                      {selected.senderMatch && (
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          senderMatchColors[selected.senderMatch.type]
                        )}>
                          {senderMatchLabels[selected.senderMatch.type]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {selected.direction === "outbound" ? selected.fromAddress : selected.fromAddress}
                    </p>
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
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                    Bilagor ({selected.attachments.length})
                  </p>
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

            {/* Actions footer */}
            <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2">
              {selected.status === "DRAFT" && (
                <>
                  <button
                    onClick={() => setShowCompose(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Redigera och skicka
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <Trash2 className="h-3.5 w-3.5" /> Ta bort utkast
                  </button>
                  {selected.entityType && (
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> {selected.draftSource}
                    </span>
                  )}
                </>
              )}
              {selected.status === "FLAGGED" && (
                <>
                  <button className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                    <Shield className="h-3.5 w-3.5" /> Blockera domän
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <Inbox className="h-3.5 w-3.5" /> Flytta till inkorg
                  </button>
                  <button className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    <Trash2 className="h-3.5 w-3.5" /> Ta bort
                  </button>
                </>
              )}
              {selected.direction === "inbound" && selected.status !== "DRAFT" && selected.status !== "FLAGGED" && (
                <>
                  <button
                    onClick={() => setShowCompose(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <CornerUpLeft className="h-3.5 w-3.5" /> Svara
                  </button>
                  {!selected.entityType && (
                    <>
                      <button
                        onClick={() => setShowCreateCase(true)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
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
              {selected.direction === "outbound" && selected.status !== "DRAFT" && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Send className="h-3 w-3" /> Skickat
                </span>
              )}
            </div>

            {/* Create case dialog */}
            {showCreateCase && selected.direction === "inbound" && (
              <CreateCaseDialog
                message={selected}
                onClose={() => setShowCreateCase(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Compose dialog */}
      {showCompose && (
        <ComposeDialog
          mailbox={MOCK_MAILBOXES.find((mb) => mb.slug === activeMailbox)!}
          replyTo={selected?.direction === "inbound" && selected.status !== "DRAFT" ? selected : undefined}
          draft={selected?.status === "DRAFT" ? selected : undefined}
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
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Sender info */}
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

          {/* Case type */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Ärendetyp</label>
            <div className="grid grid-cols-3 gap-2">
              {caseTypeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCaseType(opt.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                      caseType === opt.value
                        ? "border-blue-300 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Options */}
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
          <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Avbryt
          </button>
          <button
            disabled={!caseType || !title}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
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

function ComposeDialog({
  mailbox,
  replyTo,
  draft,
  onClose,
}: {
  mailbox: MockMailbox;
  replyTo?: MockMessage;
  draft?: MockMessage;
  onClose: () => void;
}) {
  const isDraft = !!draft;
  const isReply = !!replyTo;

  const [to, setTo] = useState(
    draft?.toAddresses ?? replyTo?.fromAddress ?? ""
  );
  const [subject, setSubject] = useState(
    draft?.subject ?? (replyTo ? `Re: ${replyTo.subject}` : "")
  );
  const [body, setBody] = useState(
    draft?.bodyText ?? ""
  );

  const title = isDraft
    ? "Redigera utkast"
    : isReply
      ? `Svara: ${replyTo.fromName}`
      : "Nytt meddelande";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30">
      <div className="w-full max-w-2xl rounded-t-lg sm:rounded-lg border border-gray-200 bg-white shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {isDraft && draft.draftSource && (
              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
                {draft.draftSource}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* From */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 w-12 shrink-0">Från</label>
            <div className="flex-1 rounded-md bg-gray-50 px-3 py-1.5 text-sm text-gray-600">
              {mailbox.emailAddress}
            </div>
          </div>

          {/* To */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 w-12 shrink-0">Till</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="mottagare@example.com"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Subject */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 w-12 shrink-0">Ämne</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ämnesrad"
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Linked entity */}
          {(draft?.entityType || replyTo?.entityType) && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
              <Link2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm text-green-700">
                Kopplad till: {draft?.entityTitle ?? replyTo?.entityTitle ?? "Ärende"}
              </span>
            </div>
          )}

          {/* Body */}
          <textarea
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Skriv ditt meddelande..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-sans leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
          />

          {/* Reply context */}
          {isReply && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-1">
                {format(replyTo.receivedAt, "d MMM yyyy HH:mm", { locale: sv })} — {replyTo.fromName}:
              </p>
              <pre className="whitespace-pre-wrap font-sans text-xs text-gray-500 leading-relaxed max-h-32 overflow-y-auto">
                {replyTo.bodyText}
              </pre>
            </div>
          )}

          {/* Attachments */}
          <div>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Paperclip className="h-3.5 w-3.5" /> Bifoga fil
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 flex items-center gap-2 shrink-0">
          <button
            disabled={!to || !subject || !body}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Skicka
          </button>
          <button
            disabled={!to || !subject}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <Edit3 className="h-3.5 w-3.5" /> Spara som utkast
          </button>
          <button
            onClick={onClose}
            className="ml-auto rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}
