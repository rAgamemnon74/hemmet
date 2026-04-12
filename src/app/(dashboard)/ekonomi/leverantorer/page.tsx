"use client";

import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Users, Shield, AlertTriangle, Plus, ChevronDown, ChevronRight,
  Phone, Mail, Globe, MapPin, Star, CheckCircle, X, ExternalLink,
  CreditCard, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// Mock data — ersätts med tRPC i fas 1
// ============================================================

type MockContractor = {
  id: string;
  name: string;
  category: string;
  active: boolean;
  orgNumber: string | null;
  vatNumber: string | null;
  country: string;
  fTax: boolean;
  fTaxVerifiedAt: Date | null;
  vatRegistered: boolean;
  insuranceCoverage: boolean;
  insuranceExpiry: Date | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  streetAddress: string | null;
  city: string | null;
  pubAgreement: boolean;
  pubAgreementDate: Date | null;
  notes: string | null;
  rating: number | null;
  bankgiro: string | null;
  plusgiro: string | null;
  iban: string | null;
  swish: string | null;
  contacts: { name: string; role: string | null; phone: string | null; email: string | null }[];
  // Derived
  activeContracts: number;
  totalInvoiced2025: number;
  lastInvoiceDate: Date | null;
};

const categoryLabels: Record<string, string> = {
  PLUMBER: "VVS", ELECTRICIAN: "El", LOCKSMITH: "Lås", PAINTER: "Målare",
  CLEANING: "Städ", ELEVATOR: "Hiss", GARDENING: "Trädgård", SNOW: "Snöröjning",
  SECURITY: "Larm/bevakning", HVAC: "Ventilation", ROOFING: "Tak",
  INSURANCE: "Försäkring", ACCOUNTING: "Ekonomi/Revision", TELECOM: "Bredband/Tele",
  CONSULTING: "Konsult", OTHER: "Övrigt",
};

const categoryColors: Record<string, string> = {
  PLUMBER: "bg-blue-100 text-blue-700", ELECTRICIAN: "bg-amber-100 text-amber-700",
  LOCKSMITH: "bg-gray-100 text-gray-700", PAINTER: "bg-orange-100 text-orange-700",
  CLEANING: "bg-green-100 text-green-700", ELEVATOR: "bg-purple-100 text-purple-700",
  GARDENING: "bg-emerald-100 text-emerald-700", SNOW: "bg-cyan-100 text-cyan-700",
  SECURITY: "bg-red-100 text-red-700", HVAC: "bg-teal-100 text-teal-700",
  ROOFING: "bg-stone-100 text-stone-700", INSURANCE: "bg-indigo-100 text-indigo-700",
  ACCOUNTING: "bg-violet-100 text-violet-700", TELECOM: "bg-sky-100 text-sky-700",
  CONSULTING: "bg-fuchsia-100 text-fuchsia-700", OTHER: "bg-gray-100 text-gray-600",
};

const now = new Date();

