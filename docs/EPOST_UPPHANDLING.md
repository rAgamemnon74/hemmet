# E-postintegration — Upphandlingar

Upphandling är den mest e-postintensiva processen i en BRF efter överlåtelser. Den saknar helt stöd i systemet idag.

---

## Problemet

Typisk upphandling i en BRF idag:

1. Besiktning visar att taket behöver åtgärdas
2. Förvaltaren mejlar 3 takfirmor: "kan ni titta och ge offert?"
3. Firmorna svarar (efter påminnelse) med offerter som PDF
4. Förvaltaren jämför i ett Excel-ark eller i huvudet
5. Styrelsen beslutar på ett möte — "vi kör på Takspecialisten"
6. Förvaltaren mejlar bekräftelse
7. Arbete utförs, faktura kommer
8. Kassören betalar — kopplingen till upphandlingen är borta
9. Vid styrelsebyte: "varför valde vi Takspecialisten? Vad kostade det?"

**Allt lever i förvaltarens privata inbox.** Ingen spårbarhet, inget beslutsunderlag, ingen historik.

---

## Upphandlingstyper i en BRF

| Typ | Exempel | Frekvens | Belopp | Beslutsnivå |
|-----|---------|----------|--------|-------------|
| **Löpande underhåll** | VVS-reparation, låsbyte, lampbyte | Hög | < 10 000 kr | Förvaltare själv |
| **Planerat underhåll** | Fasadmålning, fönsterbyte, stamrenovering | Låg | 100 000–10 Mkr | Styrelsebeslut, ev. stämmobeslut |
| **Akut åtgärd** | Vattenläcka, hisstopp, inbrott | Medium | Varierande | Förvaltare akut, styrelse i efterhand |
| **Avtal/service** | Hisservice, trädgård, städ, snöröjning | Årligen | 10 000–100 000 kr/år | Styrelsebeslut |
| **Konsulttjänst** | Energideklaration, OVK, juridik, revision | Periodiskt | 5 000–50 000 kr | Styrelsebeslut |
| **Projekt** | Laddstolpar, solceller, gårdsupprustning | Sällsynt | 100 000–5 Mkr | Stämmobeslut |

---

## Upphandlingens livscykel

```
BEHOV → OFFERTFÖRFRÅGAN → OFFERTINSAMLING → JÄMFÖRELSE → BESLUT → BESTÄLLNING → UTFÖRANDE → UPPFÖLJNING
```

### Fas 1: Behov identifieras

**Trigger:**
- Besiktning visar brist (Inspection → Procurement)
- Felanmälan som kräver entreprenör (DamageReport → Procurement)
- Avtal som löper ut (Contractor.contractEndDate → påminnelse)
- Underhållsplan (BuildingComponent → planerat byte)
- Styrelse-/stämmobeslut (Decision → Procurement)

Systemet ska kunna skapa upphandling direkt från dessa ärenden.

### Fas 2: Offertförfrågan (RFQ)

Förvaltaren skriver en förfrågan och skickar till 2–5 leverantörer.

```
┌─ Skapa offertförfrågan ────────────────────────────────┐
│                                                         │
│  Titel: [Ommålning fasad byggnad A               ]     │
│                                                         │
│  Beskrivning av arbetet:                                │
│  [Ommålning av tegelfasad, ca 800 kvm.              ]  │
│  [Befintlig färg: Falu rödfärg. Ställning krävs.    ]  │
│                                                         │
│  Kopplad till:                                          │
│  ● Besiktning #15 "Fasadbesiktning 2025"               │
│  ● Komponent: Fasad Byggnad A (nästa åtgärd: 2026)     │
│                                                         │
│  Sista svarsdag: [2026-05-15            ]               │
│                                                         │
│  Önskade uppgifter i offert:                            │
│  ☑ Fast pris                                           │
│  ☑ Tidsplan (start/slut)                               │
│  ☑ Garantitid                                          │
│  ☑ Referensobjekt                                      │
│  ☐ Besiktning före offert (platsbesök)                 │
│                                                         │
│  Bilagor:                                               │
│  📎 fasadbesiktning_2025.pdf                           │
│  📎 fasad_foton.zip                                    │
│                                                         │
│  Skicka till:                                           │
│  ☑ Målare Andersson AB (info@malare-andersson.se)      │
│  ☑ Fasadspecialisten (offert@fasadspec.se)              │
│  ☑ Bygg & Färg AB (kontakt@byggofarg.se)               │
│  [+ Lägg till leverantör]                              │
│                                                         │
│  [Förhandsgranska mail]  [Spara utkast]  [Skicka]     │
└─────────────────────────────────────────────────────────┘
```

