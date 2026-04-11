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

### Arkitekturprincip: Hemmet beslutar, banken exekverar, redovisningen bokför

```
Hemmet                         Banken                  Redovisning
(beslut + underlag)            (exekvering)            (bokföring)

Utlägg godkänt ────────────→  Kassör betalar ──────→  Verifikation skapas
Hyra fakturerad ───────────→  Autogiro/OCR ─────────→  Intäkt bokförs
Leverantörsfaktura attesterad → Kassör betalar ──────→  Kostnad bokförs
Lönekostnad (avtal) ───────→  Löneprogram → bank ──→  Lönekostnad bokförs
Skatt ─────────────────────→  Skattekonto (SKV) ───→  Skattekostnad bokförs
```

Hemmet äger **avtalsbaserad data** (vad föreningen borde tjäna/betala):
- Månadsavgifter per lägenhet (andelstal × avgift)
- Hyresavtal för lokaler (hyra + moms + index)
- Leverantörsavtal (avtalade kostnader)
- Personalavtal (totalkostnad för föreningen)
- Överlåtelse/pantsättningsavgifter (beräknade)

Hemmet äger **inte** bokföringsdata. Saldon importeras via SIE-export:
```
Redovisningssystem → SIE4-fil → Hemmet importerar → Dashboard
```

### Löner och personal — Hemmets gränsdragning

**Hemmet äger personalregistret, inte lönehanteringen.**

All löneberäkning, skatteavdrag, arbetsgivaravgifter, semesterräkneverk, sjuklön och arbetsgivardeklaration (AGI) hanteras externt — i lönesystem (Fortnox Lön, Visma) eller av lönebyrå.

| Process | Ansvarig | I Hemmet? |
|---------|----------|:---------:|
| Personalregister (vem, roll, avtal) | Ordförande | **Ja** |
| Totalkostnad per anställd | Kassör | **Ja** |
| Anställningsavtal (dokumentlänk) | Ordförande | **Ja** |
| Arbetsordrar till anställda | Driftansvarig | **Ja** |
| Löneberäkning | Lönesystem/lönebyrå | **Nej** |
| Skatteavdrag, AGI | Lönesystem | **Nej** |
| Semesterhantering | Lönesystem | **Nej** |
| Löneutbetalning | Bank | **Nej** |

### Personalmodell i Hemmet

```
Employee {
  id
  userId                    // Koppling till User (OPERATIONS_STAFF-roll)
  title                     // "Fastighetsskötare", "Städare"
  employmentType            // PERMANENT, TEMPORARY, HOURLY
  startDate
  endDate?
  totalMonthlyCost          // Total kostnad för föreningen (lön + arbetsgivaravgifter)
                            // INTE individuell lön — föreningskostnad
  contractDocumentId?       // Länk till Document (anställningsavtal)
  notes?
}
```

**Varför `totalMonthlyCost` istället för `salary`:**
- Det kassören och styrelsen behöver veta är "vad kostar den här anställningen föreningen per månad"
- Totalkostnaden inkluderar arbetsgivaravgifter (~31.42%) och är en budgetpost
- Det är en **föreningskostnad**, inte en personlig löneuppgift
- Kan visas för hela styrelsen i budgetsammanhang utan att avslöja individuell lön

### GDPR vs redovisningsplikt — konflikten

Lönedata hamnar i korselden mellan dataskydd och lagstadgad öppenhet:

| Krav | Säger | Konsekvens |
|------|-------|-----------|
| **GDPR Art. 5.1c** (dataminimering) | Samla bara det som behövs | Hemmet lagrar totalkostnad, inte bruttolön |
| **GDPR Art. 6.1c** (rättslig förpliktelse) | Behandling OK om lag kräver | Arbetsgivare MÅSTE hantera löneuppgifter — men det sker i lönesystemet |
| **ÅRL 5 kap. 20 §** (årsredovisning) | Löner och ersättningar ska redovisas som not | **Obligatorisk post** — men som totalsumma, inte per person |
| **BFL 7 kap. 2 §** (arkivering) | Räkenskapsmaterial sparas 7 år | Gäller lönesystemet, inte Hemmet |
| **Offentlighetsprincipen** | Gäller inte BRF:er (privaträttsliga) | Individuella löner är inte offentliga |

**Årsredovisningens krav (ÅRL 5 kap. 20 §):**

