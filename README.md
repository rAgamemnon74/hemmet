# Hemmet

**Digital plattform för svenska bostadsrättsföreningar.** Styrelsearbete, möten, protokoll, ekonomi, bokningar, medlemsregister, revision, integrationer. Konfigurationsdriven — anpassar sig till föreningens stadgar via `BrfRules` (42 stadge-parametrar härledda från analys av 10 verkliga BRF-stadgar).

Nuvarande version: **1.0.0-rc1** (release-kandidat, 2026-04-22). Se [CHANGELOG.md](CHANGELOG.md).

## Innehåll

- [Funktioner](#funktioner)
- [Tech stack](#tech-stack)
- [Installation på Debian/Raspberry Pi (.deb)](#installation-på-debianraspberry-pi-deb)
- [Uppgradering och avinstallation](#uppgradering-och-avinstallation)
- [Utvecklingsmiljö](#utvecklingsmiljö)
- [Bygg eget .deb-paket](#bygg-eget-deb-paket)
- [BRF-YAML-import](#brf-yaml-import)
- [Versionering](#versionering)
- [Roller och behörigheter](#roller-och-behörigheter)
- [Dokumentation och analyser](#dokumentation-och-analyser)
- [Licens](#licens)

## Funktioner

### Styrelse
- **Möteshantering** — Dagordningsmallar (styrelse/stämma/extra), närvaro, inline-yttrande på motioner under pågående möte, live-presentationsvy, beslutsflöde
- **Protokoll** — Generator med konfigurerbart sidhuvud per mötestyp, dynamiskt löpnummer, motioner med styrelsens rekommendation, jävsdeklarationer, `.md`/`.docx`-export, uppladdning av undertecknat PDF
- **Beslut** — Tre metoder: acklamation, votering (räknat), votering (namnupprop). Automatiska referensnummer (`YYYY-MM-§N`)
- **Jäv** — Jävsdeklarationer med automatisk uppdatering av participant-listan, audit-spårning, suppleant-inträde
- **Utlägg** — Attestflöde (SUBMITTED → APPROVED → PAID)
- **Ärenden** — Uppföljning kopplad till beslut med prioritet, deadline, kommentarer
- **Årsberättelse** — Verksamhetsberättelse med revisionsflöde

### Bokningssystem
- Tre bokningslägen: **FREEFORM** (fri tid), **SLOTS** (pass), **DAYS** (dygn)
- Veckovy (måndag–söndag) med ISO-veckonummer
- Priority-gating per resurstyp — återbokningar får reducerat bokningsfönster
- Anti-gaming: sena avbokningar räknas mot priority
- Per-resurs-limiter (max aktiva, max per period, max i följd)
- Resurstyper: tvättstuga, bastu, gästlägenhet, festlokal, parkering, hobbyrum, övrigt
- 24 månaders GDPR-gallring av bokningshistorik

### Årsmöte
- 21 standardpunkter för ordinarie stämma, 11 för extra stämma
- Digital röstlängd med QR-incheckning eller uppladdad bilaga
- Ombudshantering — medlemsombud eller extern person
- Poströstning (konfigurerbart per stadgar)

### Revision
- Förtroendevald vs auktoriserad revisor
- Revisionsberättelse med rekommendation (tillstyrker/anmärkning/avstyrker)
- Separat åtkomst till ekonomi, protokoll, årsberättelse

### Medlemmar
- Register med sök/filter/CSV-export (rollfiltrerad enligt GDPR)
- Lägenhetsregister med andelstal, avgifter, yta, ägarskap
- Medlemsansökan för person + juridisk person (max 100% ägarskap)
- Organisationsägande med ombud (personnummer, mandatdokument)
- Överlåtelseprocess med 5-stegs-flöde
- Motioner med styrelsens yttrande + rekommendation

### Boende
- Felanmälan med allvarlighetsgrad, bilder, statusspårning
- Förslag med styrelsens svar
- Anslagstavla med målgruppsscoping
- Störningsärenden (ansvarskedja vid andrahand)
- Bokning av gemensamma resurser

### Miljömodul
- Egenkontroll, kemiska produkter, avfall, miljöincidenter, riskbedömning

### Valberedning
- Nomineringsperioder + kandidatförslag
- `NOMINATING_COMMITTEE_CHAIR` finaliserar

### Konfiguration (BrfRules)
- 42+ stadgeparametrar baserade på analys av HSB, Riksbyggen och fristående BRF:er
- Organisationsanslutning (HSB/Riksbyggen) med reserverade styrelseposter
- Styrelsesammansättning, kallelsetider, ombud, avgiftstak, revisorkrav, underhållskrav

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Språk | TypeScript, React 19 |
| Databas | PostgreSQL 14+ + Prisma 6 |
| API | tRPC v11 (**40 routrar**, end-to-end typsäkerhet) |
| Datamodell | **74 modeller, 57 enums, 8 migrationer** |
| Auth | NextAuth v5 (credentials, JWT) |
| UI | Tailwind CSS 4 + shadcn/ui-mönster |
| Validering | Zod |
| Paketering | Debian `.deb` (arm64 + amd64 cross-build) |
| Dokumentgenerering | Markdown + `docx` |

## Installation på Debian/Raspberry Pi (.deb)

Enklaste vägen att köra Hemmet i produktion — för en förening som vill köra systemet på en Raspberry Pi 4/5 eller annan Debian-baserad server.

### Förutsättningar

- Debian 12 (Bookworm) eller senare — gärna Raspberry Pi 4/5 aarch64
- **Node.js 20+** (Debians apt-version 18 är för gammal — använd NodeSource)
- PostgreSQL 14+ (installeras automatiskt som `Recommends`-beroende om det saknas)
- 512 MB RAM minimum, 2 GB disk

### Ett-kommando-installation

```bash
# 1. Installera Node 20 LTS via NodeSource (om det inte redan finns)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Hämta senaste release från GitHub
VERSION=1.0.0-rc1
DEB_VERSION=${VERSION/-/~}    # konvertera semver → dpkg: 1.0.0-rc1 → 1.0.0~rc1
curl -L -o /tmp/hemmet.deb \
    "https://github.com/rAgamemnon74/hemmet/releases/download/v${VERSION}/hemmet_${DEB_VERSION}_arm64.deb"

# 3. Installera (drar in postgresql, postgresql-client m.m. som deps)
sudo apt install -y /tmp/hemmet.deb
```

Om lokal PostgreSQL finns tillgänglig kör `postinst`-hooken automatiskt `hemmet-setup`, som:

1. Skapar DB-rollen `hemmet` med slumpgenererat lösenord
2. Skapar databasen `hemmet`
3. Skriver `DATABASE_URL` till `/etc/hemmet/env`
4. Genererar `AUTH_SECRET`
5. Kör databas-migreringar
6. Grundladdar `BrfSettings`, `BrfRules`, och en admin-användare
7. Aktiverar och startar `hemmet.service`

Det **initiala admin-kontot** skrivs ut på skärmen och sparas också i `/var/lib/hemmet/initial-admin-credentials` (chmod 0600, root-only):

```
============================================================
  INITIALT ADMIN-KONTO SKAPAT
    E-post:    admin@hemmet.local
    Lösenord:  2SXOEiD29LYuiU9M
============================================================
```

Öppna `http://<serverns-ip>:3000`, logga in, och byt omedelbart e-post + lösenord via `/min-sida`. Radera sedan lösenordsfilen: `sudo rm /var/lib/hemmet/initial-admin-credentials`.

### Manuell setup (om auto-setup skippades)

Om PostgreSQL inte finns lokalt (t.ex. om du använder en fjärr-DB), eller om du satt `HEMMET_SKIP_AUTO_SETUP=1`:

```bash
# 1. Redigera /etc/hemmet/env (sätt DATABASE_URL + AUTH_SECRET)
sudo -e /etc/hemmet/env

# 2. Kör migrations
sudo hemmet-migrate

# 3. Starta service
sudo systemctl enable --now hemmet.service
```

### Admin-kommandon

| Kommando | Vad det gör |
|---|---|
| `sudo hemmet-setup` | Idempotent förstagångs-init (kör flera gånger utan biverkningar) |
| `sudo hemmet-migrate` | Kör Prisma migrate deploy mot konfigurerad DB |
| `sudo hemmet-test-db` | Testar databasanslutning + listar tabeller |
| `sudo hemmet-gen-secret` | Roterar `AUTH_SECRET` (invaliderar sessioner) |
| `sudo hemmet-import-brf [--apply] fil.yaml` | Importerar BRF-data från YAML-mall |

### Drift

```bash
sudo systemctl status hemmet        # status
sudo systemctl restart hemmet       # omstart
journalctl -u hemmet -f             # live-loggar
sudo -e /etc/hemmet/env             # redigera konfig
```

## Uppgradering och avinstallation

### Uppgradering

```bash
# Ladda ner nytt .deb
VERSION=1.0.1
DEB_VERSION=${VERSION/-/~}
curl -L -o /tmp/hemmet.deb \
    "https://github.com/rAgamemnon74/hemmet/releases/download/v${VERSION}/hemmet_${DEB_VERSION}_arm64.deb"

# Installera — postinst kör automatiskt migrations + omstart
sudo apt install -y /tmp/hemmet.deb
```

Uppladdade dokument (`/var/lib/hemmet/uploads/`) och `/etc/hemmet/env` bevaras mellan versioner.

### Avinstallation

```bash
# Behåll persondata + DB (för reinstallation senare)
sudo apt remove hemmet

# Eller: fullständig bort inkl. konfig + uploads
sudo apt purge hemmet

# Städa bort databasen också (inte hanterat av paketet)
sudo -u postgres dropdb --if-exists hemmet
sudo -u postgres dropuser --if-exists hemmet
```

## Utvecklingsmiljö

### Förutsättningar

- Node.js 20+
- PostgreSQL 14+ (native eller containeriserad via Docker/Podman)

### Kom igång

```bash
git clone git@github.com:rAgamemnon74/hemmet.git
cd hemmet
make setup    # npm install + start container-DB + migrate + seed
make dev      # Next.js dev-server på http://localhost:3000
```

Kommandon:

```bash
make help     # Visa alla
make status   # Vad kör för tillfället
make db-reset # Radera och återskapa DB med seed
make stop     # Stoppa dev-server + DB
```

### Testanvändare (dev-seed)

Alla har lösenord `password123`:

| E-post | Roll |
|---|---|
| `admin@hemmet.se` | Admin |
| `ordforande@hemmet.se` | Ordförande |
| `sekreterare@hemmet.se` | Sekreterare |
| `kassor@hemmet.se` | Kassör |
| `forvaltning@hemmet.se` | Förvaltningsansvarig |
| `miljo@hemmet.se` | Miljöansvarig |
| `ledamot@hemmet.se` | Ledamot |
| `suppleant@hemmet.se` | Suppleant |
| `revisor@hemmet.se` | Revisor |
| `medlem@hemmet.se` | Medlem |
| `boende@hemmet.se` | Boende |

### Projektstruktur

```
hemmet/
├── prisma/
│   ├── schema.prisma        # 74 modeller, 57 enums
│   ├── migrations/          # 8 migrations
│   ├── seed.ts              # Dev-seed (testanvändare)
│   └── brfs/                # BRF-YAML-loader
│       ├── schema.ts        # Zod-schema för mall-YAML
│       ├── loader.ts        # Idempotent import-funktion
│       ├── cli.ts           # CLI-entry
│       └── example-brf.yaml # Fiktiv referensmall
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, register
│   │   ├── (dashboard)/     # 67 autentiserade sidor
│   │   │   ├── styrelse/    # Möten, beslut, protokoll, utlägg
│   │   │   ├── forvaltning/ # Komponenter, besiktningar, leverantörer
│   │   │   ├── boende/      # Felanmälan, förslag, bokning
│   │   │   ├── medlem/      # Motioner, register, lägenheter
│   │   │   ├── revision/    # Årsrevision
│   │   │   ├── miljo/       # Miljömodul
│   │   │   └── installningar/ # Konfiguration
│   │   └── api/             # Auth + tRPC + dokument-upload/download
│   ├── server/trpc/routers/ # 40 API-routrar
│   ├── lib/
│   │   ├── permissions.ts   # 15 roller, 44 permissions
│   │   ├── rules.ts         # BrfRules cache
│   │   ├── agenda-templates.ts
│   │   ├── agenda-snippets.ts  # Context-aware snabbtext per specialType
│   │   ├── resource-defaults.ts # Bokningsresurs-defaults per typ
│   │   ├── protocol-header.ts   # Protokollhuvud-konfig
│   │   ├── markdown-to-docx.ts  # Docx-generering
│   │   └── validators/      # Zod-schemas
│   └── components/meeting/  # Möteskomponenter (attachment-viewer, calendar)
├── packaging/               # .deb-byggstöd (systemd, postinst, admin-kommandon)
├── scripts/                 # Build, version-bump, GDPR-gallring
├── docs/                    # Analyser och rollstudier
├── local/                   # Persondata (gitignored) — riktig förenings-YAML
└── CHANGELOG.md
```

## Bygg eget .deb-paket

Cross-build från x86_64 Linux/WSL till arm64 (Raspberry Pi). Allt som behövs är Node 20+, Prisma's arm64-binärer (bundlas automatiskt) och `dpkg-deb` (standard på Debian/Ubuntu).

```bash
# Säkerställ att Prisma-klienten har arm64-binär
npx prisma generate

# Bygg paketet — producerar dist/hemmet_<version>_arm64.deb
bash scripts/build-deb.sh
```

Utdata:

```
▶ Hemmet .deb build — version 1.0.0-rc1 → hemmet_1.0.0~rc1_arm64.deb
▶ Rensar dist/
▶ Genererar Prisma-klient
▶ Bygger Next.js (standalone)
▶ Resolverar produktionsdeps via npm ls
  89 paket kopierade (totalt i trädet: 144)
▶ Kopierar app-filer till dist/hemmet_1.0.0~rc1_arm64/opt/hemmet
▶ Staging klart: 300M
▶ Bygger .deb
✓ Paket klart: dist/hemmet_1.0.0~rc1_arm64.deb (121M)
```

### Deploy till server

```bash
scp dist/hemmet_1.0.0~rc1_arm64.deb server:/tmp/
ssh server 'sudo apt install -y /tmp/hemmet_1.0.0~rc1_arm64.deb'
```

## BRF-YAML-import

Snabbgrundladdning av en hel förening från YAML-mall — föreningsnamn, stadgeregler, fastighet, lägenheter, bokningsresurser, styrelse, valberedning, revisor.

### Format

Se `prisma/brfs/example-brf.yaml` (fiktiv mall) för fullständig struktur. Kortversion:

```yaml
schema: "1.0"
settings:
  name: "Brf Testvägen"
  orgNumber: "123456-7890"
  seat: "Stockholm"
  address: "Testvägen 1"
  city: "Stockholm"
  postalCode: "111 11"
rules:
  affiliation: NONE             # HSB | RIKSBYGGEN | SBC | OTHER | NONE
  minBoardMembers: 3
  maxBoardMembers: 7
  # ...
buildings:
  - name: "Hus A"
    address: "Testvägen 1"
    constructionYear: 2005
    apartmentCount: 15          # → genererar placeholders "1-01" till "1-15"
bookableResources:
  - name: "Bastu"
    type: SAUNA
    description: "..."
    overrides:
      maxDurationHours: 2
    slotsPerDay:                # expanderas till alla 7 veckodagar
      - { start: "07:00", end: "09:00" }
board:
  - { firstName: "Anna", lastName: "Andersson", role: BOARD_CHAIRPERSON, address: "Testvägen 1" }
# ... nominatingCommittee, auditor, protocolHeader
```

### Import via CLI

```bash
# Lokalt (dev)
npm run brf:load -- local/brfs/min-forening.yaml           # dry-run
npm run brf:load -- --apply local/brfs/min-forening.yaml   # skriv

# På brunkan (prod)
scp min-forening.yaml server:/tmp/
ssh server 'sudo hemmet-import-brf --apply /tmp/min-forening.yaml'
ssh server 'rm /tmp/min-forening.yaml'
```

### Import via admin-UI

`/installningar` → **Importera**-fliken:

1. Klistra in YAML i textrutan eller ladda upp `.yaml`-fil
2. Klicka **Validera (dry-run)** — visar vad som skulle skapas/uppdateras
3. Granska och klicka **Importera** — skriver till databasen

Importen är **idempotent** — samma fil kan köras flera gånger utan dubbletter.

## Versionering

Semver (`MAJOR.MINOR.PATCH[-suffix]`). `VERSION`-filen i repo-roten är autoritativ.

```bash
# Dev-bygge mellan releases — automatisk +dev.<sha>-suffix
bash scripts/build-deb.sh
# → hemmet_1.0.0-rc1+dev.a1b2c3d_arm64.deb

# Bumpa version för ny release
bash scripts/bump-version.sh patch       # 1.0.0 → 1.0.1
bash scripts/bump-version.sh minor       # 1.0.0 → 1.1.0
bash scripts/bump-version.sh major       # 1.0.0 → 2.0.0
bash scripts/bump-version.sh release     # 1.0.0-rc1 → 1.0.0 (ta bort pre-release-suffix)
bash scripts/bump-version.sh 1.2.0-rc2   # explicit version (stöd för suffix)

# Uppdatera CHANGELOG.md, commit och tagga
git add VERSION CHANGELOG.md
git commit -m "Release 1.0.0"
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin main --tags

# Clean release-bygge
bash scripts/build-deb.sh
# → hemmet_1.0.0_arm64.deb (utan dev-suffix)
```

## Roller och behörigheter

15 roller, 44 permissions, hierarkisk RBAC.

**Styrelse:**

| Roll | Huvuduppdrag |
|---|---|
| `ADMIN` | Full teknisk åtkomst |
| `BOARD_CHAIRPERSON` | Möten, utslagsröst, firmateckning |
| `BOARD_SECRETARY` | Möten, dagordning, protokoll |
| `BOARD_TREASURER` | Utlägg, avgifter, ekonomi |
| `BOARD_PROPERTY_MGR` | Felanmälningar, komponenter, besiktningar |
| `BOARD_ENVIRONMENT` | Miljömodul |
| `BOARD_EVENTS` | Evenemang och gemensamhet |
| `BOARD_MEMBER` | Styrelsearbete utan specialansvar |
| `BOARD_SUBSTITUTE` | Läsrättigheter, inträder vid jäv/frånvaro |

**Granskning:**

| Roll | Huvuduppdrag |
|---|---|
| `AUDITOR` | Revisionsrapport, granska ekonomi/protokoll |
| `AUDITOR_SUBSTITUTE` | Läsåtkomst |

**Förening:**

| Roll | Huvuduppdrag |
|---|---|
| `NOMINATING_COMMITTEE` | Hantera nomineringar |
| `NOMINATING_COMMITTEE_CHAIR` | Finalisera förslag |

**Grund:**

| Roll | Huvuduppdrag |
|---|---|
| `MEMBER` | Motioner, rösta, nomineringsförslag |
| `RESIDENT` | Felanmälan, förslag, bokning |

## Dokumentation och analyser

Katalogen `docs/` innehåller djupanalyser som ligger till grund för systemets design.

### Rollanalyser

| Dokument | Innehåll |
|---|---|
| [Ordföranderollen](docs/ORDFORANDE_ROLLEN.md) | 24 permissions, utslagsröst, firmateckning, prioriterade åtgärder |
| [Sekreterarrollen](docs/SEKRETERAR_ROLLEN.md) | Protokollsignering, kallelsehantering |
| [Kassörrollen](docs/KASSOR_ROLLEN.md) | Utläggsattest, budget, avgifter, kvitton |
| [Fastighetsansvarig](docs/FASTIGHETSANSVARIG_ROLLEN.md) | Felanmälan, underhållsplan (K3), besiktningskalender |
| [Revisorsrollen](docs/REVISOR_ROLLEN.md) | Förtroendevald vs auktoriserad, granskningsomfång |
| [Valberedaren](docs/VALBEREDARE_ROLLEN.md) | Föreningsroll, datamodell, oberoendekrav |
| [Ledamotrollen](docs/LEDAMOT_ROLLEN.md) | Styrelsearbete utan specialansvar |

### Juridik och compliance

| Dokument | Innehåll |
|---|---|
| [Lagrum och GDPR](docs/BRF_SYSTEM_LAGRUM.md) | 17 tillämpliga lagar, GDPR, K3-krav 2026, EPBD energi, gallring |
| [Jäv — praktisk analys](docs/JAV_PRAKTISK_ANALYS.md) | Beslutförhet vid jäv, sårbarhetstabell, suppleant-inträde |

### Processer och organisation

| Dokument | Innehåll |
|---|---|
| [BRF-processer](docs/BRF_PROCESSER.md) | ~50 processer, processkarta per roll, prioriteringsmatris |
| [Styrelsekrav](docs/STYRELSEN_KRAV.md) | 8 roller, integrationsmatris, 10 juridiska fallgropar |
| [BRF som företag](docs/BRF_SOM_FORETAG.md) | Styrning vs drift, äkta/oäkta, hyresavtal |
| [Dödsfall](docs/BRF_DODSFALL.md) | Verifiering, dödsborepresentant, ärendetyp |
| [Överlåtelseprocess](docs/OVERLATELSE_PROCESS.md) | 7 typer, 5-stegs-flöde, TransferCase-modell |

### CX/UX-analyser

| Dokument | Innehåll |
|---|---|
| [Styrelsemöte CX/UX](docs/CX_UX_STYRELSEMOTE.md) | Mötesresan: före, under, efter |
| [Flöden](docs/CX_UX_FLODEN.md) | 7 användarresor, saknade UI-sidor |
| [Störningshantering](docs/CX_UX_STORNINGSHANTERING.md) | Perspektiv, ansvarskedja, anmälarmissbruk |
| [Årshjulet](docs/CX_UX_ARSHJUL.md) | Vertikal tidslinje i dashboard |

### Stadgeanalys

| Dokument | Innehåll |
|---|---|
| [Gapanalys stadgar vs plattform](docs/gap-analysis.md) | Systematisk genomgång av stadgekrav och systemstöd |
| [Jämförelse 10 BRF-stadgar](docs/stadgar-comparison.md) | HSB, Riksbyggen, fristående — gemensamma parametrar |

### E-postflöden

Under `docs/EPOST*.md` — flödesanalyser för e-postintegration (IMAP/SMTP, ärendetyper, fakturabedrägeri-kontroll, förvaltare, kassör, motioner, upphandling).

## Licens

MIT — se [LICENSE](LICENSE).
