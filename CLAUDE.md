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

## GDPR-designprinciper

Dessa principer är OBLIGATORISKA och gäller all kod som hanterar persondata:

1. **Visa aldrig mer än rollen kräver.** Varje API-endpoint som returnerar persondata MÅSTE använda `.select()` med fält filtrerade per roll. Aldrig `include` utan fältbegränsning på User-data. `passwordHash` returneras ALDRIG.

2. **Personnummer visas aldrig i klartext.** Använd `maskPersonalId()` från `src/lib/gdpr.ts`. Enda undantaget: explicit "visa fullständigt"-klick för ordförande/kassör, med åtkomstloggning.

3. **Kontaktuppgifter (e-post, telefon) kräver rollcheck.** Styrelsemedlemmar ser kontaktinfo. Medlemmar ser bara namn + lägenhet (BrfL 9:8). Boende ser ingenting. Kontrollera `isBoardMember` på serversidan, lita aldrig på klienten.

4. **Logga åtkomst till persondata.** Varje visning av register, ansökningar eller personnummer loggas via `logPersonalDataAccess()`. Fire-and-forget — blockerar aldrig requests.

5. **Samtycke via opt-in.** Kontaktdelning mellan medlemmar kräver aktivt samtycke (`UserConsent`-modellen). Default = dolt.

6. **Gallra data med rättslig grund.** Avslagna ansökningar: 6 mån. Avslutade medlemskap: behåll namn + lägenhet + ekonomi i 7 år (bokföringslagen), radera personnummer/telefon/e-post. Externa ombud: 3 mån efter mötet.

7. **CSV-export respekterar samma filtrering.** En export ska aldrig innehålla mer data än vad användaren ser i UI. Logga alla exporter.

8. **"Det finns ju på Ratsit" är inget försvar.** BRF:en är självständig personuppgiftsansvarig. Att data publicerats av andra ger inte oss rätt att behandla den utan egen rättslig grund.

## Aktivitetsloggning (audit trail)

Dessa principer är OBLIGATORISKA för alla tRPC-mutations som ändrar data:

1. **Alla mutations ska logga.** Varje mutation som skapar, ändrar eller tar bort data MÅSTE anropa `logActivity()` från `src/lib/audit.ts`. Inga undantag.

2. **Logga before/after.** Vid statusändringar och fältuppdateringar: hämta befintligt värde FÖRE ändringen, logga både gammalt och nytt som JSON. Använd `diffFields()` vid komplexa ändringar.

3. **Beskrivningen ska vara läsbar.** `description`-fältet ska vara en kort svensk mening som en revisor kan förstå: "Ändrade mötesstatus från DRAFT till SCHEDULED", "Godkände utlägg: Reparation av hiss", "Jävsdeklaration: Anna Ordförande — äger leverantörsfirman".

4. **Fire-and-forget.** `logActivity()` blockerar aldrig — logga och gå vidare. Loggningsfel får aldrig krascha en mutation.

5. **entityType + entityId är obligatoriska.** Varje loggpost MÅSTE kunna kopplas till en specifik entitet: "Meeting" + id, "Expense" + id, "Protocol" + id etc.

6. **Jävsdeklarationer loggas med full kontext.** Vid `declareRecusal`: logga vem som var jävig, anledning, och vilka som kvarstod som deltagare (before/after participantIds).

## Konventioner

- **Språk:** Svensk UI-text, svenska URL-sökvägar, all kod på engelska
- **Routing:** Route groups `(auth)` och `(dashboard)` med svenska sökvägar
- **Komponentmönster:** Server component (page.tsx) hämtar data via `serverTrpc()`, skickar till klient-komponent
- **RBAC:** 12 roller, 35+ permissions i `src/lib/permissions.ts`, kontrolleras via `requirePermission()` i tRPC-middleware
- **Validering:** Zod-schemas i `src/lib/validators/`, delade mellan klient och server
- **Pengar:** Alltid `Decimal` (Prisma) / `Prisma.Decimal`, aldrig float
- **Konfiguration:** Föreningsspecifika regler i `BrfRules`-modellen, hämtas via `getBrfRules()` från `src/lib/rules.ts`
- **Persondata:** Följ GDPR-designprinciperna ovan — de övertrumfar alla andra konventioner

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
