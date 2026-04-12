# Avtalshantering — designanalys

## Problemformulering

BRF-styrelser tecknar avtal kontinuerligt men saknar nästan alltid ett samlat register:

- Avtal lever i pärmar, e-postbilagor och förvaltarens privata dropbox
- Ingen vet vilka avtal föreningen har — ny styrelse ärver okänt antal åtaganden
- Uppsägningstider missas → avtal förlängs automatiskt på sämre villkor
- Revisorn frågar "vilka avtal finns?" — kassören gräver i mejl
- Ingen koppling mellan avtal, upphandling och fakturor
- Stämman informeras inte om vilka avtal styrelsen tecknat under året

---

## Styrelsens avtalsbehörighet

### Rättslig grund

Styrelsen ansvarar för föreningens **löpande förvaltning** (LEF 7:4, BrfL). Det innebär rätt att teckna avtal som krävs för normal drift — utan stämmobeslut.

Lagen definierar *inte* exakt gränsen. Bedömningen beror på:

| Faktor | Löpande förvaltning | Kräver stämma |
|--------|--------------------|----|
| **Belopp** | Inom budget / proportionerligt | Väsentligt utöver budget |
| **Typ** | Förnyelse, drift, lagkrav | Nyinvestering, karaktärsändring |
| **Bindningstid** | 1–5 år, normal uppsägningstid | 10+ år, ovanlig bindning |
| **Prejudikat** | Föreningen har haft liknande avtal | Helt ny typ av åtagande |
| **Test** | Rimlig medlem inte förvånad | Rimlig medlem vill bli tillfrågad |

### Mandatnivåer

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  FÖRVALTARE ENSAM (inom delegation)                    │
│  ──────────────────────────────────                    │
│  Akuta reparationer under beloppsgräns                 │
│  Förnyelse av löpande serviceavtal utan villkorsändring│
│  Beställning inom beslutad upphandling                 │
│                                                        │
│  STYRELSEBESLUT (ordinarie möte)                       │
│  ───────────────────────────────                       │
│  Nya serviceavtal (städ, trädgård, snöröjning)         │
│  Hisserviceavtal, bredband, larm                       │
│  Underhållsarbeten inom budget                         │
│  Konsultuppdrag (energi, juridik, ekonomi)             │
│  Försäkringsförnyelse med villkorsändring              │
│                                                        │
│  STÄMMOBESLUT (ordinarie eller extra stämma)           │
│  ───────────────────────────────────────────           │
│  Stamrenovering / storskaligt underhåll                │
│  Lån / omfinansiering                                  │
│  Ny typ av investering (solceller, laddstolpar)        │
│  Avtal med ovanligt lång bindningstid (10+ år)         │
│  Köp/försäljning av fastighet eller mark               │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Gränsbeloppen konfigureras i BrfRules (per förening).

---

## Avtalets livscykel

```
UTKAST → GRANSKNING → AKTIVT → UPPSÄGNINGSPERIOD → LÖPER UT / FÖRNYAT → AVSLUTAT
```

### Statusar

| Status | Beskrivning |
|--------|-------------|
| `DRAFT` | Under förhandling, ej signerat |
| `REVIEW` | Skickat för juridisk/ekonomisk granskning |
| `ACTIVE` | Signerat och giltigt |
| `RENEWAL_PENDING` | Uppsägningsperiod aktiv — förnya eller säg upp |
| `RENEWED` | Automatiskt eller manuellt förnyat |
| `EXPIRING` | Löper ut snart, ingen förlängning |
| `EXPIRED` | Har löpt ut |
| `TERMINATED` | Uppsagt i förtid |

### Livscykeldiagram

```
                ┌──────────┐
                │  DRAFT   │
                └────┬─────┘
                     │ signeras
                ┌────▼─────┐
         ┌──────│  ACTIVE  │──────┐
         │      └────┬─────┘      │
         │           │            │ uppsägs i förtid
         │    uppsägningsperiod   │
         │    börjar              │
    ┌────▼──────────┐    ┌───────▼──────┐
    │ RENEWAL_      │    │ TERMINATED   │
    │ PENDING       │    └──────────────┘
    └───┬───────┬───┘
        │       │
   förnyat   ej förnyat
        │       │
   ┌────▼──┐ ┌──▼─────┐
   │RENEWED│ │EXPIRING │
   │→ACTIVE│ └──┬─────┘
   └───────┘    │ löper ut
           ┌────▼───┐
           │EXPIRED │
           └────────┘
```