**E-post som skickas:**

```
Från: forvaltning@brfexempel.se
Till: info@malare-andersson.se
Ämne: Offertförfrågan — ommålning fasad, BRF Exempelgården

Hej,

BRF Exempelgården söker offert för ommålning av tegelfasad
på Storgatan 1A (byggnad A), ca 800 kvm.

Befintlig färg: Falu rödfärg. Ställning krävs.
Se bifogad besiktningsrapport för detaljer.

Vi önskar:
- Fast pris
- Tidsplan (start- och slutdatum)
- Garantitid
- Referensobjekt (gärna flerbostadshus)

Sista dag för offert: 2026-05-15.

Vid frågor, kontakta oss på detta mail eller ring
förvaltare Erik Larsson: 070-XXX XXXX.

Med vänliga hälsningar,
Förvaltning, BRF Exempelgården

📎 fasadbesiktning_2025.pdf
📎 fasad_foton.zip
```

Reply-To: `forvaltning+uph_abc123@brfexempel.se` — svar hamnar automatiskt i upphandlingsärendet.

### Fas 3: Offertinsamling

Offerter anländer via e-post. Systemet kopplar automatiskt via plus-adress eller manuellt.

```
┌─ Upphandling: Ommålning fasad A ──────────────────────┐
│                                                         │
│  Status: Offertinsamling (3 förfrågade, 2 mottagna)    │
│  Sista svarsdag: 2026-05-15 (8 dagar kvar)             │
│                                                         │
│  Offerter:                                              │
│  ┌────────────────────────────────────────────────┐     │
│  │ ✅ Målare Andersson AB          mottagen 05-03 │     │
│  │    Belopp: 285 000 kr (inkl. moms)             │     │
│  │    Tidsplan: jun–aug 2026 (8 veckor)           │     │
│  │    Garanti: 5 år                               │     │
│  │    📎 offert_fasad_andersson.pdf               │     │
│  ├────────────────────────────────────────────────┤     │
│  │ ✅ Fasadspecialisten             mottagen 05-07 │     │
│  │    Belopp: 342 000 kr (inkl. moms)             │     │
│  │    Tidsplan: aug–okt 2026 (10 veckor)          │     │
│  │    Garanti: 10 år                              │     │
│  │    📎 offert_fasadspec_2026.pdf                │     │
│  ├────────────────────────────────────────────────┤     │
│  │ ⏳ Bygg & Färg AB               inväntar       │     │
│  │    Förfrågan skickad: 2026-05-01               │     │
│  │    [Skicka påminnelse]                         │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### Fas 4: Jämförelse

```
┌─ Offertjämförelse ─────────────────────────────────────┐
│                                                         │
│  Upphandling: Ommålning fasad A                         │
│                                                         │
│  │ Kriterium          │ Andersson   │ Fasadspec.  │     │
│  │────────────────────│─────────────│─────────────│     │
│  │ Pris               │ 285 000 kr  │ 342 000 kr  │     │
│  │ Pris/kvm           │ 356 kr      │ 428 kr      │     │
│  │ Tidsplan           │ 8 veckor    │ 10 veckor   │     │
│  │ Period             │ jun–aug     │ aug–okt     │     │
│  │ Garanti            │ 5 år        │ 10 år       │     │
│  │ Referensobjekt     │ 2 st        │ 5 st        │     │
│  │ Känd leverantör    │ Nej (ny)    │ Ja (sedan   │     │
│  │                    │             │ 2020)       │     │
│  │ F-skatt            │ ✅          │ ✅          │     │
│  │────────────────────│─────────────│─────────────│     │
│                                                         │
│  Förvaltarens kommentar:                                │
│  [Andersson är billigast men ny för oss. Fasad-     ]  │
│  [specialisten dyrare men lång garanti och vi har    ]  │
│  [goda erfarenheter. Rekommenderar Fasadspec.        ]  │
│                                                         │
│  [Exportera jämförelse (PDF)]                          │
│  [Lägg till på dagordning styrelsemöte]                │
└─────────────────────────────────────────────────────────┘
```

### Fas 5: Beslut

Styrelsebeslut kopplas till upphandlingen:
- Upphandlingen kopplas till `Decision` via styrelsemöte
- Vald leverantör markeras
- Motivering dokumenteras (viktigt vid jävsfrågor)
- ActivityLog: "Upphandling: Fasadspec. valdes — lägsta totalkostnad med garanti"

### Fas 6: Beställning

Systemet skapar utkast till beställningsbekräftelse:

```
Från: forvaltning@brfexempel.se
Till: offert@fasadspec.se
Ämne: Beställning — ommålning fasad Storgatan 1A

