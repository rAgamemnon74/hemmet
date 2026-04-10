# Hemmet

Digital plattform för svenska bostadsrättsföreningar (BRF). Stödjer styrelsearbete, medlemmar, boende, revisorer och integrationer med externa tjänster. Konfigurationsdriven — anpassar sig till föreningens stadgar.

## Funktioner

### Styrelse
- **Möteshantering** — Skapa möten med dagordningsmallar, tilldela mötesroller (ordförande, sekreterare, justerare), registrera närvaro, skriv protokoll
- **Beslutslogg** — Tre beslutsmetoder: acklamation, votering med räknade röster, votering med namnupprop. Automatiska referensnummer (YYYY-MM-§N)
- **Utläggshantering** — Godkännandeflöde (SUBMITTED → APPROVED/REJECTED → PAID)
- **Ärenden/uppgifter** — Uppföljning kopplad till beslut med prioritet, deadline, tilldelning och kommentarer
- **Årsberättelse** — Verksamhetsberättelse med revisionsflöde

### Årsmöte
- **Dagordningsmallar** — 21 standardpunkter för ordinarie stämma, 11 för extra stämma
- **Röstlängd** — Digital incheckning eller uppladdad bilaga
- **Ombudshantering** — Intern (annan medlem) eller extern person med fullständig identifiering

### Revision
- **Årsrevision** — Revisorsgranskning med revisionsberättelse
- **Rekommendation** — Tillstyrker / tillstyrker med anmärkningar / avstyrker ansvarsfrihet

### Medlemmar
- **Medlemsregister** — Sök, filter, CSV-export
- **Lägenhetsregister** — Andelstal, avgifter, yta, boende, sammanfattningskort
- **Medlemsansökan** — Person och organisation med ägarskapsvalidering (max 100%)
- **Organisationsägande** — Ombud med personnummer, obligatoriskt mandatdokument
- **Motionshantering** — Lämna motion, styrelsens yttrande, statusflöde

### Boende
- **Felanmälan** — Allvarlighetsgrad, statusspårning, interna + publika kommentarer
- **Förslag** — Förbättringsförslag med styrelsens svar
- **Anslagstavla** — Målgruppsscoping (alla/medlemmar/styrelse), fästa meddelanden

### Konfiguration
- **BrfRules** — 35+ konfigurerbara parametrar baserat på analys av 10 BRF-stadgar
- Stöd för HSB, Riksbyggen och fristående föreningar
- Anpassningsbara regler för ombud, avgifter, styrelsesammansättning, revisorer m.m.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Språk | TypeScript |
| Databas | PostgreSQL + Prisma 6 |
| API | tRPC (21 routrar, end-to-end typsäkerhet) |
| Auth | NextAuth v5 (e-post + lösenord) |
| UI | Tailwind CSS 4 |
| Validering | Zod |

## Kom igång

### Förutsättningar
- Node.js 20+
- Docker eller Podman (för PostgreSQL)

### Installation

```bash
git clone <repo-url>
cd hemmet
make setup    # Installerar, startar DB, migrerar, seedar
make dev      # Starta dev-server
```

