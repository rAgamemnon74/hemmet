@AGENTS.md

# Hemmet — BRF-stödplattform

## Projektöversikt

Digital plattform för svenska bostadsrättsföreningar. Stödjer styrelsearbete, medlemmar, boende, revisorer och externa integrationer. Konfigurationsdriven — anpassar sig till föreningens stadgar via BrfRules.

## Tech stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma 6** + PostgreSQL (via Docker Compose / Podman)
- **tRPC** med Zod-validering och superjson
- **NextAuth v5** (Credentials provider, e-post + lösenord)
- **Tailwind CSS 4** + shadcn/ui-mönster
- **date-fns** med svensk locale

## Konventioner

- **Språk:** Svensk UI-text, svenska URL-sökvägar, all kod på engelska
- **Routing:** Route groups `(auth)` och `(dashboard)` med svenska sökvägar
- **Komponentmönster:** Server component (page.tsx) hämtar data via `serverTrpc()`, skickar till klient-komponent
- **RBAC:** 12 roller, 35+ permissions i `src/lib/permissions.ts`, kontrolleras via `requirePermission()` i tRPC-middleware
- **Validering:** Zod-schemas i `src/lib/validators/`, delade mellan klient och server
- **Pengar:** Alltid `Decimal` (Prisma) / `Prisma.Decimal`, aldrig float
- **Konfiguration:** Föreningsspecifika regler i `BrfRules`-modellen, hämtas via `getBrfRules()` från `src/lib/rules.ts`

## Kommandon

```bash
make setup       # Fullständig setup (install + db + migrate + seed)
make dev         # Starta dev-server (startar även databasen)
make stop        # Stoppa allt
make db-reset    # Radera och återskapa databasen
make status      # Visa vad som körs
make help        # Visa alla kommandon
```

## Testanvändare (lösenord: password123)

| E-post | Roll |
|---|---|
| admin@hemmet.se | Admin |
| ordforande@hemmet.se | Ordförande |
| sekreterare@hemmet.se | Sekreterare |
| kassor@hemmet.se | Kassör |
| forvaltning@hemmet.se | Förvaltningsansvarig |
| miljo@hemmet.se | Miljöansvarig |
| suppleant@hemmet.se | Suppleant |
| revisor@hemmet.se | Revisor |
| medlem@hemmet.se | Medlem |
| boende@hemmet.se | Boende |

## Roller (12 st)

`ADMIN`, `BOARD_CHAIRPERSON`, `BOARD_SECRETARY`, `BOARD_TREASURER`, `BOARD_PROPERTY_MGR`, `BOARD_ENVIRONMENT`, `BOARD_EVENTS`, `BOARD_SUBSTITUTE`, `BOARD_MEMBER`, `AUDITOR`, `MEMBER`, `RESIDENT`

## Nyckelkatalogstruktur

```
prisma/schema.prisma           # Datamodell (30+ entiteter)
src/lib/permissions.ts          # RBAC (12 roller, 35+ permissions)
src/lib/rules.ts                # BrfRules cache-hämtning
src/lib/agenda-templates.ts     # Dagordningsmallar (styrelse/årsmöte/extra)
src/lib/validators/             # Zod-schemas per modul
src/server/trpc/trpc.ts         # tRPC-init med auth-context
src/server/trpc/routers/        # 21 tRPC-routrar
src/app/(dashboard)/            # Autentiserade sidor (37 routes)
src/app/(auth)/                 # Login/register
src/components/layout/          # Sidebar, topbar, mobilnav
docs/gap-analysis.md            # Gapanalys stadgar vs plattform
docs/stadgar-comparison.md      # Jämförelse 10 BRF-stadgar
docs/stadgar/                   # Nedladdade stadge-PDF:er
```

## Datamodell — huvudentiteter

**Förening:** BrfSettings, BrfRules, Building, Apartment, ApartmentOwnership
**Användare:** User, UserRole, Session
**Organisationer:** Organization, OrganizationRepresentative, OrganizationMandate
**Medlemskap:** MembershipApplication (person + juridisk person)
**Möten:** Meeting (med mötesroller), AgendaItem, MeetingAttendance, Protocol, Vote
**Beslut:** Decision (acklamation/votering), DecisionVote, Task, TaskComment
**Ekonomi:** Expense (godkännandeflöde)
**Årsmöte:** VoterRegistry, VoterRegistryEntry, MeetingProxy
**Revision:** AnnualReport, Audit
**Boende:** DamageReport, ReportComment, Suggestion
**Övrigt:** Motion, Announcement, Document, Notification, IntegrationConfig

## BrfRules — konfigurerbara regler

Baserat på analys av 10 BRF-stadgar (HSB, Riksbyggen, fristående). Nyckelparametrar:

- Organisationsanslutning (HSB/Riksbyggen/Ingen) med reserverade poster
- Styrelse min/max, suppleanter, externa ledamöter
- Ombud: max antal, kretsbegränsning, giltighetstid
- Kallelse: tidsregler, digital metod, digital stämma
- Röstning: blankröst, sluten omröstning, lottning
- Avgifter: överlåtelse/pantsättning/andrahand (procent av prisbasbelopp)
- Revisorer: antal, auktoriserad-krav
- Underhåll: plan obligatorisk, antal år, fondprocent
- Ägarskap: max procent (100 vs 105)

## Viktigt att veta

- `middleware.ts` hanterar auth-redirect (Next.js 16 varnar deprecated)
- `AUTH_SECRET` och `AUTH_TRUST_HOST=true` krävs i .env (NextAuth v5 beta)
- `suppressHydrationWarning` på `<html>` för webbläsartillägg
- Prisma 6 (inte 7) pga breaking changes
- Podman används istället för Docker (auto-detect i Makefile)
- Beslut har tre metoder: acklamation, votering (räknade), votering (namnupprop)
- Dagordningsmallar auto-fyller vid mötesskapande (konfigurerbart)
- Röstlängd + ombud visas bara för årsmöten/extra stämmor