Årsredovisningen MÅSTE innehålla en not om personal:
```
Not X — Anställda och personalkostnader

Medelantal anställda: 2 (varav 1 kvinna, 1 man)

Löner och ersättningar:
  Styrelse och VD:       45 000 kr (avser arvoden)
  Övriga anställda:     336 000 kr
Sociala kostnader:      119 600 kr
  varav pensionskostnader: 33 600 kr

Totala personalkostnader: 500 600 kr
```

**Notera:** Totalbelopp per kategori — aldrig individuella löner. Hemmet behöver bara kunna leverera:
- Antal anställda (räknas från Employee-modellen)
- Total personalkostnad per år (summeras från `totalMonthlyCost × 12`)
- Styrelsens arvoden (summa av arvodesbeslut, redan i Decision-modellen)

Individuella löner stannar i lönesystemet.

### Vem ser vad i Hemmet

| Data | Ordförande | Kassör | Styrelse | Revisor | Medlem |
|------|:----------:|:------:|:--------:|:-------:|:------:|
| Anställdas namn + roll | Y | Y | Y | Y | — |
| `totalMonthlyCost` | Y | Y | Y (i budget) | Y | — |
| Anställningsavtal (dokument) | Y | Y | — | Y | — |
| Total personalkostnad/år | Y | Y | Y | Y | Y (i årsredovisning) |
| Individuell lön | — | — | — | — | — |

Individuell lön finns **aldrig** i Hemmet — den finns i lönesystemet dit bara kassör och lönebyrå har åtkomst.

### Fakturor och inköp

```
Leverantör → Faktura → Operativ ledare granskar
    → Inom delegerad beloppsgräns? → Attesterar själv
    → Över gräns? → Kassör/ordförande attesterar
    → Betalning via bank (exekvering)
    → Bokföring via redovisningssystem
```

---

## BRF:en som arbetsgivare — styrelsens ansvar

### Vad styrelsen måste ha koll på

1. **Anställningsavtal** — skriftligt, inom 30 dagar (LAS)
2. **Arbetsmiljö** — systematiskt arbetsmiljöarbete, riskbedömning, skyddsronder
3. **Försäkringar** — arbetsgivarförsäkring, TFA (trygghetsförsäkring vid arbetsskada)
4. **Kollektivavtal** — Fastighetsanställdas Förbund, om tillämpligt
5. **Arbetsgivarregistrering** — hos Skatteverket
6. **Löneskatt + arbetsgivaravgifter** — månadsvis (hanteras av lönesystem)
7. **Rehabiliteringsansvar** — vid sjukskrivning

### Vanliga misstag

| Misstag | Konsekvens |
|---------|-----------|
| Ingen skriftlig anställning | Presumtion om tillsvidareanställning |
| Felaktig F-skatt-klassificering | Arbetsgivaravgifter + skattetillägg retroaktivt |
| Ingen arbetsmiljöplan | Arbetsmiljöverket kan utfärda föreläggande |
| Muntlig uppsägning | Ogiltig — LAS kräver skriftlighet |
| Ingen rehab-plan vid sjukdom | Skyldighet enligt SFB |
| Lagra individuella löner i styrelseverktyg | GDPR-risk — dataminimering bryts |

---

## Gränsdragning: Vad hör hemma i Hemmet?

### Hemmet äger

| Funktion | Beskrivning |
|----------|-------------|
| **Avtal och grunddata** | Hyresavtal, leverantörsavtal, personalavtal (totalMonthlyCost) |
| **Delegationsregister** | Vem har rätt att besluta om vad, med vilken gräns |
| **Arbetsordrar** | Kopplar felanmälan → utförande → verifiering |
| **Operativa roller** | Anställd personal med systemåtkomst |
| **Leverantörshantering** | Contractor-modell med PUB-avtal |
| **Personalregister** | Vem, roll, totalMonthlyCost, avtalsdokument |
| **Avgiftsberäkning** | Avtalsbaserat: vad föreningen borde tjäna/betala |
| **Faktura-attest** | Godkännandeflöde med beloppsgränser |
| **Försäkringsbevakning** | Förnyelsepåminnelse |

### Hemmet äger INTE

