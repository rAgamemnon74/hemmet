# Överlåtelseprocessen i Hemmet

## Grundprincip

Systemet äger inte försäljningsprocessen. Hemmet **stödjer** BRF:ens hantering av resultatet från en extern process — oavsett om det är en mäklarförmedlad försäljning, privataffär, arv, bodelning eller exekutiv försäljning.

Systemets ansvar börjar när någon vill bli ny ägare av en bostadsrätt i föreningen.

---

## Del I — Triggerhändelser

Alla dessa leder till samma process i systemet: ett överlåtelseärende.

| Händelse | Initieras av | Mäklare? | Köpesumma? | Medlemsprövning? |
|----------|-------------|:--------:|:----------:|:----------------:|
| Försäljning (marknad) | Säljare via mäklare | Ja | Ja | Ja |
| Privatförsäljning | Säljare + köpare direkt | Nej | Ja | Ja |
| Arv | Dödsbo/arvinge | Nej | Nej (taxeringsvärde) | Ja |
| Bodelning (skilsmässa) | Part i bodelningen | Sällan | Nej (intern uppdelning) | Ja (om ej redan medlem) |
| Gåva | Givare + mottagare | Nej | Nej (gåvovärde) | Ja |
| Exekutiv försäljning | Kronofogden | Nej | Ja (tvångsförsäljning) | Ja |
| Byte av andel (samägande) | Befintliga ägare | Nej | Varierar | Beror på (redan medlem?) |

### Gemensamt för alla

Oavsett typ gäller:
1. Någon vill bli ägare → medlemsansökan
2. Styrelsen prövar medlemskap
3. Ekonomisk reglering (avgifter, pant)
4. Ägarskifte registreras
5. Gammal ägare fasas ut

---

## Del II — Systemets process (5 steg)

### Steg 1: Överlåtelseärende skapas

**Vem skapar:** Kassör, ordförande, eller förvaltare — efter att ha mottagit information om kommande överlåtelse (via mäklare, part direkt, eller myndighet).

**Data som registreras:**

| Fält | Källa | Obligatoriskt |
|------|-------|:------------:|
| Typ av överlåtelse | Försäljning/Arv/Bodelning/Gåva/Exekutiv | Ja |
| Lägenhet | Vilken bostadsrätt det gäller | Ja |
| Befintlig ägare | Koppling till nuvarande ApartmentOwnership | Ja |
| Tillträdesdag | Från köpekontrakt/avtal | Ja |
| Köpesumma | Från köpekontrakt (ej vid arv/gåva) | Villkorligt |
| Kontaktperson extern | Mäklare, jurist, dödsbodelägare etc. | Valfritt |

**Medlemsansökan kopplas:** Befintlig `MembershipApplication` (person eller organisation) kopplas till överlåtelseärendet. Ansökan kan redan existera eller skapas i samband med ärendet.

### Steg 2: Medlemsprövning

**Ansvarig:** Ordförande + styrelse

**Sakliga grunder för prövning (BrfL 2 kap. 3 §):**
- Ekonomisk förmåga (kreditvärdighet)
- Avsikt att bo i lägenheten (om stadgarna kräver)
- Juridisk person: verksamhetens art (om stadgarna begränsar)

**Otillåtna grunder (diskrimineringslagen):**
- Ålder, kön, etnicitet, religion, sexuell läggning, funktionsnedsättning, familjesituation

**Vad systemet ska kräva vid prövning:**

| Moment | Typ | Systemstöd |
|--------|-----|-----------|
| Kreditupplysning inhämtad | Checkbox + datum | Obligatoriskt för försäljning/exekutiv |
| Finansieringsbevis granskat | Checkbox + datum | Obligatoriskt för försäljning |
| Stadgarnas villkor kontrollerade | Checkbox | Alltid |
| Styrelseprotokoll med beslut | Koppling till Decision | Alltid |
| Motivering vid avslag | Fritext (obligatorisk) | Vid avslag |

**Tidsfrist:** Styrelsen ska svara inom "skälig tid". Praxis: 1-3 månader. Systemet bör varna om ärendet legat längre än 4 veckor utan beslut.

### Steg 3: Styrelsebeslut

**Tre möjliga utfall:**

| Utfall | Konsekvens | Systemåtgärd |
|--------|------------|-------------|
| **Godkänd** | Köparen blir medlem | Gå vidare till steg 4 |
| **Avslag** | Köparen kan överklaga till Hyresnämnden | Kräv dokumenterad motivering, bevara beslutsunderlag |
| **Villkorat** | T.ex. "godkänd under förutsättning att..." | Registrera villkor, bevaka uppfyllnad |

**Beslutsspår:** Koppla till mötesbeslut (Decision) med referens. Om beslutet tas per capsulam (utanför möte) ska det protokollföras vid nästa möte.

### Steg 4: Ekonomisk hantering

#### 4a. Överlåtelseavgift