---

## Avtalstyper i en BRF

### Driftsavtal (löpande tjänster)

| Avtal | Typisk period | Typisk kostnad/år | Uppsägningstid |
|-------|--------------|-------------------|----------------|
| Hisservice | 3–5 år | 30 000–80 000 kr/hiss | 6–12 mån |
| Städning trapphus | 1–3 år | 50 000–200 000 kr | 3 mån |
| Trädgårdsskötsel | 1 år (säsong) | 30 000–100 000 kr | 3 mån |
| Snöröjning | 1 år (säsong) | 20 000–80 000 kr | 3 mån |
| Larm/bevakning | 2–3 år | 20 000–60 000 kr | 3–6 mån |
| Bredband (kabel-TV) | 3–5 år | 100–400 kr/lgh/mån | 6–12 mån |
| Tvättstuga (maskinleasing) | 5–7 år | 20 000–50 000 kr | 6 mån |
| Porttelefonservice | 2–3 år | 10 000–30 000 kr | 3 mån |
| Skadedjurskontroll | 1 år | 5 000–15 000 kr | 1 mån |
| Ventilationsfilter | 1 år | 10 000–30 000 kr | 1 mån |

### Försäkringar

| Avtal | Period | Typisk kostnad/år |
|-------|--------|-------------------|
| Fastighetsförsäkring | 1 år (auto-förnyelse) | 50 000–300 000 kr |
| Styrelseförsäkring | 1 år | 5 000–20 000 kr |
| Tilläggsförsäkring (brf-tillägg) | 1 år | 10 000–30 000 kr |

### Finansiella avtal

| Avtal | Period | Belopp |
|-------|--------|--------|
| Fastighetslån | 1–10 år (räntebindning) | Mkr |
| Kontoavtal (bank) | Tillsvidare | — |
| Swish (företag) | Tillsvidare | 100–300 kr/mån |

### Förvaltningsavtal

| Avtal | Period | Typisk kostnad/år |
|-------|--------|-------------------|
| Ekonomisk förvaltning (Nabo, Riksbyggen, HSB) | 1–3 år | 50 000–200 000 kr |
| Teknisk förvaltning | 1–3 år | 30 000–150 000 kr |
| Revisionsavtal | 1 år (stämma väljer) | 10 000–40 000 kr |

### Projektavtal (tillfälliga)

| Avtal | Period | Belopp |
|-------|--------|--------|
| Stamrenovering | Projektlängd | Mkr |
| Fasadmålning | Projektlängd | 100 000–500 000 kr |
| Takbyte | Projektlängd | Mkr |
| Energikonsult | Engång | 10 000–50 000 kr |

---

## Datamodell