| Funktion | Hanteras av | Integration |
|----------|-------------|-------------|
| **Bokföring** | Fortnox, Visma, förvaltare | SIE4-import av saldon |
| **Löneberäkning** | Lönesystem / lönebyrå | Ingen — totalMonthlyCost räcker |
| **Skatt, AGI, arbetsgivaravgifter** | Lönesystem → Skatteverket | Ingen |
| **Semesterräkneverk** | Lönesystem | Ingen |
| **Bankutbetalningar** | Bank | Ingen — kassör exekverar manuellt |
| **Deklaration** | Redovisningssystem / revisor | Ingen |
| **K3-avskrivning** | Redovisningssystem | SIE4-import |
| **Individuella löner** | Lönesystem | **Aldrig** — finns inte i Hemmet (GDPR) |

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

### Designprincip: Alla funktioner alltid tillgängliga

Kommersiella funktioner (hyresavtal, fakturering, moms) döljs **inte** baserat på äkta/oäkta-status. En äkta BRF med en butikslokal i gatuplan behöver hyresavtal och fakturering lika mycket som en oäkta.

```
Alla BRF:er (oavsett status):
    Hyresavtal: alltid tillgängligt (om commercialUnitsExist=true)
    Hyresavisering: med moms om vatRegistered, utan annars
    Momsredovisning: om vatRegistered=true
    Resultaträkning: per enhet om kommersiella enheter finns
    Kommersiella hyresgäster: om hyresavtal finns

Äkta/oäkta-bevakning körs i bakgrunden:
    → Varnar om andelen glider mot 40%-gränsen
    → Kassör/ordförande ser på dashboard
    → Ingen funktion blockeras — bara information
```

**Notera:** En äkta BRF kan ha kommersiella lokaler, garage och andra externa intäkter — så länge de inte överstiger 40%. `isAuthentic` är därför inte en manuell konfiguration utan en **beräknad status** baserad på faktiska intäkter. Hyresavtal, fakturering och momshantering ska alltid vara tillgängliga — de behövs oavsett klassificering.

Konfigureras via:
```
BrfRules {
  // Beräknas automatiskt baserat på intäkter — kan manuellt överridas vid behov
  authenticStatusOverride  String? @default(null)   // null = automatisk beräkning, "AUTHENTIC"/"INAUTHENTIC" = manuellt satt
  commercialUnitsExist     Boolean @default(false)  // Har kommersiella lokaler
  vatRegistered            Boolean @default(false)  // Momsregistrerad
  vatReportingPeriod       String? @default("QUARTERLY") // MONTHLY, QUARTERLY, YEARLY
}
```

Systemet beräknar löpande:
```
Kvalificerade intäkter (bostäder) / Totala intäkter ≥ 60% → Äkta
                                                    < 60% → Oäkta → Varning
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

## Operativa roller — specialiseringar

### Tre organisationsmodeller

Systemet måste fungera oavsett om föreningen har en driftchef eller inte.

```
Modell A — Stor BRF (anställd driftchef):
    Styrelse → OPERATIONS_MANAGER (driftchef) → OPERATIONS_CARETAKER/CLEANER
    BOARD_PROPERTY_MGR = tillsyn och styrelserapportering
    OPERATIONS_MANAGER = operativ ledning

Modell B — Medelstor BRF (delat ansvar):
    Styrelse → BOARD_PROPERTY_MGR + OPERATIONS_CARETAKER (delar driften)
    BOARD_PROPERTY_MGR = beslutar, beställer, attesterar, planerar
    OPERATIONS_CARETAKER = utför, rapporterar
    Ingen OPERATIONS_MANAGER behövs

Modell C — Liten BRF (styrelsemedlem gör allt):
    Styrelse → BOARD_PROPERTY_MGR / ordförande
    Ringer rörmokaren själv
    Inga operativa roller behövs
