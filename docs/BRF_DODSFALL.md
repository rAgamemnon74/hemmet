# Dödsfall i BRF — process och systemstöd

## Grundprincip

Ett dödsfall är en **ärendetyp** — inte en separat process. Det hanteras som ett ärende under styrelsens löpande arbete, med specifika steg och dokumentationskrav.

---

## Aktörer

| Aktör | Roll | Systemkoppling |
|-------|------|:-:|
| **Den avlidne** | Tidigare medlem | User (exitReason: DEATH) |
| **Dödsboet** | Juridisk konstruktion som äger bostadsrätten | Temporärt — fritextfält |
| **Dödsborepresentant** | Släkting, jurist, boutredningsman | Kontaktuppgifter på ärendet |
| **Styrelsen** | Verifierar dödsfall, inväntar dödsboet | Ordförande/kassör |
| **Skatteverket** | Folkbokföring, dödsfallsintyg, bouppteckningsregistrering | Extern — offentlig handling |
| **Tingsrätten** | Utser boutredningsman vid behov | Extern |

## Dödsborepresentanter

| Representant | Vanligast vid | Hur styrelsen kontaktar |
|-------------|:------------:|------------------------|
| Efterlevande make/maka | Gift par — bor ofta kvar | Redan känd |
| Barn/barnbarn | Förälder avliden | Via bouppteckning eller den avlidnes kontakter |
| Annan släkting | Inga barn/make | Via bouppteckning |
| Boutredningsman (jurist) | Komplicerade dödsbon, tvister | Tingsrätten utser, kontaktas formellt |
| God man | Omyndiga/sjuka arvingar | Överförmyndarnämnden |

---

## Process

### Steg 1: Styrelsen får reda på dödsfallet

**Hur det brukar ske:**
- Dödsboet (anhörig) kontaktar styrelsen
- Mäklare kontaktar vid kommande försäljning
- Ekonomisk förvaltare rapporterar obetalda avgifter
- Granne informerar

### Steg 2: Verifiera dödsfallet

Styrelsen registrerar **aldrig** dödsfall baserat på hörsägen.

**Verifiering via Skatteverket:**
- Personbevis (visar att personen är avliden + dödsdatum)
- Offentlig handling — vem som helst kan begära ut
- Gratis digitalt, 75 kr på papper
- Skatteverket.se eller telefon

Styrelsen kan självständigt verifiera utan att invänta dödsboet.

### Steg 3: Registrera i systemet

```
Nytt ärende (ärendetyp: DÖDSFALL)
├── Koppling till User (den avlidne)
├── Dödsdatum (från personbevis)
├── Verifikation: personbevis uppladdad som dokument
├── Dödsbo-kontakt: namn, telefon, e-post, relation
└── Status: REGISTRERAT
```

User uppdateras:
```
exitedAt: dödsdatum
exitReason: "DEATH"
exitDocumentId: personbeviset
estateContactName: "Lisa Svensson (dotter)"
estateContactPhone: "070-123 45 67"
estateContactEmail: "lisa@example.se"
```

### Steg 4: Invänta dödsboet

Dödsboet äger bostadsrätten tills de agerar. **Ingen tidsgräns** — men de måste betala avgiften.

```
Dödsboet har tre val:
├── Sälj → Mäklare → TransferCase (type: INHERITANCE/SALE)
├── Arvinge tar över → MembershipApplication
└── Behåll tillfälligt → Dödsboet betalar avgift
```

### Steg 5: Överlåtelse eller arvskifte

```
Dödsboet beslutar → TransferCase skapas
├── type: INHERITANCE (arv) eller SALE (dödsboet säljer)
├── sellerId: null (den avlidne — redan utträdd)
├── Kontaktperson: dödsborepresentanten
├── Bouppteckning som underlag
└── Normal överlåtelseprocess i övrigt
```

### Steg 6: Ärendet avslutas

```
Överlåtelse COMPLETED
└── Ärendet stängs
    ├── Dödsbo-kontaktuppgifter gallras (3 mån)
    ├── Den avlidnes persondata gallras (7 år — bokföringslagen)
    └── Namn + lägenhetshistorik bevaras permanent
```

---

## Tidslinjer