```prisma
enum ContractStatus {
  DRAFT
  REVIEW
  ACTIVE
  RENEWAL_PENDING
  RENEWED
  EXPIRING
  EXPIRED
  TERMINATED
}

enum ContractCategory {
  SERVICE           // Driftsavtal (hiss, städ, trädgård)
  INSURANCE         // Försäkringar
  FINANCIAL         // Lån, bank
  MANAGEMENT        // Ekonomisk/teknisk förvaltning
  UTILITY           // El, vatten, fjärrvärme, bredband
  PROJECT           // Tillfälliga projektavtal
  CONSULTING        // Konsulttjänster
  OTHER
}

enum ContractMandateLevel {
  DELEGATED         // Förvaltare inom delegation
  BOARD             // Styrelsebeslut
  ANNUAL_MEETING    // Stämmobeslut
}

model Contract {
  id                String          @id @default(cuid())
  title             String          // "Hisserviceavtal KONE 2026–2028"
  description       String?         @db.Text
  status            ContractStatus  @default(DRAFT)
  category          ContractCategory

  // Parter
  contractorId      String?         // Koppling till Contractor-registret
  counterpartyName  String          // Om ej i Contractor: fritext
  counterpartyOrg   String?         // Org.nr motpart
  counterpartyEmail String?
  counterpartyPhone String?

  // Avtalsdokument
  documentUrl       String?         // Länk till signerat avtal i dokumentarkivet
  
  // Ekonomi
  annualCost        Float?          // Årskostnad (för budgetering)
  totalValue        Float?          // Totalt avtalsvärde
  currency          String          @default("SEK")
  paymentTerms      String?         // "Kvartalsvis i förskott"
  
  // Tidsperiod
  startDate         DateTime
  endDate           DateTime?       // Null = tillsvidare
  
  // Förlängning
  autoRenewal       Boolean         @default(false)
  renewalPeriodMonths Int?          // Auto-förlängning i månader
  noticePeriodMonths  Int?          // Uppsägningstid i månader
  noticeDeadline    DateTime?       // Beräknat: endDate - noticePeriodMonths
  
  // Beslut
  mandateLevel      ContractMandateLevel @default(BOARD)
  decisionId        String?         // Styrelsebeslut som godkände avtalet
  meetingDecisionId String?         // Stämmobeslut (om stämma krävdes)
  
  // Kopplingar
  procurementId     String?         // Upphandling som ledde till avtalet
  
  // Garanti (om tillämpligt)
  warrantyMonths    Int?
  warrantyExpiry    DateTime?
  
  // Meta
  signedById        String?         // Vem som signerade för föreningen
  signedAt          DateTime?
  createdById       String
  notes             String?         @db.Text
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  contractor        Contractor?     @relation(fields: [contractorId], references: [id])
  decision          Decision?       @relation(fields: [decisionId], references: [id])
  procurement       Procurement?    @relation(fields: [procurementId], references: [id])
  signedBy          User?           @relation("ContractSigner", fields: [signedById], references: [id])
  createdBy         User            @relation("ContractCreator", fields: [createdById], references: [id])

  @@index([status])
  @@index([contractorId])
  @@index([category])
  @@index([noticeDeadline])
}
```

---

## Uppsägningsbevakning — kärnan

Det viktigaste avtalshanteringen gör är att **bevaka uppsägningstider**. Ett missat uppsägningsdatum kan kosta föreningen hundratusentals kronor.

### Beräkning

```
Avtal: Hisservice KONE
  Start: 2024-01-01
  Slut: 2026-12-31 (3 år)
  Auto-förlängning: Ja, 2 år i taget
  Uppsägningstid: 9 månader

  → Uppsägning senast: 2026-03-31
  → Om ej uppsagt: förlängs till 2028-12-31
```

### Bevakningstrappa

| Tid före deadline | Åtgärd | Kanal |
|-------------------|--------|-------|
| 12 månader | Info till ordförande + förvaltare: "Avtal löper ut nästa år" | In-app |
| 6 månader | Påminnelse: "Uppsägningstid börjar om 6 mån — planera upphandling?" | In-app |
| 3 månader | Varning: "Uppsägningstid om 3 mån — beslut krävs" | In-app |
| Uppsägningsdatum | Akut: "IDAG är sista dag att säga upp [avtal]" | In-app + SMS |
| Missat | Info: "Avtalet har förnyats automatiskt till [datum]" | In-app |

### Dashboard-integration

```
📋 Avtal att hantera

  ⚠ Uppsägning senast 2026-03-31 (45 dagar):
     Hisservice KONE — 3 × 28 000 kr/år
     [Förnya]  [Säg upp → starta upphandling]

  💡 Löper ut 2026-12-31:
     Städavtal CleanTeam — 148 000 kr/år
     Uppsägning senast: 2026-09-30

  ✅ Nyligen förnyade:
     Trädgårdsskötsel Grönyta AB — t.o.m. 2027
     Snöröjning NordSnö — t.o.m. 2027
```

---

## Flerårsavtal — verksamhetsårskoppling

### Problemet

Ett avtal tecknat 2025 som löper till 2028 berör fyra verksamhetsår. Varje år ska:
- Budgeten reflektera avtalskostnaden
- Årsberättelsen nämna väsentliga avtal
- Revisorn kunna se alla aktiva avtal
- Stämman informeras om avtal styrelsen tecknat under året

