# Analys: Fastighetsansvarigrollen i Hemmet

## Vad som fungerar idag

### Permissions

BOARD_PROPERTY_MGR har BOARD_COMMON (24 permissions) plus:
- `report:manage` — hanterar felanmälningsstatus och resolution
- `contract:manage` — avtal (CRUD, ramavtal, avrop)
- `procurement:manage` — upphandlingar (offerter, jämförelse, beslut)
- `contractor:manage` — leverantörsregister (kontaktpersoner, F-skatt, försäkring)

Delar `report:manage` med BOARD_CHAIRPERSON och ADMIN.
Delar `contract:manage`, `procurement:manage`, `contractor:manage` med BOARD_CHAIRPERSON, BOARD_SECRETARY och BOARD_TREASURER.

### Felanmälningshantering

Fullt flöde implementerat:
- **SUBMITTED** -> **ACKNOWLEDGED** -> **IN_PROGRESS** -> **RESOLVED** -> **CLOSED**
- Kan ändra status, lägga till resolution-text, kommentera (publikt och internt)
- Interna kommentarer (dolda för boende) stöds
- Allvarlighetsnivåer: LOW, NORMAL, HIGH, CRITICAL
- Platskategorier: Trapphus, Tvättstuga, Cykelrum, Källare, Garage, Innergård, Tak, Fasad, Hiss, Entré, Soprum, Övrigt
- Koppling till lägenhet (valfritt — gemensamma utrymmen har `apartmentId: null`)

### Underhållsplan och komponentregister (K3-krav)

Fullständigt implementerat i `BuildingComponent`-modellen:
- **Komponentregister** per byggnad med kategorier (TAK, STAMMAR, FONSTER, FASAD, HISS, EL, VVS, VENTILATION m.fl.)
- **Livscykelspårning:** installationsår, förväntad livslängd, skick (GOOD/FAIR/POOR/CRITICAL), planerat åtgärdsår, beräknad kostnad
- **Gap-analys** (`property.gapAnalysis`) identifierar automatiskt: saknade kategorier, komponenter som passerat livslängd, kritiskt skick, saknade kostnadsuppskattningar
- Koppling till besiktningar via `Inspection`-relationen

Router: `src/server/trpc/routers/property.ts`

### Besiktningskalender

Fullständigt implementerat i `Inspection`-modellen:
- **9 besiktningstyper:** OVK, HISS (ELEVATOR), BRAND (FIRE_SAFETY), ENERGI (ENERGY), RADON, LEKPLATS (PLAYGROUND), CISTERN, KOMPONENT (COMPONENT), ÖVRIGT (OTHER)
- **Statusspårning:** scheduledAt, completedAt, result (APPROVED, APPROVED_WITH_REMARKS, FAILED, PENDING)
- **Nästa besiktningsdatum** (`nextDueAt`) med index för snabb sökning
- **Försenade besiktningar** identifieras via `property.getOverdueInspections`
- Koppling till byggnad och valfritt till specifik komponent
- Bilagor via `InspectionAttachment` (samt generisk `Attachment`-modell)

| Besiktning | Lagkrav | Intervall | Status i Hemmet |
|-----------|---------|-----------|:---------------:|
| OVK (ventilation) | PBL + BFS | 3-6 år beroende på typ | Implementerat |
| Hissbesiktning | AFS 2003:6 | Årlig | Implementerat |
| Brandskydd (SBA) | LSO 2003:778 | Löpande egenkontroll | Implementerat |
| Energideklaration | Lag 2006:985 | 10 år | Implementerat |
| Radonmätning | Miljöbalken | Vid behov / egenkontroll | Implementerat |
| Lekplatsbesiktning | SS-EN 1176 | Årlig | Implementerat |
| Cisternkontroll | NFS 2021:10 | 6/12 år | Implementerat |

Router: `src/server/trpc/routers/property.ts`

### Entreprenad- och leverantörshantering

Tre sammankopplade modeller:

**Contractor** (leverantörsregister):
- Fullständig CRUD med kategori (PLUMBER, ELECTRICIAN, LOCKSMITH, PAINTER m.fl.)
- Organisationsdata: org-nummer, moms-nummer, DUNS
- Skatt och juridik: F-skattsedel, momsregistrering, ansvarsförsäkring med giltighetstid
- PUB-avtal (GDPR art. 28) med status och giltighetstid
- Flera kontaktpersoner per leverantör (`ContractorContact` med roll, primär-markering)
- Betyg och anteckningar

**Contract** (avtalsregister):
- Status: DRAFT, ACTIVE, RENEWAL_PENDING, EXPIRING, EXPIRED, TERMINATED
- Kategorier: SERVICE, INSURANCE, FINANCIAL, CONSTRUCTION, CONSULTING, IT, ENERGY, WASTE, OTHER
- Ramavtal med årstak och avrop (`ContractCallOff`)
- Ekonomi: årskostnad, totalvärde, betalningsvillkor
- Uppsägningstid, automatisk förlängning, förhandlingspåminnelse
- Koppling till leverantör (valfritt — fritext som fallback)

**Procurement** (upphandlingar):
- 13-stegsflöde: NEED -> NEED_DEFERRED -> RFQ_DRAFT -> RFQ_SENT -> QUOTES_IN -> EVALUATION -> DECISION_PENDING -> APPROVED -> REJECTED -> CONTRACT_SIGNED -> IN_PROGRESS -> COMPLETED -> CANCELLED
- Offerter (`ProcurementQuote`) med belopp, villkor, garanti, betalningssätt, intern bedömning
- Anteckningar (`ProcurementNote`) per upphandling
- Koppling till budget, mandatnivå, styrelsebeslut, avtal och leverantör