const MOCK_CONTRACTORS: MockContractor[] = [
  {
    id: "lev1", name: "KONE AB", category: "ELEVATOR", active: true,
    orgNumber: "556027-2093", vatNumber: "SE556027209301", country: "SE",
    fTax: true, fTaxVerifiedAt: new Date("2025-01-15"), vatRegistered: true,
    insuranceCoverage: true, insuranceExpiry: new Date("2027-06-30"),
    contactPerson: "Anna Ström", phone: "08-474 74 00", email: "anna.strom@kone.com",
    website: "kone.se", streetAddress: "Hissvägen 10", city: "Solna",
    pubAgreement: false, pubAgreementDate: null, notes: "Pålitliga, snabb jourutryckning", rating: 4,
    bankgiro: "123-4567", plusgiro: null, iban: null, swish: null,
    contacts: [
      { name: "Anna Ström", role: "Kundansvarig", phone: "070-123 4567", email: "anna.strom@kone.com" },
      { name: "KONE Jourservice", role: "Jour (24h)", phone: "020-20 20 20", email: null },
    ],
    activeContracts: 1, totalInvoiced2025: 84000, lastInvoiceDate: new Date("2026-01-15"),
  },
  {
    id: "lev2", name: "Andersson VVS AB", category: "PLUMBER", active: true,
    orgNumber: "556789-0123", vatNumber: null, country: "SE",
    fTax: true, fTaxVerifiedAt: new Date("2024-06-01"), vatRegistered: true,
    insuranceCoverage: true, insuranceExpiry: new Date("2026-12-31"),
    contactPerson: "Anders Andersson", phone: "08-123 456", email: "info@anderssonvvs.se",
    website: "anderssonvvs.se", streetAddress: "Rörvägen 5", city: "Stockholm",
    pubAgreement: false, pubAgreementDate: null, notes: "Bra priser, flexibla. Används för akuta jobb.", rating: 4,
    bankgiro: "234-5678", plusgiro: null, iban: null, swish: null,
    contacts: [
      { name: "Anders Andersson", role: "Allt", phone: "073-456 7890", email: "anders@anderssonvvs.se" },
    ],
    activeContracts: 0, totalInvoiced2025: 48200, lastInvoiceDate: new Date("2026-04-12"),
  },
  {
    id: "lev3", name: "CleanTeam AB", category: "CLEANING", active: true,
    orgNumber: "556456-7890", vatNumber: null, country: "SE",
    fTax: true, fTaxVerifiedAt: new Date("2025-03-01"), vatRegistered: true,
    insuranceCoverage: true, insuranceExpiry: new Date("2026-06-30"),
    contactPerson: "Maria Lund", phone: "08-555 1234", email: "kontakt@cleanteam.se",
    website: "cleanteam.se", streetAddress: null, city: "Stockholm",
    pubAgreement: true, pubAgreementDate: new Date("2025-03-01"), notes: null, rating: 3,
    bankgiro: "345-6789", plusgiro: null, iban: null, swish: null,
    contacts: [
      { name: "Maria Lund", role: "Kundansvarig", phone: "070-555 1234", email: "maria@cleanteam.se" },
      { name: "Fakturering", role: "Faktura", phone: null, email: "faktura@cleanteam.se" },
    ],
    activeContracts: 1, totalInvoiced2025: 148000, lastInvoiceDate: new Date("2026-03-01"),
  },
  {
    id: "lev4", name: "Securitas AB", category: "SECURITY", active: true,
    orgNumber: "556108-6082", vatNumber: "SE556108608201", country: "SE",
    fTax: true, fTaxVerifiedAt: new Date("2025-01-10"), vatRegistered: true,
    insuranceCoverage: true, insuranceExpiry: new Date("2027-12-31"),
    contactPerson: "Johan Svensson", phone: "010-470 00 00", email: "avtal@securitas.se",
    website: "securitas.se", streetAddress: "Lindhagensplan 70", city: "Stockholm",
    pubAgreement: true, pubAgreementDate: new Date("2024-07-01"), notes: "Avtal löper ut 2026-06-30. Upphandling pågår.", rating: 3,
    bankgiro: "456-7890", plusgiro: null, iban: null, swish: null,
    contacts: [],
    activeContracts: 1, totalInvoiced2025: 42000, lastInvoiceDate: new Date("2026-01-01"),
  },
  {
    id: "lev5", name: "Grönyta AB", category: "GARDENING", active: true,
    orgNumber: "556234-5678", vatNumber: null, country: "SE",
    fTax: true, fTaxVerifiedAt: null, vatRegistered: false,
    insuranceCoverage: false, insuranceExpiry: null,
    contactPerson: "Lars Grön", phone: "073-222 3344", email: "lars@gronyta.se",
    website: null, streetAddress: null, city: "Huddinge",
    pubAgreement: false, pubAgreementDate: null, notes: "Enmansfirma, säsongsbaserat", rating: 4,
    bankgiro: "567-8901", plusgiro: null, iban: null, swish: "073-222 3344",
    contacts: [],
    activeContracts: 1, totalInvoiced2025: 72000, lastInvoiceDate: new Date("2025-10-15"),
  },
  {
    id: "lev6", name: "Nabo AB", category: "ACCOUNTING", active: true,
    orgNumber: "556890-1234", vatNumber: "SE556890123401", country: "SE",
    fTax: true, fTaxVerifiedAt: new Date("2024-01-01"), vatRegistered: true,
    insuranceCoverage: true, insuranceExpiry: new Date("2027-12-31"),
    contactPerson: "Eva Nilsson", phone: "08-410 210 00", email: "info@nabo.se",
    website: "nabo.se", streetAddress: "Drottninggatan 55", city: "Stockholm",
    pubAgreement: true, pubAgreementDate: new Date("2023-06-01"), notes: "Ekonomisk förvaltare sedan 2024", rating: 5,
    bankgiro: "678-9012", plusgiro: null, iban: null, swish: null,
    contacts: [
      { name: "Eva Nilsson", role: "Kundansvarig", phone: "070-410 2100", email: "eva.nilsson@nabo.se" },
      { name: "Support", role: "Teknisk support", phone: "08-410 210 10", email: "support@nabo.se" },
    ],
    activeContracts: 1, totalInvoiced2025: 96000, lastInvoiceDate: new Date("2026-03-15"),
  },
  {
    id: "lev7", name: "Fasadspecialisten AB", category: "PAINTER", active: true,
    orgNumber: "556345-6789", vatNumber: null, country: "SE",
    fTax: true, fTaxVerifiedAt: new Date("2025-06-01"), vatRegistered: true,
    insuranceCoverage: true, insuranceExpiry: new Date("2027-03-31"),
    contactPerson: "Bengt Fasad", phone: "08-777 8899", email: "offert@fasadspec.se",
    website: "fasadspecialisten.se", streetAddress: "Målargatan 12", city: "Täby",
    pubAgreement: false, pubAgreementDate: null, notes: "Dyrare men lång garanti (10 år). Goda erfarenheter sedan fasadprojekt 2020.", rating: 5,
    bankgiro: "789-0123", plusgiro: null, iban: null, swish: null,
    contacts: [
      { name: "Bengt Fasad", role: "Offert", phone: "070-777 8899", email: "bengt@fasadspec.se" },
      { name: "Fakturering", role: "Faktura", phone: null, email: "faktura@fasadspec.se" },
    ],
    activeContracts: 1, totalInvoiced2025: 0, lastInvoiceDate: null,
  },
];