### Lösning: Avtal är inte årsbudna

Till skillnad från e-post (som taggas med verksamhetsår och arkiveras) är avtal **levande dokument** som spänner över år. De ska:

1. **Alltid vara synliga** oavsett vilket år de tecknades
2. **Filtreras per verksamhetsår** vid behov:
   - "Avtal tecknande under 2025" → rapportering till stämman
   - "Avtal aktiva 2026" → budgetunderlag
   - "Avtal som löper ut 2026" → upphandlingsplanering
3. **Kopplas till beslut** med datum → revisorn ser vilken styrelse som beslutade

### Årsberättelsekoppling

Systemet kan auto-generera avtalsbilaga till årsberättelsen:

```
Avtal tecknade under verksamhetsår 2025:

| Avtal | Motpart | Period | Årskostnad | Beslut |
|-------|---------|--------|------------|--------|
| Hisservice | KONE AB | 2026–2028 | 84 000 kr | Styrelse 2025-11-15 |
| Fasadmålning | Fasadspec. | 2026 (projekt) | 342 000 kr | Stämma 2025-05-20 |

Aktiva avtal per 2025-12-31: 12 st
Total årlig avtalskostnad: 890 000 kr

Avtal som löper ut 2026: 3 st
  - Städavtal CleanTeam (2026-12-31)
  - Larm Securitas (2026-06-30)
  - Bredband Telia (2026-09-30)
```

---

## Avtalsregister — UI

### Översiktsvy (`/styrelse/avtal` eller `/forvaltning/avtal`)

```
┌─────────────────────────────────────────────────────────┐
│  📑 Avtal                                    [+ Nytt]  │
│                                                         │
│  [Alla (14)]  [Driftsavtal (8)]  [Försäkring (3)]      │
│  [Finansiella (2)]  [Projekt (1)]                       │
│                                                         │
│  ⚠ Kräver åtgärd (2)                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔔 Hisservice KONE           Uppsägn. 2026-03-31 │  │
│  │    84 000 kr/år · 3 hissar · Auto-förnyelse 2 år │  │
│  │    [Förnya]  [Säg upp]  [Starta upphandling]     │  │
│  │                                                    │  │
│  │ 💡 Städavtal CleanTeam        Löper ut 2026-12-31 │  │
│  │    148 000 kr/år · Uppsägning senast 2026-09-30   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Aktiva avtal (12)                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Trädgård Grönyta AB          t.o.m. 2027-12-31   │  │
│  │ 72 000 kr/år                                      │  │
│  │                                                    │  │
│  │ Snöröjning NordSnö           t.o.m. 2027-04-30   │  │
│  │ 45 000 kr/säsong                                  │  │
│  │                                                    │  │
│  │ Bredband Telia               t.o.m. 2026-09-30   │  │
│  │ 280 kr/lgh/mån (100 lgh = 336 000 kr/år)         │  │
│  │ ...                                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  📊 Total årlig avtalskostnad: 890 000 kr              │
└─────────────────────────────────────────────────────────┘
```

### Detaljvy