```

**Designprincip:** Permissions designas så att `BOARD_PROPERTY_MGR` redan har det som `OPERATIONS_MANAGER` behöver — skapa arbetsordrar, tilldela, attestera, bevaka besiktningar. Om en driftchef anställs flyttas det operativa ansvaret till `OPERATIONS_MANAGER` och `BOARD_PROPERTY_MGR` övergår till tillsyn.

### Delat ansvar utan driftchef (Modell B)

| Uppgift | Fastighetsansvarig (styrelse) | Fastighetsskötare (anställd) |
|---------|:----------------------------:|:----------------------------:|
| Besluta om åtgärder | Y | — |
| Beställa leverantörer (inom delegation) | Y | — |
| Attestera fakturor (inom beloppsgräns) | Y | — |
| Planera underhåll | Y | Underlag |
| Bevaka besiktningar | Y | Utför/rapporterar |
| Skapa arbetsordrar | Y | — |
| Utföra arbetsordrar | — | Y |
| Ta emot felanmälningar | Y (i systemet) | Y (i verkligheten — boende knackar på) |
| Kontakta boende vid reparation | Y | Y |

### Permissions som fungerar i alla modeller

```
BOARD_PROPERTY_MGR (befintlig, utökas):
├── Allt i BOARD_COMMON
├── report:manage (befintlig)
├── workorder:create          NYT — skapa arbetsordrar
├── workorder:assign          NYT — tilldela till personal/leverantör
├── workorder:view_all        NYT — se alla arbetsordrar
├── inspection:manage         NYT — hantera besiktningskalender
├── component:manage          NYT — hantera byggnadskomponenter
├── contractor:manage         NYT — hantera leverantörer
└── delegation:use            NYT — attestera inom delegerad beloppsgräns

OPERATIONS_MANAGER (ny, för stor BRF med anställd driftchef):
├── Samma operativa permissions som BOARD_PROPERTY_MGR ovan
├── MINUS styrelsepermissions (meeting:edit, motion:respond etc.)
├── personnel:view            NYT — se personalregister
└── delegation:use            NYT — attestera inom delegerad beloppsgräns

OPERATIONS_CARETAKER (ny):
├── workorder:view_assigned   — se tilldelade arbetsordrar
├── workorder:update          — uppdatera status (påbörjad/klar)
├── report:view               — se felanmälningar
├── report:update_status      — uppdatera felanmälningsstatus
├── contact:view_phone        — se boendes telefonnummer
└── announcement:view         — se meddelanden

OPERATIONS_CLEANER (ny):
├── workorder:view_assigned   — se tilldelade arbetsordrar
├── workorder:update          — uppdatera status (påbörjad/klar)
└── announcement:view         — se meddelanden

OPERATIONS_ADMIN (ny):
├── workorder:view_assigned   — se tilldelade arbetsordrar
├── member:view_registry      — se medlemsregister
├── booking:manage            — hantera bokningar
├── document:upload           — hantera dokument
└── announcement:view         — se meddelanden
```

**Nyckelinsikt:** `BOARD_PROPERTY_MGR` + `OPERATIONS_CARETAKER` tillsammans ger samma funktionalitet som `OPERATIONS_MANAGER` + `OPERATIONS_CARETAKER`. Systemet kräver aldrig en driftchef — det fungerar lika bra med styrelsemedlem + fastighetsskötare.

### Övergång: Modell B → Modell A

När en BRF anställer en driftchef:
1. Skapa User med `OPERATIONS_MANAGER`-roll
2. `BOARD_PROPERTY_MGR` behåller styrelsepermissions + tillsyn
3. Driftchefen tar över operativa arbetsordrar, leverantörer, besiktningar
4. Delegationsbeslut i styrelseprotokoll: "Driftchef X delegeras ansvar med beloppsgräns Y kr"

Ingen systemändring behövs — bara rolltilldelning.

### Rollhierarki

Samma mönster som styrelserollerna: en basroll med gemensamma permissions + specialiseringar.

```
OPERATIONS_COMMON (alla anställda):
├── Se tilldelade arbetsordrar
├── Uppdatera status på tilldelade arbetsordrar
├── Se byggnads-/lägenhetsinfo (inte persondata)
└── Se meddelanden riktade till personal

OPERATIONS_CARETAKER (fastighetsskötare) = OPERATIONS_COMMON +
├── Se alla felanmälningar (inte bara tilldelade)
├── Se boendekontaktuppgifter (telefon — för att nå vid reparation)
└── Uppdatera felanmälningsstatus

OPERATIONS_CLEANER (städare) = OPERATIONS_COMMON
    (inga tillägg — ser bara tilldelade arbetsordrar)

OPERATIONS_ADMIN (kontorsadministratör) = OPERATIONS_COMMON +
├── Se medlemsregister (kontaktuppgifter, ej personnummer)
├── Hantera bokningar
└── Hantera dokument (uppladdning, kategorisering)