// ============================================================
// Components
// ============================================================

export default function ContractorsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const contractors = MOCK_CONTRACTORS;
  const filtered = contractors
    .filter((c) => showInactive || c.active)
    .filter((c) => !categoryFilter || c.category === categoryFilter);

  const categories = [...new Set(contractors.map((c) => c.category))];

  // Warnings
  const warnings = contractors.filter((c) => c.active && (
    !c.fTax ||
    !c.insuranceCoverage ||
    (c.insuranceExpiry && c.insuranceExpiry < now) ||
    (c.pubAgreement === false && ["CLEANING", "ACCOUNTING", "SECURITY", "ELEVATOR", "TELECOM"].includes(c.category))
  ));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> Leverantörer
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {contractors.filter((c) => c.active).length} aktiva leverantörer
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Ny leverantör
        </button>
      </div>

      {/* Warnings banner */}
      {warnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> {warnings.length} leverantörer kräver uppmärksamhet
          </p>
          <div className="mt-1.5 space-y-0.5">
            {warnings.map((c) => (
              <p key={c.id} className="text-xs text-amber-700">
                {c.name}:
                {!c.fTax && " F-skatt saknas"}
                {!c.insuranceCoverage && " Försäkring saknas"}
                {c.insuranceExpiry && c.insuranceExpiry < now && " Försäkring utgången"}
                {!c.pubAgreement && ["CLEANING", "ACCOUNTING", "SECURITY", "ELEVATOR", "TELECOM"].includes(c.category) && " PUB-avtal saknas"}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <button onClick={() => setCategoryFilter(null)}
          className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
            !categoryFilter ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
          Alla ({filtered.length})
        </button>
        {categories.map((cat) => {
          const count = contractors.filter((c) => c.category === cat && (showInactive || c.active)).length;
          return (
            <button key={cat} onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
                categoryFilter === cat ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {categoryLabels[cat] ?? cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Contractor list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Inga leverantörer</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <ContractorCard key={c.id} contractor={c}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContractorCard({ contractor: c, expanded, onToggle }: {
  contractor: MockContractor; expanded: boolean; onToggle: () => void;
}) {
  const hasWarning = !c.fTax || !c.insuranceCoverage || (c.insuranceExpiry && c.insuranceExpiry < now);

  return (
    <div className={cn("rounded-lg border bg-white overflow-hidden", hasWarning ? "border-amber-200" : "border-gray-200")}>
      <button onClick={onToggle} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {expanded ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900">{c.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[c.category] ?? categoryColors.OTHER)}>
                  {categoryLabels[c.category] ?? c.category}
                </span>
                {c.pubAgreement && (
                  <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs text-green-600 flex items-center gap-0.5">
                    <Shield className="h-3 w-3" /> PUB
                  </span>
                )}
                {c.rating && (
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400" /> {c.rating}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                {c.contactPerson && <span>{c.contactPerson}</span>}
                {c.orgNumber && <span className="text-gray-400">{c.orgNumber}</span>}
                {c.activeContracts > 0 && <span>{c.activeContracts} avtal</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!c.fTax && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 flex items-center gap-0.5">
                <AlertTriangle className="h-3 w-3" /> F-skatt saknas
              </span>
            )}
            {!c.insuranceCoverage && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Försäkring saknas
              </span>
            )}
            {c.totalInvoiced2025 > 0 && (
              <span className="text-xs text-gray-400">
                {c.totalInvoiced2025.toLocaleString("sv-SE")} kr (2025)
              </span>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Kontakt */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">Kontakt</h4>
              {c.phone && (
                <p className="flex items-center gap-1.5 text-gray-700">
                  <Phone className="h-3 w-3 text-gray-400" /> {c.phone}
                </p>
              )}
              {c.email && (
                <p className="flex items-center gap-1.5 text-gray-700">
                  <Mail className="h-3 w-3 text-gray-400" /> {c.email}
                </p>
              )}
              {c.website && (
                <p className="flex items-center gap-1.5 text-blue-600">
                  <Globe className="h-3 w-3" /> {c.website}
                </p>
              )}
              {c.city && (
                <p className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="h-3 w-3 text-gray-400" /> {c.streetAddress ? `${c.streetAddress}, ` : ""}{c.city}
                </p>
              )}
            </div>

            {/* Juridik & betalning */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase">Juridik & betalning</h4>
              <div className="flex items-center gap-1.5 text-gray-700">
                {c.fTax ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-red-500" />}
                <span>F-skatt{c.fTax ? "" : " saknas — skatteavdrag 30% krävs"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                {c.insuranceCoverage ? <CheckCircle className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                <span>
                  Försäkring{c.insuranceCoverage
                    ? c.insuranceExpiry ? ` (t.o.m. ${format(c.insuranceExpiry, "yyyy-MM-dd")})` : ""
                    : " saknas"}
                </span>
              </div>
              {c.bankgiro && (
                <p className="flex items-center gap-1.5 text-gray-700">
                  <CreditCard className="h-3 w-3 text-gray-400" /> Bankgiro: {c.bankgiro}
                </p>
              )}
              {c.swish && (
                <p className="flex items-center gap-1.5 text-gray-700">
                  <CreditCard className="h-3 w-3 text-gray-400" /> Swish: {c.swish}
                </p>
              )}
            </div>
          </div>

          {/* Extra contacts */}
          {c.contacts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Kontaktpersoner</h4>
              <div className="space-y-1">
                {c.contacts.map((contact, i) => (
                  <div key={i} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{contact.name}</span>
                      {contact.role && <span className="ml-2 text-xs text-gray-400">{contact.role}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {contact.phone && <span>{contact.phone}</span>}
                      {contact.email && <span>{contact.email}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {c.notes && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Noteringar</h4>
              <p className="text-sm text-gray-600 italic">{c.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
            <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Redigera
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              Ny upphandling
            </button>
            {c.activeContracts > 0 && (
              <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                Visa avtal ({c.activeContracts})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
