# BRF som företag — styrning och drift

## Grundinsikt

En BRF är juridiskt en ekonomisk förening men operativt fungerar den som ett företag. Stämman är bolagsstämma, styrelsen är styrelse, och den operativa driften sköts av en "VD" — oavsett om den personen kallas ordförande, fastighetsansvarig, anställd förvaltare eller extern driftspartner.

Systemet Hemmet har hittills fokuserat på **styrningslager** (governance). Det som saknas är **driftlagret** (operations).

---

## Två lager

```
┌──────────────────────────────────────────────┐
│  STYRNING (governance)                       │
│                                              │
│  Stämma                                      │
│    → Väljer styrelse, revisor, valberedning   │
│    → Beslutar om stadgar, budget, avgifter    │
│                                              │
│  Styrelse                                    │
│    → Fattar beslut, förvaltar, rapporterar    │
│    → Delegerar operativt ansvar nedåt         │
│                                              │
│  = Det Hemmet stödjer idag                   │
└──────────────────┬───────────────────────────┘
                   │ Delegation
                   │ (formellt styrelsebeslut)
┌──────────────────▼───────────────────────────┐
│  DRIFT (operations)                          │
│                                              │
│  Operativ ledare ("VD")                      │
│    → Verkställer styrelsebeslut              │
│    → Leder den dagliga driften               │
│    → Ansvarar för personal och leverantörer   │
│                                              │
│  Anställda                                   │
│    → Fastighetsskötare, städare, admin        │
│    → Rapporterar till operativ ledare         │
│                                              │
│  Leverantörer                                │
│    → Teknisk förvaltare, entreprenörer        │
│    → Avtalsstyrda, PUB-avtal vid persondata   │
│                                              │
│  = Det Hemmet saknar                         │
└──────────────────────────────────────────────┘
```

---

## Aktiebolagsanalogin

| Aktiebolag | BRF | Systemroll idag |
|-----------|-----|:---------------:|
| Bolagsstämma | Föreningsstämma | OK — årsmöte med röstning |
| Styrelse | Styrelse | OK — möten, beslut, protokoll |
| VD | Operativ ledare | **Saknas** |
| Anställda | Fastighetsskötare, städare | **Saknas** |
| Revisorer | Revisorer | OK — revisionsflöde |
| Valberedning | Valberedning | OK — nomineringsmodell |
| Dotterbolag/Leverantörer | Förvaltare, entreprenörer | Delvis — Contractor-modell finns |

---

## "VD"-rollen: Vem driver driften?

### Skalar med storlek

| BRF-storlek | Operativ ledare | Anställningsform | Rapporterar till |
|-------------|:---------------:|:----------------:|:----------------:|
| Liten (5-30 lgh) | Ordförande | Ideell | Styrelsen (= sig själv) |
| Medelstor (30-100) | Fastighetsansvarig | Ideell med mandat | Ordförande |
| Stor (100-300) | Anställd driftchef | Anställd | Styrelsen |
| Mycket stor (300+) | Extern förvaltare | Upphandlad tjänst | Ordförande + kassör |

### Delegationskedjan

```
Styrelsen beslutar (protokollfört):
  "Fastighetsansvarig X delegeras ansvar för löpande drift
   med befogenhet att beställa åtgärder upp till Y kr."
    ↓
Operativ ledare verkställer:
  → Tar emot felanmälningar
  → Beställer reparationer
  → Leder fastighetsskötare
  → Kontaktar leverantörer
  → Rapporterar till styrelsen vid möten
    ↓
Anställda utför:
  → Fastighetsskötare byter lampor, skottar, klipper
  → Städare trapphus
  → Rapporterar till operativ ledare
```

### Befogenhetsgränser

| Befogenhet | Operativ ledare | Kräver styrelsebeslut |
|-----------|:---------------:|:---------------------:|
| Beställa reparation < X kr | Y | — |
| Beställa reparation > X kr | — | Y |
| Teckna serviceavtal | — | Y |
| Anställa personal | — | Y |
| Godkänna fakturor < X kr | Y (om delegerat) | — |
| Godkänna fakturor > X kr | — | Y |
| Kontakta leverantörer | Y | — |
| Kontakta myndigheter | Y (löpande) | Y (principiella frågor) |

`X` = beloppsgräns som styrelsen bestämmer och konfigureras i systemet.

---

## Anställda i BRF:en

### Arbetsgivaransvar

När BRF:en anställer personal gäller:

| Lag | Krav | Berör |
|-----|------|-------|
| LAS (1982:80) | Anställningsskydd, uppsägningstid | Alla anställda |
| Semesterlagen (1977:480) | Minst 25 semesterdagar | Alla anställda |
| Arbetsmiljölagen (1977:1160) | Systematiskt arbetsmiljöarbete | Styrelsen som arbetsgivare |
| Diskrimineringslagen (2008:567) | Lika behandling vid rekrytering/anställning | Styrelsen |
| Skatteförfarandelagen | Arbetsgivaravgifter, skatteavdrag, kontrolluppgifter | Kassören |

**Notera:** Styrelsen är arbetsgivare. Det personliga ansvaret (LEF 8:4) gäller även arbetsgivaransvaret. Styrelsemedlemmar kan bli personligt ansvariga för brott mot arbetsrätten.

### Vanliga anställningsformer

| Form | Typiskt | Arbetsrätt |
|------|---------|:----------:|
| Tillsvidare (fast) | Fastighetsskötare på heltid | Full LAS |
| Tidsbegränsad | Sommarjobbare, projektanställd | LAS med begränsningar |
| Behovsanställd | Städare vid behov | LAS, men svagare skydd |
| Timanställd via bemanningsföretag | Snöröjning, storstädning | Bemanningsföretaget är arbetsgivare |
| F-skattare (egenföretagare) | Trädgårdsskötsel, specialistarbete | Inte anställd — leverantör |

**Gränsdragning F-skatt:** Om personen bara har föreningen som uppdragsgivare, styrs i detalj av föreningen och använder föreningens utrustning → kan omklassificeras till anställning av Skatteverket.

---

## Systemets driftlager — föreslagen arkitektur

### Nya rolltyper

```
Befintliga kategorier:
  Styrelseroller      → BOARD_*
  Granskningsroller   → AUDITOR, AUDITOR_SUBSTITUTE
  Föreningsroller     → NOMINATING_COMMITTEE*
  Grundroller         → MEMBER, RESIDENT

Ny kategori:
  Operativa roller    → OPERATIONS_MANAGER    (driftansvarig/"VD")
                      → OPERATIONS_STAFF      (anställd personal)
                      → OPERATIONS_CONTRACTOR (extern leverantör med systemåtkomst)
```

### Permissions för operativa roller

| Permission | Ops Manager | Ops Staff | Ops Contractor |
|-----------|:-----------:|:---------:|:--------------:|
| Felanmälningar — se alla | Y | Tilldelade | Tilldelade |
| Felanmälningar — ändra status | Y | Y (tilldelade) | — |
| Besiktningar — hantera | Y | — | — |
| Komponenter — uppdatera | Y | — | — |
| Leverantörer — hantera | Y | — | — |
| Boendekontaktuppgifter | Y | Begränsat | Begränsat |
| Styrelsemöten | — | — | — |
| Protokoll | — | — | — |
| Ekonomi/utlägg | Se tilldelade | — | — |
| Arbetsordrar — skapa | Y | — | — |
| Arbetsordrar — utföra | Y | Y | Y |

### Delegation-modell

```
Delegation {
  id
  fromRoleOrUserId      // Vem delegerar (styrelsemedlem)
  toUserId              // Vem tar emot (operativ ledare)
  scope                 // Vad delegeras: "MAINTENANCE", "PROCUREMENT", "STAFFING"
  amountLimit           // Beloppsgräns (kr) — null = obegränsat
  validFrom             // Giltig från
  validTo               // Giltig till (null = tills vidare)
  decisionId            // Koppling till styrelsebeslut
  createdAt
}
```

### Arbetsorder-modell

Skillnad mot Task: en arbetsorder är operativ (byt lampa, laga kran). En task är styrelsedriven (verkställ beslut).

```
WorkOrder {
  id
  title
  description
  priority              // LOW, MEDIUM, HIGH, URGENT
  status                // CREATED, ASSIGNED, IN_PROGRESS, COMPLETED, VERIFIED
  
  // Kopplingar
  damageReportId?       // Skapad från felanmälan
  inspectionId?         // Skapad från besiktning
  componentId?          // Berör specifik byggkomponent
  
  // Tilldelning
  assignedToId          // Anställd eller leverantör
  createdById           // Operativ ledare
  
  // Ekonomi
  estimatedCost
  actualCost
  approvedById          // Vem godkände kostnaden
  
  // Tid
  dueDate
  completedAt
  verifiedAt            // Slutbesiktigad
  verifiedById
}
```