OPERATIONS_MANAGER (driftchef) = OPERATIONS_COMMON +
├── Allt ovanstående
├── Skapa och tilldela arbetsordrar
├── Hantera leverantörer (Contractor)
├── Se och planera besiktningskalender
├── Se personalregister (totalMonthlyCost)
├── Delegerad attesträtt (inom beloppsgräns)
└── Se ekonomisk driftöversikt
```

### Specialiseringar

| Roll | Typisk titel | Systemåtkomst | GDPR: ser kontaktuppgifter? |
|------|-------------|---------------|:---------------------------:|
| `OPERATIONS_MANAGER` | Driftchef, förvaltare | Full driftåtkomst | Ja — behöver kontakta boende + leverantörer |
| `OPERATIONS_CARETAKER` | Fastighetsskötare, vaktmästare | Felanmälningar + arbetsordrar | Ja, telefon — behöver nå boende vid reparation |
| `OPERATIONS_CLEANER` | Städare | Bara tilldelade arbetsordrar | Nej |
| `OPERATIONS_ADMIN` | Kontorsansvarig | Register + bokningar + dokument | Ja — medlemsservice |
| `OPERATIONS_CONTRACTOR` | Extern leverantör med systemåtkomst | Bara tilldelade arbetsordrar | Nej — minimalt |

### Vad operativa roller ALDRIG ser

- Styrelseprotokoll
- Styrelsemöten och dagordningar
- Motioner och styrelsens yttranden
- Ekonomisk detaljdata (utlägg, budget, bokföring)
- Personnummer
- Överlåtelser och medlemsansökningar
- Revisionsdata
- Individuella löner (finns inte i systemet)

---

## CX/UX: Förvaltningssektionen

### Navigationsstruktur

```
Förvaltning (ny sektion i sidomenyn)
├── Översikt          — driftchefens dashboard
├── Arbetsordrar      — lista, skapa, tilldela, följa upp
├── Personal          — anställda, roller, avtal, kostnad
├── Leverantörer      — register, avtal, PUB-avtal
├── Besiktningar      — kalender, kommande, förfallna
└── Komponenter       — byggnadsregister, underhållsplan
```

Synlig för: `OPERATIONS_MANAGER` ser allt, övriga operativa roller ser relevanta delar.

Styrelsemedlemmar med `report:manage` (fastighetsansvarig) ser också sektionen — de är den operativa ledarens uppdragsgivare.

### UX per roll: Vad möter den anställda?

#### Driftchefen (OPERATIONS_MANAGER)

Loggar in → Ser "Förvaltning" som primär sektion:

```
┌─────────────────────────────────────────────────┐
│  Förvaltning — Översikt                         │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ 7        │ │ 2        │ │ 1        │        │
│  │ Öppna    │ │ Kritiska │ │ Förfallen│        │
│  │ arbets-  │ │ felan-   │ │ besikt-  │        │
│  │ ordrar   │ │ mälningar│ │ ning     │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  Senaste arbetsordrar:                          │
│  ✓ Lampa trapphus B — Klar (igår)              │
│  → Kran lgh 2001 — Pågår (tilldelad: Erik)     │
│  ○ OVK-besiktning — Planerad (nästa vecka)     │
│                                                 │
│  Kommande besiktningar:                         │
│  ⚠ OVK Hus A — förfaller 15 april              │
│  ○ Hissbesiktning — 1 juni                     │
│                                                 │
│  Personal:                                      │
│  Erik (fastighetsskötare) — 3 aktiva ordrar    │
│  Maria (städare) — 1 aktiv order               │
└─────────────────────────────────────────────────┘
```

#### Fastighetsskötaren (OPERATIONS_CARETAKER)

Loggar in → Ser en **enkel, mobilvänlig** vy:

```
┌────────────────────────────────┐
│  Mina arbetsordrar             │
│                                │
│  ⚡ BRÅDSKANDE                 │
│  ┌────────────────────────────┐│
│  │ Vattenläcka lgh 3002      ││
│  │ Prio: URGENT              ││
│  │ → Öppna                   ││
│  └────────────────────────────┘│
│                                │
│  📋 ATT GÖRA                   │
│  ┌────────────────────────────┐│
│  │ Lampa trapphus B          ││
│  │ Prio: MEDIUM              ││
│  │ → Markera påbörjad        ││
│  └────────────────────────────┘│
│  ┌────────────────────────────┐│
│  │ Snöröjning parkering      ││
│  │ Prio: HIGH                ││
│  │ → Markera påbörjad        ││
│  └────────────────────────────┘│
│                                │
│  ✅ KLARA (senaste)            │
│  Kran lgh 1001 — Klar igår    │
│  Dörrlås entré — Klar 8 apr   │
│                                │
│  📍 Felanmälningar             │
│  3 nya sedan igår → Visa      │
└────────────────────────────────┘
```

**Mobil first** — fastighetsskötaren har telefonen i fickan, inte en laptop. Stora knappar, tydliga statusar, minimal text.

#### Städaren (OPERATIONS_CLEANER)

Loggar in → Extremt enkel vy:

```
┌────────────────────────────────┐
│  Mina uppgifter                │
│                                │
│  ☐ Trapphus A — Torsdag       │
│  ☐ Trapphus B — Torsdag       │
│  ☐ Fönsterputs — Fredag       │
│                                │
│  Markera som klar: [✓]        │
└────────────────────────────────┘
```

Inget mer. Ingen felanmälningslista, inga leverantörer, inga kontaktuppgifter. Bara: vad ska jag göra, och en knapp för "klar".

### Arbetsorder-flödet (UX)

```
Källa                        Driftchef                    Utförare
──────                       ─────────                    ────────
Felanmälan inkommer ────→    Ser på dashboard
                             Bedömer: vem kan fixa?
                             ↓
                             Skapar arbetsorder ─────→    Ser i sin lista
                             (titel, beskrivning,         (mobil notis)
                              prio, tilldelad)
                                                          ↓
                                                          Markerar "påbörjad"
                                                          ↓
                                                          Utför arbetet
                                                          ↓
                                                          Markerar "klar"
                                                          (valfritt: kommentar,
                                                           faktisk kostnad)
                             ↓
                             Ser "klar" i sin lista
                             Verifierar (valfritt)
                             ↓
                             Felanmälan → RESOLVED
                             Boende notifieras