Hej,

Vi vill härmed beställa ommålning av fasad byggnad A
enligt er offert daterad 2026-05-07.

Omfattning: Tegelfasad ca 800 kvm, Falu rödfärg
Avtalat pris: 342 000 kr inkl. moms
Tidsplan: aug–okt 2026
Garanti: 10 år

Kontaktperson: Erik Larsson, förvaltningsansvarig
070-XXX XXXX

Faktura skickas till: ekonomi@brfexempel.se
Referens: UPH-2026-003

Med vänliga hälsningar,
Förvaltning, BRF Exempelgården
```

### Fas 7: Utförande och uppföljning

Under utförande:
- Kommunikation med entreprenör trådar via upphandlingsärendet
- Foton/statusrapporter kan bifogas
- Kassören ser upphandlingen när fakturan kommer: "Faktura 342 000 kr från Fasadspecialisten → kopplad till UPH-2026-003 ✅"

### Fas 8: Slutförd

- Arbete godkänt av förvaltaren
- Slutfaktura betald
- Garantiperiod startar (bevakat automatiskt)
- Entreprenören får uppdaterad historik i Contractor-registret

---

## Datamodell

```prisma
enum ProcurementStatus {
  DRAFT                // Under utformning
  RFQ_SENT             // Offertförfrågan skickad
  COLLECTING_QUOTES    // Offerter inkommer
  COMPARING            // Jämförelse pågår
  DECISION_PENDING     // Inväntar styrelsebeslut
  ORDERED              // Beställd
  IN_PROGRESS          // Arbete pågår
  COMPLETED            // Slutfört och godkänt
  CANCELLED            // Avbruten
}

model Procurement {
  id              String   @id @default(cuid())
  title           String
  description     String   @db.Text
  status          ProcurementStatus @default(DRAFT)
  
  // Budget
  estimatedCost   Float?               // Uppskattad kostnad
  actualCost      Float?               // Faktisk slutkostnad
  budgetApproved  Boolean @default(false)
  
  // Tidplan
  rfqSentAt       DateTime?            // När förfrågan skickades
  quotesDeadline  DateTime?            // Sista dag för offert
  plannedStart    DateTime?
  plannedEnd      DateTime?
  actualStart     DateTime?
  actualEnd       DateTime?
  
  // Beslut
  decisionId      String?              // Koppling till styrelsebeslut
  decisionNote    String?  @db.Text    // Motivering till val
  
  // Vald leverantör
  selectedContractorId String?
  selectedQuoteId      String?
  
  // Garanti
  warrantyMonths  Int?
  warrantyExpiry  DateTime?
  
  // Kopplingar — vad som triggade upphandlingen
  inspectionId    String?              // Besiktning som visade brist
  damageReportId  String?              // Felanmälan som kräver åtgärd
  componentId     String?              // K3-komponent som ska underhållas
  
  // Meta
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  createdBy       User       @relation(fields: [createdById], references: [id])
  decision        Decision?  @relation(fields: [decisionId], references: [id])
  selectedContractor Contractor? @relation(fields: [selectedContractorId], references: [id])
  quotes          ProcurementQuote[]
  
  @@index([status])
  @@index([selectedContractorId])
}

model ProcurementQuote {
  id              String   @id @default(cuid())
  procurementId   String
  contractorId    String?              // Känd leverantör (kan vara null för ny)
  
  // Kontaktuppgifter (om ej i Contractor-registret)
  companyName     String
  contactPerson   String?
  contactEmail    String?
  
  // Offertdata
  amount          Float?               // Offererat belopp (inkl. moms)
  amountExVat     Float?               // Exkl. moms
  currency        String   @default("SEK")
  validUntil      DateTime?            // Offertens giltighetstid
  
  // Tidsplan
  proposedStart   DateTime?
  proposedEnd     DateTime?
  leadTimeDays    Int?                 // Leveranstid i dagar
  
  // Villkor
  warrantyMonths  Int?
  paymentTerms    String?              // "30 dagar netto"
  conditions      String?  @db.Text    // Särskilda villkor
  
  // Status
  receivedAt      DateTime?
  status          String   @default("PENDING") // PENDING, RECEIVED, SELECTED, REJECTED
  
  // Bilagor hanteras via generiska Attachment-modellen
  
  createdAt       DateTime @default(now())

  procurement     Procurement @relation(fields: [procurementId], references: [id], onDelete: Cascade)
  contractor      Contractor? @relation(fields: [contractorId], references: [id])
  
  @@index([procurementId])
}
```

---

## E-postflöden

### Inkommande: Offert via e-post

```
Från: offert@fasadspec.se
Ämne: Re: Offertförfrågan — ommålning fasad

