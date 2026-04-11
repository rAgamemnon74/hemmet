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

## Implementationsprioritering

| Prio | Funktion | Berör | Komplexitet |
|------|----------|-------|:-----------:|
| 1 | **Delegationsmodell** — vem har befogenhet för vad med vilken gräns | Styrelse → drift | Medel |
| 2 | **Operativa roller** (OPERATIONS_MANAGER/STAFF/CONTRACTOR) | Alla | Medel |
| 3 | **Arbetsordrar** (WorkOrder) kopplade till felanmälan/besiktning | Drift | Medel |
| 4 | **Beloppsgräns-validering** — automatisk check vid beställning | Kassör, drift | Låg |
| 5 | **Operativ dashboard** — arbetsordrar, felanmälningar, besiktningar | Driftansvarig | Medel |
| 6 | **Enkel tidrapportering** — timmar per anställd per vecka | Anställda | Låg |
| 7 | **Faktura-attest utökat** — leverantörsfakturor (inte bara utlägg) | Kassör, drift | Medel |

---

## Sammanfattning

BRF:en har två ansikten:
- **Förening** — demokrati, stämma, stadgar, medlemsrättigheter
- **Företag** — drift, personal, leverantörer, ekonomi

Hemmet stödjer föreningssidan väl. Företagssidan saknas nästan helt. Delegationsmodellen är bryggan — den kopplar styrelsebeslut till operativ befogenhet med spårbarhet och gränser.