**Beräkning:**
```
Prisbasbelopp 2026 = X kr (hämtas från konfiguration)
Avgift = prisbasbelopp × (BrfRules.transferFeeMaxPercent / 100)
```

**Vem betalar:** Bestäms av `BrfRules.transferFeePaidBySeller`
- true = säljaren betalar
- false = köparen betalar (vanligast)

**Systemstöd:**
- Automatisk beräkning baserat på BrfRules
- Faktura/avisering (eller notering att förvaltare hanterar)
- Status: obetald → betald

#### 4b. Panthantering

**Process:**
1. Säljarens bank begär avnotering av befintlig pant
2. BRF bekräftar avnotering
3. Köparens bank begär notering av ny pant
4. BRF bekräftar notering

**Pantsättningsavgift:**
```
Avgift = prisbasbelopp × (BrfRules.pledgeFeeMaxPercent / 100)
```

**Systemstöd:**
- Pantnoteringshistorik per lägenhet
- Status per notering: begärd → noterad → avnoterad
- Avgiftsberäkning

#### 4c. Utestående skulder

Innan ägarbyte: kontrollera om säljaren har obetalda avgifter.
- Om skuld finns: flagga ärendet, notera belopp
- Skulden följer lägenheten, inte personen (BrfL 7 kap. 16 §)

### Steg 5: Ägarregistrering

**När alla villkor uppfyllda:**
1. Befintlig `ApartmentOwnership` → `active: false`, `transferredAt: tillträdesdag`
2. Ny `ApartmentOwnership` skapas → `active: true`, `acquiredAt: tillträdesdag`
3. Ny `User` kopplas till `Apartment` (om inte redan existerande)
4. Roller uppdateras: köparen får MEMBER, säljarens MEMBER-roll kvarstår (kan vara medlem i annan lägenhet eller avslutas)

**Säljarens utträde:**
- Om säljaren inte äger annan bostadsrätt i föreningen: medlemskapet upphör
- GDPR-gallring initieras: personnummer/telefon/e-post raderas efter 7 år (bokföringslagen), namn + lägenhet + ekonomisk historik bevaras
- Systemet markerar kontot som inaktivt

---

## Del III — Föreslagen datamodell

### TransferCase (överlåtelseärende)

```
TransferCase {
  id
  apartmentId               // Vilken bostadsrätt
  type                      // SALE, INHERITANCE, DIVORCE_SETTLEMENT, GIFT, FORCED_SALE, SHARE_CHANGE
  status                    // INITIATED, MEMBERSHIP_REVIEW, APPROVED, REJECTED, APPEALED, COMPLETED, CANCELLED
  
  // Parter
  sellerId                  // Befintlig ägare (userId, nullable vid arv)
  buyerApplicationId        // Koppling till MembershipApplication
  
  // Extern kontakt
  externalContactName       // Mäklare, jurist, KFM-handläggare
  externalContactEmail
  externalContactPhone
  
  // Ekonomi
  transferPrice             // Köpesumma (nullable vid arv/gåva)
  transferFeeAmount         // Beräknad överlåtelseavgift
  transferFeePaidBy         // SELLER, BUYER
  transferFeePaidAt         // När avgiften betalades
  outstandingDebt           // Säljarens eventuella skuld till föreningen
  
  // Datum
  contractDate              // Köpekontraktets datum
  accessDate                // Tillträdesdag
  decisionDate              // Styrelsens beslutsdatum
  completedAt               // När ägarskiftet slutfördes
  
  // Prövning
  creditCheckDone           // Boolean
  creditCheckDate
  financingVerified         // Boolean
  financingVerifiedDate
  statuteCheckDone          // Boolean
  rejectionReason           // Fritext vid avslag
  
  // Kopplingar
  decisionId                // Styrelsebeslut (Decision)
  
  createdAt
  updatedAt
  createdById               // Vem som skapade ärendet
}
```

### TransferCaseStatus (enum)

```
INITIATED                   // Ärende skapat, inväntar ansökan/underlag
MEMBERSHIP_REVIEW           // Medlemsprövning pågår
APPROVED                    // Styrelsen godkänt
REJECTED                    // Styrelsen avslagit
APPEALED                    // Köparen överklagat till Hyresnämnden
FINANCIAL_SETTLEMENT        // Godkänt, ekonomisk reglering pågår
COMPLETED                   // Allt klart, ägarskifte registrerat
CANCELLED                   // Ärendet avbrutet (affären gick inte igenom)
```

### TransferType (enum)

```
SALE                        // Marknadsmässig försäljning
PRIVATE_SALE                // Privataffär (direkt mellan parter)
INHERITANCE                 // Arv
DIVORCE_SETTLEMENT          // Bodelning
GIFT                        // Gåva
FORCED_SALE                 // Exekutiv försäljning (Kronofogden)
SHARE_CHANGE                // Ändring av ägarandel mellan befintliga ägare
```

### MortgageNotation (pantnotering)