→ Auto-kopplad via plus-adress till UPH-2026-003
→ PDF-bilaga sparas som Attachment
→ Kontextpanel visar:
  ✅ Känd leverantör: Fasadspecialisten (sedan 2020)
  📋 Upphandling: Ommålning fasad A
  💰 Belopp identifierat i text/PDF: 342 000 kr
  ⏰ Inom svarstid (deadline 2026-05-15) ✅
```

### Inkommande: Oombedd offert

```
Från: saljare@nyfirma.se
Ämne: Erbjudande fasadmålning till BRF Exempelgården

→ INTE kopplad till upphandling (ingen plus-adress)
→ Systemet noterar: pågående upphandling "Ommålning fasad A"
→ Frågar: "Ska detta mail kopplas till upphandlingen?"
  [Koppla till UPH-2026-003]  [Nej, separat]
```

### Utgående: Påminnelse

```
Automatisk påminnelse 3 dagar före deadline:

Från: forvaltning@brfexempel.se
Till: kontakt@byggofarg.se
Ämne: Påminnelse — offertförfrågan ommålning fasad

Hej,

Vi vill påminna om vår offertförfrågan avseende
ommålning av fasad, skickad 2026-05-01.

Sista dag för offert: 2026-05-15.

Med vänliga hälsningar,
Förvaltning, BRF Exempelgården
```

### Utgående: Tack-men-nej

Till leverantörer som inte valdes:

```
Från: forvaltning@brfexempel.se
Till: info@malare-andersson.se
Ämne: Re: Offertförfrågan — ommålning fasad

Hej,

Tack för er offert avseende fasadmålning. Vi har
beslutat att gå vidare med en annan leverantör
denna gång.

Vi sparar gärna era uppgifter för framtida behov.

Med vänliga hälsningar,
Förvaltning, BRF Exempelgården
```

---

## Kopplingar till befintliga ärenden

### Besiktning → Upphandling

```
Besiktning #15 "Fasadbesiktning 2025"
  Resultat: Ommålning krävs inom 12 mån
  → [Skapa upphandling från besiktning]
  → Upphandling UPH-2026-003 skapas med:
     - Beskrivning förifyld från besiktningsanmärkning
     - Komponent: Fasad Byggnad A
     - Besiktningsrapport bifogad automatiskt
```

### Felanmälan → Upphandling

```
Felanmälan #142 "Vattenläcka källare B"
  Akut åtgärd → ringer VVS-jour direkt
  → [Registrera som upphandling i efterhand]
  → Upphandling skapas med status ORDERED (redan beställd)
  → Dokumenterar: vem kontaktades, varför akut, belopp
```

### Underhållsplan → Upphandling

```
Komponentregister:
  Fasad Byggnad A — nästa åtgärd: 2026
  Hiss 1–3 — serviceavtal löper ut: 2026-12-31
  
  → Automatisk påminnelse: "3 komponenter behöver upphandling 2026"
  → [Skapa upphandling] för varje
```

### Upphandling → Expense

```
Faktura från Fasadspecialisten: 342 000 kr
  → Auto-koppling: UPH-2026-003
  → Jämförelse: offert 342 000 kr ↔ faktura 342 000 kr ✅
  → Expense skapas med upphandlingsreferens
```

### Upphandling → Styrelsebeslut

```
Styrelsemöte 2026-05-22, §14:
  "Styrelsen beslutar att anta Fasadspecialistens offert
   om 342 000 kr för ommålning av fasad byggnad A."
  → Decision kopplas till UPH-2026-003
  → Jävskontroll: ingen styrelsemedlem kopplad till leverantören ✅
```

---

## Jävskoppling

Upphandlingar är den vanligaste jävssituationen i en BRF. Systemet ska:

1. Vid offertjämförelse: kontrollera om någon styrelsemedlem har koppling till offerande leverantör (via `ConflictOfInterest`-modellen)
2. Vid beslut: logga vilka som deltog och att ingen jävig person röstade
3. Flagga: "Styrelseledamot X äger aktier i Målare Andersson AB" (om registrerat)

```
⚠ Jävskontroll:
  Styrelseledamot Erik Larsson (förvaltningsansvarig)
  har registrerat intressekonflikt med:
  Målare Andersson AB — "min svåger driver firman"
  
  Erik bör inte delta i beslutet om denna upphandling.