| Händelse | Typisk tid | Ansvarig |
|----------|:----------:|----------|
| Dödsfall inträffar | Dag 0 | — |
| Styrelsen informeras | Dag 1-30 | Anhörig/granne |
| Personbevis begärs | Dag 1-7 (efter info) | Kassör/ordförande |
| Bouppteckning upprättas | Inom 3 mån | Dödsboet |
| Bouppteckning registreras (Skatteverket) | 4-6 mån | Dödsboet |
| Dödsboet beslutar om lägenheten | 1-12 mån | Dödsboet |
| Överlåtelse/arvskifte | 3-18 mån | Dödsboet + styrelsen |

**Kassörens bevakning:** Om avgiften inte betalas efter 2-3 månader → kontakta dödsborepresentanten. Om ingen kontakt alls → begär personbevis + kolla bouppteckning.

---

## Specialfall

### Efterlevande make/maka bor kvar

Vanligaste scenariot. Maken/makan är troligen redan medlem (samägande). Om inte:
- Bouppteckning visar att maken ärver bostadsrätten
- MembershipApplication → normal prövning
- Ingen avbrott i boendet — maken bor kvar hela tiden

### Ingen kontaktbar dödsbodelägare

- Begär bouppteckning från Skatteverket (offentlig handling efter registrering)
- Bouppteckningen listar alla dödsbodelägare
- Kontakta dem via offentliga uppgifter

### Dödsboet betalar inte avgiften

- Normal inkassoprocess
- Dödsboet är betalningsskyldigt
- I yttersta fall: förverkande (BrfL 7:18) — även dödsbon kan förverkas

### Arvinge vill inte bli medlem

- Arvingen kan sälja utan att bli medlem
- Arvinges överlåtelse → TransferCase (type: SALE)
- Köparen ansöker om medlemskap — normal process

---

## Ärendetyp: Dödsfall

### Plats i systemet

Dödsfall hanteras under **Ärenden** (Task/ärende-systemet) — inte som en separat modul. Det är en ärendetyp med specifika steg, precis som överlåtelse, andrahand eller renovering.

Alla styrelsens löpande arbete följer samma mönster:

| Ärendetyp | Modell idag | Bör finnas under |
|-----------|-------------|:----------------:|
| Överlåtelse | TransferCase | Ärenden |
| Medlemsansökan | MembershipApplication | Ärenden |
| Andrahandsansökan | SubletApplication | Ärenden |
| Renoveringsansökan | RenovationApplication | Ärenden |
| Störningsärende | DisturbanceCase | Ärenden |
| Felanmälan | DamageReport | Ärenden |
| Dödsfall | **Saknar egen modell** — hanteras via User.exitReason + TransferCase | Ärenden |

### Behövs en egen modell?

**Nej** — dödsfall använder befintliga modeller:
- `User.exitReason = "DEATH"` + `exitedAt` + `exitDocumentId`
- `User.estateContactName/Phone/Email` (nya fält)
- `TransferCase` (type: INHERITANCE) för överlåtelsen
- `Document` för personbevis/bouppteckning
- `ActivityLog` för spårbarhet

Det enda som saknas är dödsbo-kontaktfälten på User.

### Framtida: Samlad ärendevy

Alla ärendetyper ovan bör på sikt samlas i en **enhetlig ärendevy** i styrelsearbetet:

```
Styrelse → Ärenden
├── Alla ärenden (filtrerbara per typ)
│   ├── 2 överlåtelser
│   ├── 1 medlemsansökan
│   ├── 1 störningsärende
│   ├── 3 felanmälningar
│   └── 1 dödsfall
├── Mina tilldelade
└── Förfallna (deadline passerad)
```

---

## Systemstöd: Nya fält på User

```
User {
  // Befintliga exit-fält
  exitedAt        DateTime?
  exitReason      String?       // TRANSFER, EXCLUSION, VOLUNTARY, DEATH
  exitDocumentId  String?       // Personbevis/dödsfallsintyg

  // Nytt: dödsbo-kontakt (temporära, gallras efter ärendet)
  estateContactName   String?   // "Lisa Svensson (dotter)"
  estateContactPhone  String?
  estateContactEmail  String?
}
```

Dödsbo-kontaktuppgifterna gallras automatiskt 3 månader efter att överlåtelsen slutförts (GDPR — temporär behandling, berättigat intresse under pågående ärende).