---

## Flöde: Felanmälan → Arbetsorder → Utförd

```
Boende rapporterar: "Lampa trasig i trapphuset"
    ↓
DamageReport skapas (status: SUBMITTED)
    ↓
Operativ ledare ser i sin dashboard
    → Bedömer: kan fastighetsskötaren fixa?
    ↓
JA → Skapar WorkOrder tilldelad fastighetsskötaren
    → Fastighetsskötaren ser i sin lista
    → Utför arbetet
    → Markerar WorkOrder COMPLETED
    → Operativ ledare verifierar
    → DamageReport → RESOLVED
    → Boende notifieras
    ↓
NEJ → Skapar WorkOrder tilldelad leverantör (t.ex. elektriker)
    → Kontrollerar: inom delegerad beloppsgräns?
    → JA → Beställer direkt
    → NEJ → Begär styrelsebeslut → Beställer efter godkännande
    → Leverantör utför
    → Operativ ledare verifierar
    → DamageReport → RESOLVED
```

---

## Ekonomiskt flöde

### Löner och personal

| Process | Ansvarig | System/extern |
|---------|----------|:-------------:|
| Löneberäkning | Kassör / löneföretag | Externt (Fortnox Lön, Visma) |
| Utbetalning | Kassör via bank | Externt |
| Arbetsgivardeklaration | Kassör / löneföretag | Externt (Skatteverket) |
| Semesterplanering | Operativ ledare | Kunde vara i Hemmet |
| Tidrapportering | Anställda → operativ ledare | Kunde vara i Hemmet |

### Fakturor och inköp

```
Leverantör → Faktura → Operativ ledare granskar
    → Inom beloppsgräns? → Attesterar själv
    → Över gräns? → Kassör/ordförande attesterar
    → Betalning via ekonomisystem
```

---

## BRF:en som arbetsgivare — styrelsens ansvar

### Vad styrelsen måste ha koll på

1. **Anställningsavtal** — skriftligt, inom 30 dagar (LAS)
2. **Arbetsmiljö** — systematiskt arbetsmiljöarbete, riskbedömning, skyddsronder
3. **Försäkringar** — arbetsgivarförsäkring, TFA (trygghetsförsäkring vid arbetsskada)
4. **Kollektivavtal** — Fastighetsanställdas Förbund, om tillämpligt
5. **Arbetsgivarregistrering** — hos Skatteverket
6. **Löneskatt + arbetsgivaravgifter** — månadsvis
7. **Rehabiliteringsansvar** — vid sjukskrivning

### Vanliga misstag

| Misstag | Konsekvens |
|---------|-----------|
| Ingen skriftlig anställning | Presumtion om tillsvidareanställning |
| Felaktig F-skatt-klassificering | Arbetsgivaravgifter + skattetillägg retroaktivt |
| Ingen arbetsmiljöplan | Arbetsmiljöverket kan utfärda föreläggande |
| Muntlig uppsägning | Ogiltig — LAS kräver skriftlighet |
| Ingen rehab-plan vid sjukdom | Skyldighet enligt SFB |

---

## Gränsdragning: Vad hör hemma i Hemmet?

| Funktion | I Hemmet? | Varför / varför inte |
|----------|:---------:|---------------------|
| Delegationsregister | **Ja** | Vem har rätt att besluta om vad, med vilken gräns |
| Arbetsordrar (WorkOrder) | **Ja** | Kopplar felanmälan → utförande → verifiering |
| Operativa roller + permissions | **Ja** | Personal behöver systemåtkomst |
| Leverantörshantering | **Ja** (finns) | Contractor-modell implementerad |
| Lönehantering | **Nej** | Löneprogram (Fortnox, Visma, extern lönebyrå) |
| Tidrapportering | **Kanske** | Enkel variant möjlig, avancerad → externt |
| Personaladministration (LAS) | **Nej** | HR-system eller pappersprocess |
| Faktura-attest | **Ja** (delvis) | Expense-modellen fungerar, men behöver utökas för leverantörsfakturor vs utlägg |
| Arbetsschema | **Kanske** | Enkel variant, avancerad → externt |
| Försäkringsbevakning | **Ja** (delvis) | BrfSettings har data, behöver förnyelsepåminnelse |

---

## Äkta vs oäkta BRF — designa för det komplexa

### Vad gör en BRF oäkta?