```
┌─────────────────────────────────────────────────────────┐
│  📑 Hisserviceavtal — KONE AB                          │
│                                                         │
│  Status: ⚠ Uppsägningsperiod (deadline 2026-03-31)     │
│                                                         │
│  ┌─ Avtalsinformation ──────────────────────────────┐  │
│  │ Motpart: KONE AB (org.nr 556XXX-XXXX)            │  │
│  │ Kontakt: Anna Ström, anna.strom@kone.se          │  │
│  │ Kategori: Driftsavtal                             │  │
│  │ Period: 2024-01-01 — 2026-12-31                   │  │
│  │ Auto-förlängning: 2 år                            │  │
│  │ Uppsägningstid: 9 månader                         │  │
│  │ Beslutsnivå: Styrelsebeslut                       │  │
│  │ Beslutat: Styrelsemöte 2023-11-20, §12            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Ekonomi ────────────────────────────────────────┐  │
│  │ Årskostnad: 84 000 kr (28 000 kr/hiss × 3)      │  │
│  │ Betalning: Kvartalsvis i förskott                 │  │
│  │ Totalt betalt 2025: 84 000 kr                     │  │
│  │ Kopplad till: 4 fakturor (2025)                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Tidslinje ──────────────────────────────────────┐  │
│  │ 2023-11-20 Styrelsebeslut: teckna 3-årsavtal     │  │
│  │ 2024-01-01 Avtal träder i kraft                   │  │
│  │ 2025-03-15 Service utförd — inga anmärkningar     │  │
│  │ 2025-09-20 Service utförd — byte av linor hiss 2  │  │
│  │ 2026-01-15 ⚠ Påminnelse: uppsägning senast       │  │
│  │            2026-03-31                              │  │
│  │ 2026-03-31 ⏰ DEADLINE: säg upp eller förnya      │  │
│  │ 2026-12-31 Avtal löper ut (om uppsagt)            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Dokument ───────────────────────────────────────┐  │
│  │ 📎 Hissavtal_KONE_2024-2026.pdf                  │  │
│  │ 📎 Serviceprotokoll_2025-03.pdf                   │  │
│  │ 📎 Serviceprotokoll_2025-09.pdf                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Redigera]  [Förnya avtal]  [Säg upp]                 │
│  [Starta upphandling]  [Exportera]                     │
└─────────────────────────────────────────────────────────┘
```

---

## Koppling: Upphandling → Avtal

```
Upphandling UPH-2026-003 "Ommålning fasad A"
  Status: ORDERED (beställd)
  Vald leverantör: Fasadspecialisten
  Belopp: 342 000 kr
  
  → [Skapa avtal från upphandling]
  → Avtal förifylt med:
     - Motpart: Fasadspecialisten (från Contractor)
     - Belopp: 342 000 kr
     - Period: från upphandlingens tidsplan
     - Beslut: kopplat styrelsebeslut
     - Kategori: Projekt
     - Garanti: 10 år (från offert)
```

### Omvänt: Avtal → Upphandling

```
Avtal "Städ CleanTeam" löper ut 2026-12-31
  Uppsägning senast: 2026-09-30

  [Starta upphandling för ersättande avtal]
  → Upphandling skapas med:
     - Titel: "Städavtal trapphus 2027–"
     - Beskrivning: förifyld från befintligt avtal
     - Budget: 148 000 kr/år (befintlig kostnad)
     - Deadline: 2026-09-15 (före uppsägningsdeadline)
```

---

## Koppling: Avtal → Fakturor

Varje aktivt avtal har en förväntad fakturaström:

```
Hisservice KONE — 84 000 kr/år — kvartalsvis
  
  Förväntade fakturor 2026:
  ☑ Q1: 21 000 kr (betald 2026-01-15)
  ☑ Q2: 21 000 kr (betald 2026-04-12)
  ⏳ Q3: 21 000 kr (förväntad juli)
  ⏳ Q4: 21 000 kr (förväntad oktober)

  Faktisk kostnad 2026 hittills: 42 000 kr
  Budget 2026: 84 000 kr
```

När en faktura från KONE anländer i ekonomi-inkorgen:
```
  Faktura från KONE AB: 21 000 kr
  ✅ Matchar avtal "Hisservice" — kvartalsbetalning Q3
  → Auto-kopplad till avtal + rätt budgetpost
```

---

## Årshjulsintegration

Avtalshändelser i årshjulet:

```
📅 Avtalskalender 2026

  Jan   Hisservice Q1-faktura
  Mar   ⚠ DEADLINE: Uppsägning hisservice KONE
  Apr   Hisservice Q2-faktura
  Jun   Larmavtal Securitas löper ut
  Jul   Hisservice Q3-faktura
  Sep   ⚠ DEADLINE: Uppsägning städ CleanTeam
        ⚠ DEADLINE: Uppsägning bredband Telia
  Okt   Hisservice Q4-faktura
        Försäkringsförnyelse (auto)
  Dec   Städavtal CleanTeam löper ut
        Budget nästa år — avtalskostnader sammanställs
```

---

## Roller och behörigheter