Routrar: `src/server/trpc/routers/contractor.ts`, `src/server/trpc/routers/contract.ts`, `src/server/trpc/routers/procurement.ts`

### Fastighets-dashboard (delvis implementerat)

- `dashboard.propertyOverview` visar samlad vy för fastighetsansvarig och admin
- Försenade besiktningar visas på huvuddashboarden
- Avtal som snart löper ut visas på huvuddashboarden

### Möteskontext

- Deltar i möten med `meeting:view`/`meeting:vote`
- Dagordningsmallen har "Fastighetsförvaltning" (15 min) — "Pågående och planerade underhållsåtgärder, felanmälningar"
- Kan inte skapa möten eller tilldela mötesroller

### Övriga förmågor

- Kan skapa och tilldela uppgifter (`task:create`, `task:assign`)
- Kan svara på boendeförslag (`suggestion:respond`)
- Kan ladda upp dokument (`document:upload`)
- Kan svara på motioner (`motion:respond`)
- Kan redigera årsredovisning (`annual_report:edit`)

## Kvarvarande brister

### 1. Felanmälningen saknar djup

Grundflödet fungerar men saknar:
- **Kostnadsuppskattning** — inget fält för beräknad reparationskostnad
- **SLA/svarstider** — ingen bevakning av hur lång tid det tar att hantera ärenden
- **Koppling till underhållsplan** — en felanmälan om läckande tak borde trigga granskning av takkomponenten
- **Ärendehistorik per lägenhet** — ingen vy som visar alla ärenden för en specifik lägenhet
- **Prioriterad kö** — ingen vy sorterad efter allvarlighet och ålder
- **Automatisk eskalering** — inga varningar om ärenden som legat länge utan åtgärd

### 2. Byggnadsadministration — utestängd

- Fastighetsansvarig kan INTE redigera byggnadsdata (`admin:settings` krävs)
- Kan inte uppdatera `Building`-information (konstruktionsår, uppvärmning, energiklass)
- Kan inte hantera `Apartment`-data (area, rum, förråd, parkering)
- Kan inte ens SE föreningens inställningar (`admin:integrations` saknas)

### 3. IoT och energidata — saknas helt

- Ingen integration med värmesystem, energimätare, vattenläckagevakter
- Ingen energiförbrukningsdata (EPBD-krav 2026)
- Ingen automatiserad övervakning eller larm
- `Building.heatingType` finns som textfält men är oanvänt

### 4. Uppgifter saknar koppling till felanmälningar

- `Task`-modellen kan kopplas till `Decision` men inte till `DamageReport`
- Fastighetsansvarig kan inte skapa en uppgift direkt från en felanmälan
- Ingen automatisk uppgiftsgenerering vid statusändring

### 5. Fastighets-dashboard behöver utvidgas

Grundläggande propertyOverview finns, men saknar:
- Samlad skickbedömning av fastigheten (baserat på komponentdata)
- Koppling till ekonomisk uppföljning av fastighetsutgifter
- Underhållsplanens tidslinje (kommande åtgärder visuellt)

## Jämförelse: Fastighetsansvarig vs andra roller

| Förmåga | Fastighetsansvarig | Ordförande | Kassör | Sekreterare |
|---------|:-:|:-:|:-:|:-:|
| Hantera felanmälningar | Y | Y | - | - |
| Skapa möten | - | Y | - | Y |
| Godkänna utlägg | - | Y | Y | - |
| Ändra byggnadsdata | - | - (ADMIN) | - | - |
| Underhållsplan / komponenter | Y | Y | Y | Y |
| Besiktningskalender | Y | Y | Y | Y |
| Entreprenörshantering | Y | Y | Y | Y |
| Avtal och upphandlingar | Y | Y | Y | Y |
| Energiuppföljning | - | - | - | - |

## Prioriterad åtgärdslista

| Prio | Funktion | Status | Varför |
|------|----------|--------|--------|
| ~~1~~ | ~~Komponentregister + underhållsplan~~ | **Implementerat** | BuildingComponent med livscykelspårning och gap-analys |
| ~~2~~ | ~~Besiktningskalender med påminnelser~~ | **Implementerat** | 9 besiktningstyper, förseningsbevakning, bilagor |
| ~~3~~ | ~~Leverantörsregister med avtal~~ | **Implementerat** | Contractor, Contract, Procurement med fullständiga flöden |
| 4 | **Utöka felanmälan** med kostnad och SLA-bevakning | Saknas | Bättre uppföljning och prioritering |
| 5 | **Ge fastighetsansvarig byggnadspermissions** | Saknas | Redigera Building-data utan admin-rättigheter |
| 6 | **Koppling felanmälan -> uppgift** | Saknas | Automatisk uppgiftsgenerering |
| 7 | **Utvidga fastighets-dashboard** | Delvis | Samlad skickvy, underhållstidslinje, ekonomikoppling |
| 8 | **Energiuppföljning** | Saknas | EPBD-krav, energiförbrukningsdata |
| 9 | **Ärendehistorik per lägenhet** | Saknas | Alla felanmälningar, renoveringar, ägarbyte |