En BRF klassificeras som **oäkta** om kvalificerad verksamhet (medlemmars boende) understiger 60% av föreningens totala intäkter. Resterande 40%+ kommer från:

- Kommersiella lokaler (butiker, restauranger, kontor)
- Garage/parkering uthyrt till icke-medlemmar
- Gästlägenhet/festlokal uthyrd externt
- Reklamintäkter (fasadytor, tak)
- Vindsvåningar omvandlade till bostadsrätter men sålda utan andelar

### Konsekvenser

| Aspekt | Äkta BRF | Oäkta BRF |
|--------|:--------:|:---------:|
| Beskattning | Schablonintäkt (statslåneränta × taxeringsvärde) | Full bolagsskatt 20.6% på alla intäkter |
| Momsplikt | Sällan (parkering från okt 2026) | Ja — kommersiella hyror, parkering, tjänster |
| Avdragsrätt | Begränsad | Full avdragsrätt mot intäkter |
| Medlems försäljningsvinst | Kapitalvinstbeskattning normalt | Eventuell schablonbeskattning + uttagsbeskattning |
| Årsredovisning | K3 (förenklad) | K3 med full resultat- och balansräkning |
| Hyresavtal | Sällan formella | **Obligatoriskt** — kommersiella hyresavtal (JB 12 kap) |
| Hyresavisering | Enkel (månadsavgift) | Komplex — hyra + moms + tillägg + indexreglering |
| Fastighetsskatt | Reducerad | Normal |
| Deklaration | Enkel (INK2S) | Komplex (INK2) med bilagor |

### Systemkonsekvenser

En oäkta BRF kräver att driftlagret hanterar:

| Funktion | Äkta BRF | Oäkta BRF | Designprincip |
|----------|:--------:|:---------:|:-------------:|
| Hyresavtal för lokaler | — | Obligatoriskt | Bygg för oäkta, dölj för äkta |
| Hyresavisering med moms | — | Obligatoriskt | Bygg med moms, moms=0 för äkta |
| Momsredovisning (kvartalsvis) | — | Obligatoriskt | Bygg, inaktivera för äkta |
| Kommersiella hyresgäster | — | Fullständig hantering | Utöka hyresgästmodell |
| Indexreglering av hyror | — | Vanligt (KPI-kopplat) | Konfigurerbart per avtal |
| Separata resultaträkningar | — | Per fastighet/enhet | Bygg generellt |
| Investeringsavdrag | — | Avdragsgilla | Kostnadsfördelning |
| Fastighetsskatt per enhet | Reducerad schablonmässigt | Per typ (bostad/lokal/garage) | Konfigurerbart |

### Designprincip: Bygg för oäkta, skala av för äkta

```
Oäkta BRF (fullständig):
    Hyresavtal: lokaler, garage, gästlägenhet
    Hyresavisering: hyra + moms + tillägg + index
    Momsredovisning: kvartalsvis
    Resultaträkning: per enhet
    Kommersiella hyresgäster: fullständigt register
    ↓
Äkta BRF (förenklad):
    Hyresavtal: inaktivt / dolt
    Hyresavisering: månadsavgift (ingen moms)
    Momsredovisning: inaktivt
    Resultaträkning: totalt (inte per enhet)
    Kommersiella hyresgäster: inaktivt
```

Konfigureras via:
```
BrfRules {
  isAuthentic              Boolean @default(true)   // Äkta förening
  commercialUnitsExist     Boolean @default(false)  // Har kommersiella lokaler
  vatRegistered            Boolean @default(false)  // Momsregistrerad
  vatReportingPeriod       String? @default("QUARTERLY") // MONTHLY, QUARTERLY, YEARLY
}
```

---

## Hyresavtalsmodell (kommersiella lokaler)

### LeaseAgreement (hyresavtal)

```
LeaseAgreement {
  id
  unitId                // Apartment/lokal med type=COMMERCIAL
  tenantType            // COMPANY, PERSON
  tenantName            // Företagsnamn eller personnamn
  tenantOrgNumber       // Organisationsnummer (företag)
  tenantContactPerson
  tenantEmail
  tenantPhone
  
  // Avtalstid
  startDate
  endDate               // null = tillsvidare
  noticePeriodMonths     // Uppsägningstid
  autoRenewalMonths      // Förlängningstid vid ej uppsägning
  
  // Ekonomi
  baseRent              // Bashyra (kr/mån)
  vatRate               // Momssats (0.25 = 25%)
  indexClause           // KPI-koppling: "KPI_OCT" = oktober-KPI
  indexBaseYear          // Basår för index
  supplements           // JSON: tillägg (värme, el, vatten, sopor)
  
  // Status
  status                // DRAFT, ACTIVE, TERMINATED, EXPIRED
  terminatedAt
  terminatedBy
  
  createdAt
  updatedAt
}
```