| Åtgärd | Förvaltare | Ordförande | Kassör | Ledamot | Revisor |
|--------|------------|------------|--------|---------|---------|
| Se avtalsregister | ✅ | ✅ | ✅ | ✅ | ✅ (läs) |
| Skapa avtal | ✅ | ✅ | — | — | — |
| Redigera avtal | ✅ | ✅ | — | — | — |
| Signera (registrera signatur) | — | ✅ | ✅ (ekonomi) | — | — |
| Säga upp avtal | ✅ | ✅ | — | — | — |
| Se avtalskostnader | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exportera för revision | — | ✅ | ✅ | — | ✅ |

---

## Stämmorapportering

### Automatisk sammanställning för årsberättelsen

```
Avtal tecknade under verksamhetsår 2025:

  Nya avtal:
  - Hisservice KONE AB, 2024–2026, 84 000 kr/år (styrelsebeslut)
  - Fasadmålning Fasadspec., 342 000 kr (stämmobeslut)
  
  Förnyade avtal:
  - Trädgårdsskötsel Grönyta AB, förlängt 2 år (styrelsebeslut)
  
  Uppsagda avtal:
  - Städ GamlaStäd AB — ersatt av CleanTeam (upphandling)
  
  Avtal som löper ut 2026:
  - Städ CleanTeam (dec 2026)
  - Larm Securitas (jun 2026)
  - Bredband Telia (sep 2026)

Total årlig avtalskostnad: 890 000 kr
Förändring mot föregående år: +45 000 kr (+5,3%)
```

### Stämmans insyn

Stämman kan i årsberättelsen se:
1. Vilka avtal styrelsen tecknat (och på vilken mandatnivå)
2. Total avtalskostnad och förändring
3. Kommande avtalsutgångar (för planering)
4. Koppling till upphandlingar (transparens)

---

## PUB-avtal (personuppgiftsbiträdesavtal)

Alla leverantörer som hanterar persondata åt föreningen behöver PUB-avtal (GDPR art. 28). Systemet bevakar:

```
⚠ Leverantörer med PUB-avtal:
  ✅ KONE AB — PUB signerat 2024-01-15
  ✅ CleanTeam — PUB signerat 2025-03-01
  ⚠ Telia (bredband) — PUB saknas!
     → Bredbandsavtalet innebär att Telia hanterar
       trafik från föreningens nätverk — PUB krävs
  ✅ Nabo (ekonomisk förvaltning) — PUB signerat 2023-06-01

  Leverantörer utan PUB-krav:
  ✓ Grönyta AB (trädgård) — ingen persondata
  ✓ NordSnö (snöröjning) — ingen persondata
```

PUB-status spåras i `Contractor`-modellen (fälten `pubAgreement` + `pubAgreementDate` finns redan).

---

## Implementation

### Fas 1: Avtalsregister

- [ ] `Contract`-modell med statusflöde
- [ ] Prisma-migration
- [ ] tRPC-router `contract.*` (CRUD + statusövergångar)
- [ ] Avtalsöversikt (`/forvaltning/avtal`)
- [ ] Detaljvy med tidslinje
- [ ] Grundläggande uppsägningsbevakning (notifieringar)

### Fas 2: Kopplingar

- [ ] Upphandling → Avtal (skapa avtal från avslutad upphandling)
- [ ] Avtal → Upphandling (starta upphandling vid avtalsutgång)
- [ ] Avtal → Faktura (matchning vid inkommande faktura)
- [ ] Avtal → Styrelsebeslut (mandatnivå + beslutsreferens)
- [ ] Avtal → Contractor (leverantörskoppling)

### Fas 3: Bevakning och rapportering

- [ ] Bevakningstrappa (12/6/3 mån + deadline + missat)
- [ ] Årshjulsintegration
- [ ] Årsberättelsebilaga (auto-genererad)
- [ ] Revisorsexport
- [ ] PUB-avtalsbevakning
- [ ] Dashboard-widget "Avtal att hantera"

### Fas 4: E-postintegration

- [ ] Avtalsrelaterade mail kopplade via tagg
- [ ] Uppsägningsmail som utkast
- [ ] Förnyelsebekräftelse som utkast
- [ ] Inkommande avtalsdokument → dokumentarkivet