```

**Nyckel-UX-principer:**

1. **En klick-tilldelning** — driftchef ser felanmälan, klickar "Skapa arbetsorder", väljer person → klart
2. **Mobil notis** — fastighetsskötaren får push/SMS: "Ny arbetsorder: Vattenläcka lgh 3002"
3. **Statusuppdatering utan formulär** — stora knappar: "Påbörjad" / "Klar"
4. **Automatisk koppling** — arbetsorder klar → felanmälan stängs → boende notifieras
5. **Fotodokumentation** — fastighetsskötaren kan fota före/efter (mobilkamera)

### Navigation: Vem ser vad

| Sektion | Driftchef | Fastighetsskötare | Städare | Kontorsadmin | Styrelse (fastighetsansvarig) |
|---------|:---------:|:----------------:|:-------:|:------------:|:----------------------------:|
| Förvaltning — Översikt | Y | — | — | — | Y |
| Arbetsordrar — alla | Y | — | — | — | Y (läs) |
| Arbetsordrar — mina | Y | Y | Y | — | — |
| Personal | Y | — | — | — | Y (läs) |
| Leverantörer | Y | — | — | — | Y |
| Besiktningar | Y | — | — | — | Y |
| Komponenter | Y | — | — | — | Y |
| Felanmälningar | Y | Y | — | — | Y |
| Bokningar | — | — | — | Y | — |
| Medlemsregister | — | — | — | Y | Y |

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
Liten BRF utan lokaler:          Fas A (1-5)
Medelstor BRF utan lokaler:      Fas A (1-5)
BRF med 1-2 lokaler (äkta):     Fas A + Fas B (7-8, 11)
BRF med många lokaler (äkta):   Fas A + Fas B (6-12) + bevakning
Oäkta BRF:                      Fas A + Fas B (6-12) — allt behövs + momsredovisning
```

---

## Sammanfattning

BRF:en har två ansikten:
- **Förening** — demokrati, stämma, stadgar, medlemsrättigheter
- **Företag** — drift, personal, leverantörer, ekonomi

Hemmet stödjer föreningssidan väl. Företagssidan saknas nästan helt. Delegationsmodellen är bryggan — den kopplar styrelsebeslut till operativ befogenhet med spårbarhet och gränser.

**Designprincip:** Kommersiella funktioner (hyresavtal, fakturering, moms) är alltid tillgängliga — en äkta BRF med en butikslokal behöver dem lika mycket. Äkta/oäkta är en beräknad status, inte en konfigurationsväljare.

**Bevakningsprincip:** Systemet beräknar löpande andelen kvalificerade intäkter och varnar om föreningen närmar sig oäkta-gränsen — innan det är för sent att agera. Ingen funktion blockeras — bara information och varningar.