### RentInvoice (hyresavisering)

```
RentInvoice {
  id
  leaseAgreementId
  period                // "2026-04" (år-månad)
  
  baseRent              // Bashyra detta period
  indexAdjustment       // Indexuppräkning (+/-)
  supplements           // Tillägg detta period
  subtotal              // Summa före moms
  vatAmount             // Momsbelopp
  total                 // Totalt att betala
  
  dueDate
  paidAt
  paidAmount
  
  status                // DRAFT, SENT, PAID, OVERDUE, CREDITED
  creditedInvoiceId     // Om kreditfaktura: pekar på original
  
  createdAt
}
```

---

## Bevakning av äkta/oäkta-status

### Automatisk beräkning

Systemet kan beräkna andelen kvalificerade intäkter:

```
Kvalificerade intäkter = summa månadsavgifter (alla bostäder)
Okvalificerade intäkter = summa kommersiella hyror + parkering (extern) + övriga
Total = Kvalificerade + Okvalificerade

Andel kvalificerad = Kvalificerade / Total

Om Andel < 0.60 → VARNING: "Föreningen riskerar att klassificeras som oäkta"
```

### Systemvarning

```
Dashboard (kassör/ordförande):
  ⚠ Kvalificerade intäkter: 58% (under 60%-gränsen)
  → Föreningen riskerar att klassificeras som oäkta nästa beskattningsår
  → Konsekvenser: full bolagsskatt, momsplikt, ändrad deklaration
  → Åtgärder: minska kommersiella intäkter eller öka bostadsintäkter
```

---

## Implementationsprioritering (uppdaterad)

### Fas A — Grundläggande driftlager

| Prio | Funktion | Berör | Komplexitet |
|------|----------|-------|:-----------:|
| 1 | **Delegationsmodell** — befogenhet med gränser | Styrelse → drift | Medel |
| 2 | **Operativa roller** | Alla | Medel |
| 3 | **Arbetsordrar** kopplade till felanmälan/besiktning | Drift | Medel |
| 4 | **Beloppsgräns-validering** | Kassör, drift | Låg |
| 5 | **Operativ dashboard** | Driftansvarig | Medel |

### Fas B — Kommersiell förvaltning (oäkta-stöd)

| Prio | Funktion | Berör | Komplexitet |
|------|----------|-------|:-----------:|
| 6 | **BrfRules: äkta/oäkta konfiguration** | Admin | Låg |
| 7 | **LeaseAgreement** — kommersiella hyresavtal | Kassör, drift | Hög |
| 8 | **RentInvoice** — hyresavisering med moms | Kassör | Hög |
| 9 | **Momsredovisning** — kvartalsvis sammanställning | Kassör | Medel |
| 10 | **Äkta/oäkta-bevakning** — automatisk beräkning + varning | Kassör, ordförande | Medel |
| 11 | **Indexreglering** — KPI-kopplad hyresjustering | Kassör | Medel |
| 12 | **Faktura-attest utökat** — leverantörsfakturor | Kassör, drift | Medel |

### Skalning

```
Liten äkta BRF:     Fas A (1-5) — räcker gott
Medelstor äkta BRF:  Fas A (1-5) — räcker
Stor äkta BRF:       Fas A (1-5) + eventuellt 12
Oäkta BRF:           Fas A + Fas B (6-12) — allt behövs
```

---

## Sammanfattning

BRF:en har två ansikten:
- **Förening** — demokrati, stämma, stadgar, medlemsrättigheter
- **Företag** — drift, personal, leverantörer, ekonomi

Hemmet stödjer föreningssidan väl. Företagssidan saknas nästan helt. Delegationsmodellen är bryggan — den kopplar styrelsebeslut till operativ befogenhet med spårbarhet och gränser.

**Designprincip:** Bygg för oäkta (det komplexa fallet). Äkta BRF:er använder samma system med kommersiella funktioner inaktiverade. En konfigurationsflagga (`BrfRules.isAuthentic`) styr vad som visas.

**Bevakningsprincip:** Systemet beräknar löpande andelen kvalificerade intäkter och varnar om föreningen närmar sig oäkta-gränsen — innan det är för sent att agera.