```
MortgageNotation {
  id
  apartmentId
  bankName                  // Långivarens namn
  amount                    // Pantbelopp
  notationDate              // När panten noterades
  denotationDate            // När panten avnoterades (null = aktiv)
  fee                       // Pantsättningsavgift
  feePaidAt
  requestedById             // Vem som begärde noteringen
  createdAt
}
```

---

## Del IV — Koppling till befintliga modeller

### Utöka MembershipApplication

```
MembershipApplication {
  // Befintliga fält...
  
  // Nytt: koppling till överlåtelse
  transferCaseId            // Nullable — koppling till TransferCase
}
```

### Utöka ApartmentOwnership

```
ApartmentOwnership {
  // Befintliga fält...
  
  // Nytt: koppling till överlåtelse
  transferCaseId            // Vilket ärende som skapade detta ägarskap
}
```

### BrfRules (befintliga, redan implementerade)

```
transferFeeMaxPercent       // 2.5 (default)
pledgeFeeMaxPercent         // 1.0 (default)
transferFeePaidBySeller     // false (default = köparen betalar)
```

### Nytt i BrfRules

```
transferDecisionDeadlineWeeks  Int @default(4)  // Varning om ärendet legat längre
prisbasbelopp                  Int @default(57300) // 2026 års prisbasbelopp (uppdateras årligen)
```

---

## Del V — Roller i överlåtelseprocessen

| Steg | Ordförande | Kassör | Sekreterare | Fastighetsansv. | Förvaltare (extern) |
|------|:---------:|:------:|:-----------:|:---------------:|:-------------------:|
| 1. Skapa ärende | Y | Y | - | - | Y |
| 2. Medlemsprövning | Beslutar | Kreditkontroll | - | - | Underlag |
| 3. Styrelsebeslut | Leder | Deltar | Protokollför | Deltar | - |
| 4a. Överlåtelseavgift | - | Hanterar | - | - | Fakturerar |
| 4b. Pantnotering | - | Hanterar | - | - | Hanterar |
| 4c. Skuldkontroll | - | Kontrollerar | - | - | Rapporterar |
| 5. Ägarregistrering | - | - | Registrerar | - | Registrerar |

### Permissions som behövs

```
transfer:create             // Skapa överlåtelseärende (ordförande, kassör, admin)
transfer:review             // Granska och fatta beslut (ordförande, styrelse)
transfer:manage_financial   // Hantera avgifter och pant (kassör, admin)
transfer:view               // Se överlåtelseärenden (styrelse)
```

---

## Del VI — Systemvarningar och säkerhetsnät

### Automatiska varningar

| Varning | Trigger | Mottagare |
|---------|---------|-----------|
| Ärende utan beslut > 4 veckor | `transferDecisionDeadlineWeeks` överskriden | Ordförande |
| Avslag utan motivering | `rejectionReason` tomt vid REJECTED | Blockerar statusändring |
| Kreditkontroll ej utförd | `creditCheckDone` = false vid godkännande | Varning (kan överridas) |
| Tillträdesdag passerad utan slutfört ärende | `accessDate` < idag, status ≠ COMPLETED | Ordförande + kassör |
| Säljare har utestående skuld | `outstandingDebt` > 0 | Kassör |

### Koppling till juridiska pitfalls (STYRELSEN_KRAV.md)

| Pitfall | Systemskydd |
|---------|------------|
| #2 Felaktigt nekade medlemskap | Obligatorisk motivering, standardiserade grunder, beslutsspår |
| #5 Ekonomiskt vilseledande | Överlåtelseavgift beräknas automatiskt från BrfRules |
| #6 GDPR-incidenter | Personnummer maskerat, åtkomstloggning, gallring vid utträde |

---

## Del VII — UI-flöde

### Styrelsevy: Överlåtelser (/styrelse/overlatelser)

```
Lista alla pågående och historiska överlåtelser
├── Filtrera: typ, status, lägenhet
├── Snabbvy: lägenhet, köpare, tillträdesdag, status
└── Detaljvy per ärende:
    ├── Ärendeöversikt (typ, parter, datum)
    ├── Medlemsprövning (checklistor, kreditupplysning)
    ├── Beslut (koppling till styrelsemöte/decision)
    ├── Ekonomi (överlåtelseavgift, pant, skuld)
    ├── Tidslinje (alla statusändringar med datum)
    └── Dokument (köpekontrakt, kreditupplysning, fullmakt)
```

### Kassörvy: Ekonomisk vy per ärende

```
├── Beräknad överlåtelseavgift (automatisk från BrfRules)
├── Betalningsstatus
├── Pantnoteringshistorik
├── Utestående skuld hos säljare
└── Slutlig ekonomisk sammanfattning
```

### Medlemsvy: Visa eget ägarskap (Min sida)

```
Min lägenhet → Ägarhistorik
├── Nuvarande ägare
├── Förvärvsdatum
├── Aktiva pantnoteringar (antal, inte belopp — det är privat)
└── Eventuellt pågående överlåtelseärende
```