Öppna [http://localhost:3000](http://localhost:3000) och logga in med `ordforande@hemmet.se` / `password123`.

### Testanvändare

| E-post | Roll | Kan |
|---|---|---|
| `ordforande@hemmet.se` | Ordförande | Allt styrelserelaterat |
| `sekreterare@hemmet.se` | Sekreterare | Möten, protokoll, dagordning |
| `kassor@hemmet.se` | Kassör | Godkänna utlägg |
| `forvaltning@hemmet.se` | Förvaltningsansvarig | Hantera felanmälningar |
| `revisor@hemmet.se` | Revisor | Granska årsberättelse, revisionsberättelse |
| `medlem@hemmet.se` | Medlem | Motioner, rösta, se information |
| `boende@hemmet.se` | Boende | Felanmälan, förslag |

Alla har lösenord `password123`.

## Dokumentation och analyser

Katalogen `docs/` innehåller omfattande analyser av BRF-verksamhet, roller, juridik och processer. Dessa ligger till grund för systemets design och framtida utveckling.

### Rollanalyser

Djupanalyser av varje styrelseroll — nuläge i systemet, kritiska brister och prioriterade åtgärder.

| Dokument | Innehåll |
|----------|----------|
| [Ordföranderollen](docs/ORDFORANDE_ROLLEN.md) | 24 permissions, utslagsröst (ej implementerad), firmateckning, 7 prioriterade åtgärder |
| [Sekreterarrollen](docs/SEKRETERAR_ROLLEN.md) | Protokollsignering (DB klar, UI saknas), kallelsehantering, 5 åtgärder |
| [Kassörrollen](docs/KASSOR_ROLLEN.md) | Utläggsattest OK, budget/avgifter/kvitton saknas, 8 åtgärder |
| [Fastighetsansvarig](docs/FASTIGHETSANSVARIG_ROLLEN.md) | Felanmälan OK, underhållsplan (K3-krav) saknas helt, besiktningskalender saknas, 9 åtgärder |
| [Revisorsrollen](docs/REVISOR_ROLLEN.md) | Tre rollkategorier (styrelse/förening/granskning), förtroendevald vs auktoriserad, revisorn kan inte se ekonomi/protokoll |
| [Valberedningen](docs/VALBEREDARE_ROLLEN.md) | Ny rolltyp "föreningsroll", datamodell för nomineringar, oberoendekrav, arbetsflöde i 4 faser |

### Juridik och compliance

| Dokument | Innehåll |
|----------|----------|
| [Lagrum och GDPR](docs/BRF_SYSTEM_LAGRUM.md) | 17 tillämpliga lagar, GDPR-exponering (personnummer i klartext), K3-krav 2026, EPBD energikrav, gallringsrutiner, prioriterad checklista |
| [Jäv — praktisk analys](docs/JAV_PRAKTISK_ANALYS.md) | Beslutförhet vid jäv, sårbarhetstabell per styrelsestorlek, suppleant-inträde per ärende, jävsregister, implementationsplan |

### Processer och styrelsekrav

| Dokument | Innehåll |
|----------|----------|
| [BRF-processer](docs/BRF_PROCESSER.md) | ~50 processer för små/medelstora/stora BRF:er, processkarta per roll, prioriteringsmatris med 15 utvecklingsområden |
| [Styrelseroller och externa tjänster](docs/STYRELSEN_KRAV.md) | 8 styrelseroller med delegerade tjänster, integrationsmatris, gap-analys, 10 juridiska fallgropar (jäv, felaktigt nekade medlemskap, eftersatt underhåll m.m.) |

### Stadgeanalys

| Dokument | Innehåll |
|----------|----------|
| [Gapanalys stadgar vs plattform](docs/gap-analysis.md) | Systematisk genomgång av stadgekrav och systemstöd |
| [Jämförelse 10 BRF-stadgar](docs/stadgar-comparison.md) | HSB, Riksbyggen, fristående — skillnader och gemensamma parametrar |

## Projektstruktur

```
hemmet/
├── prisma/
│   ├── schema.prisma        # 30+ entiteter
│   └── seed.ts               # 10 testanvändare + testdata
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, register
│   │   ├── (dashboard)/      # 37 autentiserade sidor
│   │   │   ├── styrelse/     # Möten, ärenden, beslut, utlägg, årsberättelse, dokument
│   │   │   ├── boende/       # Felanmälan, förslag
│   │   │   ├── medlem/       # Motioner, register, lägenheter, ansökningar, organisationer
│   │   │   ├── revision/     # Årsrevision
│   │   │   └── info/         # Anslagstavla
│   │   └── api/              # Auth + tRPC
│   ├── server/
│   │   ├── trpc/routers/     # 21 API-routrar
│   │   ├── auth.ts
│   │   └── db.ts
│   ├── lib/
│   │   ├── permissions.ts    # 12 roller, 35+ permissions
│   │   ├── rules.ts          # BrfRules cache
│   │   ├── agenda-templates.ts
│   │   └── validators/       # Zod-schemas
│   └── components/layout/
├── docs/                      # Analyser och dokumentation (se ovan)
├── docker-compose.yml
├── Makefile
└── .env.example
```

## Roller och behörigheter

12 roller med hierarkisk RBAC:

| Roll | Beskrivning |
|---|---|
| **Admin** | Full åtkomst |
| **Ordförande** | Skapa möten, godkänna utlägg, hantera användare |
| **Sekreterare** | Möten, dagordning, mötesroller, protokoll |
| **Kassör** | Godkänna/avslå utlägg |
| **Förvaltningsansvarig** | Hantera felanmälningar |
| **Miljöansvarig / Festansvarig / Ledamot** | Styrelsefunktioner |
| **Suppleant** | Läsrättigheter till styrelsematerial |
| **Revisor** | Granska årsberättelse, revisionsberättelse |
| **Medlem** | Motioner, rösta, se information |
| **Boende** | Felanmälan, förslag |

## BrfRules — konfigurerbara stadgeregler

Baserat på analys av 10 BRF-stadgar (HSB Normalstadgar 2023, Riksbyggen, BRF Becknabergha, BRF Kungsklippan m.fl.). Konfigurerar:

- **Organisationsanslutning** — HSB/Riksbyggen med reserverade poster och vetorätt
- **Styrelsesammansättning** — min/max ledamöter och suppleanter
- **Ombudsregler** — max antal (1-2), kretsbegränsning (ja/nej), giltighetstid
- **Kallelsetider** — 2-6 veckor, digital metod
- **Röstningsregler** — blankröst, sluten omröstning, lottning
- **Avgiftstak** — överlåtelse (2,5-3,5%), pantsättning (1-1,5%), andrahand (10%)
- **Revisorkrav** — antal, auktoriserad-krav
- **Underhåll** — plan obligatorisk, antal år, fondprocent
- **Ägarskap** — max procent (100-105%)

## Licens

MIT