```

---

## Garantibevakning

Efter slutförd upphandling bevakas garantin:

```
Garantiregister:
  Fasadmålning Byggnad A
    Leverantör: Fasadspecialisten
    Garanti: 10 år (t.o.m. 2036-10-30)
    Upphandling: UPH-2026-003
    
  Påminnelse:
    - 6 mån före garantiutgång: "Kontrollera fasaden"
    - Vid garantiutgång: "Garanti har löpt ut"
    
  Vid ny felanmälan om fasaden:
    → Systemet noterar: "Fasaden har aktiv garanti (Fasadspecialisten, t.o.m. 2036)"
    → Förvaltaren kontaktar leverantören istället för ny upphandling
```

---

## Roller och behörigheter

| Åtgärd | Förvaltare | Ordförande | Kassör | Ledamot |
|--------|------------|------------|--------|---------|
| Skapa upphandling | ✅ | ✅ | ✅ | ✅ |
| Skicka offertförfrågan | ✅ | ✅ | — | — |
| Registrera mottagen offert | ✅ | ✅ | — | — |
| Skapa offertjämförelse | ✅ | ✅ | — | — |
| Besluta (inom delegation) | ✅ (< gräns) | ✅ | — | — |
| Besluta (styrelsebeslut) | Via möte | Via möte | Via möte | Via möte |
| Beställa | ✅ | ✅ | — | — |
| Godkänna utfört arbete | ✅ | ✅ | — | — |
| Betala faktura | — | — | ✅ | — |
| Se alla upphandlingar | ✅ | ✅ | ✅ | ✅ (läs) |

---

## Inkorg-integration

### Vilken inkorg?

| Upphandlingsfas | Primär inkorg | Kopia |
|-----------------|---------------|-------|
| Offertförfrågan (utgående) | Förvaltning | — |
| Offert (inkommande) | Förvaltning | — |
| Faktura kopplad till upphandling | Ekonomi | Förvaltning (FYI) |
| Beställningsbekräftelse | Förvaltning | Ekonomi (budgetkontroll) |
| Styrelsebeslut om upphandling | Styrelsen | Förvaltning |

### Taggar

Upphandlingar taggas med:
- `UPH-2026-003` (ärendetagg)
- `offertförfrågan` / `offert` / `beställning` (fastaggar)
- Leverantörsnamn (auto-tagg)
- Komponentnamn om kopplad (auto-tagg)

---

## Implementation

### Datamodell
- [ ] `Procurement`-modell med statusflöde
- [ ] `ProcurementQuote`-modell med offertdata
- [ ] Relationer: Inspection, DamageReport, BuildingComponent, Decision, Contractor
- [ ] Migration

### tRPC-router `procurement.*`
- [ ] `create` — skapa upphandling (från scratch eller från besiktning/felanmälan)
- [ ] `list` — lista med statusfilter
- [ ] `getById` — detalj med offerter och tidslinje
- [ ] `sendRfq` — skicka offertförfrågan (skapar e-postutkast)
- [ ] `addQuote` — registrera mottagen offert
- [ ] `updateQuote` — redigera offertdata
- [ ] `createComparison` — generera jämförelse
- [ ] `selectQuote` — markera vald leverantör + motivering
- [ ] `linkDecision` — koppla till styrelsebeslut
- [ ] `order` — markera som beställd (skapar e-postutkast)
- [ ] `complete` — markera som slutförd
- [ ] `cancel` — avbryt upphandling

### UI
- [ ] Upphandlingslista (`/forvaltning/upphandlingar`)
- [ ] Detaljvy med offertjämförelse
- [ ] Skapa från besiktning/felanmälan/komponent
- [ ] Offertförfrågan-formulär med e-postförhandsgranskning

### E-postintegration
- [ ] Auto-koppling via plus-adressering
- [ ] Offert-parsning (belopp, datum)
- [ ] Oombedd offert → föreslå koppling till pågående upphandling
- [ ] Påminnelse vid deadline
- [ ] Tack-men-nej-mall
- [ ] Beställningsbekräftelse-utkast

### Kopplingar
- [ ] Besiktning → "Skapa upphandling"
- [ ] Felanmälan → "Skapa upphandling"
- [ ] Komponent → "Planerad upphandling"
- [ ] Upphandling → Styrelsebeslut (jävskontroll)
- [ ] Upphandling → Expense (fakturamatchning)
- [ ] Upphandling → Garantibevakning
