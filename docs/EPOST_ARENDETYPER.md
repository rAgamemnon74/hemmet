# E-postintegration — Ärendetyper per inkorg

Komplett mappning av inkommande e-post till ärendetyper, funktionell inkorg och krav per ärendetyp.

---

## Översikt

| # | Ärendetyp | Inkorg | Typisk avsändare | Frekvens | Identifieringskrav |
|---|-----------|--------|-------------------|----------|--------------------|
| 1 | Försäljning (SALE) | Styrelsen | Mäklare | Hög | Mäklare + lägenhet |
| 2 | Privatförsäljning (PRIVATE_SALE) | Styrelsen | Säljare/köpare | Låg | Medlem + köpare |
| 3 | Arv (INHERITANCE) | Styrelsen | Jurist/dödsbo | Låg | Dödsbo + lägenhet |
| 4 | Dödsfall (initialt) | Styrelsen | Anhörig/jurist | Låg | Avliden medlem |
| 5 | Bodelning (DIVORCE_SETTLEMENT) | Styrelsen | Jurist | Låg | Medlem + lägenhet |
| 6 | Gåva (GIFT) | Styrelsen | Medlem/jurist | Sällsynt | Medlem + mottagare |
| 7 | Exekutiv försäljning (FORCED_SALE) | Styrelsen | Kronofogden | Sällsynt | Myndighetspost |
| 8 | Motion | Styrelsen | Medlem | Säsong | Verifierad medlem |
| 9 | Felanmälan | Förvaltning | Boende | Hög | Valfritt |
| 10 | Renovering | Styrelsen | Medlem | Medel | Verifierad medlem |
| 11 | Andrahand | Styrelsen | Medlem | Medel | Verifierad medlem |
| 12 | Störning | Styrelsen | Boende | Låg | Valfritt |
| 13 | Förslag | Styrelsen | Boende/medlem | Medel | Valfritt |
| 14 | Offert/besiktning | Förvaltning | Entreprenör | Hög | Känd entreprenör |
| 15 | Faktura | Ekonomi | Leverantör | Hög | Leverantör + belopp |
| 16 | Försäkring | Ekonomi | Försäkringsbolag | Låg | Referensnr |
| 17 | Bank/lån | Ekonomi | Bank | Låg | Avtalsnr |
| 18 | Revision | Ekonomi | Revisor | Säsong | Känd revisor |
| 19 | Myndighetspost | Förvaltning/Styrelsen | Myndighet | Låg | Domänidentifiering |
| 20 | Pantsättning | Ekonomi | Bank | Hög | Lägenhet + bank |

---

## 1. Försäljning via mäklare (SALE)

**Frekvens:** Hög — den vanligaste överlåtelsetypen. En BRF med 100 lägenheter har kanske 5–15 försäljningar per år.

**Typiskt första mail:**
```
Från: anna.bergman@maklarfirman.se
Ämne: Överlåtelse — Storgatan 1A lgh 1008, BRF Exempelgården
Brödtext: "Hej,

Jag företräder säljaren Maria Svensson avseende försäljning
av bostadsrätt lgh 1008. Köpare är Johan och Lisa Andersson.

Tillträde planeras 2026-06-01. Köpesumma 2 850 000 kr.

Bifogar:
- Överlåtelseavtal (signerat)
- Medlemsansökan köpare
- Lånelöfte Handelsbanken

Vänligen bekräfta mottagande och meddela överlåtelseavgift.

Med vänlig hälsning,
Anna Bergman, Fastighetsmäklare
Mäklarfirman AB
anna.bergman@maklarfirman.se | 073-123 4567"
```

### Vad systemet gör

#### Mäklaridentifiering
```
👤 AVSÄNDARE
  anna.bergman@maklarfirman.se

  ○ Ny kontakt — finns inte i systemet
  ● Känd mäklare — Anna Bergman, Mäklarfirman AB
    Tidigare ärenden: 2 överlåtelser (2025)

  [Spara som kontakt / Koppla till Contractor]
```

Mäklare är **extern part**, inte medlem. Systemet bygger upp en kontaktbok av mäklare som återkommer. Ingen medlemsverifiering — mäklaren representerar parterna.

#### Parsning av överlåtelsedata
```
┌─ Identifierad överlåtelse ─────────────────────────────┐
│                                                         │
│  Typ: Försäljning (SALE)                                │
│  Lägenhet: lgh 1008 → Storgatan 1A, lgh 1008           │
│                                                         │
│  Säljare: Maria Svensson                                │
│    → ✅ Match: Maria Svensson, lgh 1008, aktiv medlem  │
│                                                         │
│  Köpare: Johan och Lisa Andersson                       │
│    → ❓ Ej i systemet (förväntat — nya medlemmar)      │
│                                                         │
│  Köpesumma: 2 850 000 kr                                │
│  Tillträde: 2026-06-01                                  │
│                                                         │
│  📎 3 bilagor identifierade                            │
└─────────────────────────────────────────────────────────┘
```

#### Automatisk beräkning
```
┌─ Avgifter ─────────────────────────────────────────────┐
│                                                         │
│  Överlåtelseavgift: 1 575 kr                           │
│    (2,5% av prisbasbelopp 2026: 63 000 kr)              │
│    Betalas av: [Säljare ▼] (enligt stadgarna)          │
│                                                         │
│  Pantsättningsavgift: 630 kr                           │
│    (1% av prisbasbelopp — om ny pant registreras)       │
│                                                         │
│  Månadskostnad lgh 1008: 4 850 kr/mån                  │
│  Utestående skuld säljare: 0 kr ✅                     │
└─────────────────────────────────────────────────────────┘
```

#### Checklista (auto-genererad)
```
┌─ Prövning ─────────────────────────────────────────────┐
│                                                         │
│  ☐ Överlåtelseavtal mottaget                           │
│  ☐ Medlemsansökan köpare mottagen                      │
│  ☐ Kreditkontroll köpare                               │
│  ☐ Finansiering verifierad (lånelöfte)                  │
│  ☐ Stadgecheck (ägarskapstak, juridisk person, etc.)    │
│  ☐ Styrelsebeslut                                      │
│  ☐ Meddelande till mäklare (godkänt/avslag)            │
│  ☐ Överlåtelseavgift fakturerad                        │
│  ☐ Ekonomisk reglering klar                            │
│  ☐ Nytt medlemskap registrerat                         │
│  ☐ Gammalt medlemskap avslutat                         │
└─────────────────────────────────────────────────────────┘
```

#### Krav för ärendeskapande

| Krav | Status | Kommentar |
|------|--------|-----------|
| Lägenhet identifierad | Obligatoriskt | Parsas från mail eller manuellt |
| Säljare identifierad | Obligatoriskt | Matchas mot nuvarande ägare |
| Köpare identifierad | Ej krav vid skapande | Medlemsansökan skapas separat |
| Mäklare/kontaktperson | Rekommenderat | Sparar som extern kontakt |
| Köpesumma | Rekommenderat | Underlag för avgiftsberäkning |
| Tillträdesdatum | Rekommenderat | Sätter deadline för processen |

#### Bekräftelsemail till mäklare
```
Från: styrelsen@brfexempel.se
Till: anna.bergman@maklarfirman.se
Ämne: Re: Överlåtelse — Storgatan 1A lgh 1008

Hej Anna,

Tack, vi har mottagit underlagen för överlåtelse av lgh 1008.
Ärendenummer: ÖVL-2026-007.

Överlåtelseavgift: 1 575 kr (betalas av säljaren).
Pantsättningsavgift: 630 kr (vid ny pant).

Vi återkommer med besked om medlemskap efter styrelsens
prövning. Handläggningstid normalt 2–4 veckor.

Vid frågor, kontakta oss på detta mejl eller ring
ordförande Erik Larsson: 070-XXX XXXX.

Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
```

#### Smart: Pågående ärende + uppföljning

Mäklaren kommer att mejla igen — kompletteringar, frågor om lånelöfte, påminnelse om beslut. Alla svar trådar automatiskt via plus-adressering.

```
⏰ Väntande i överlåtelse ÖVL-2026-007:
   ☐ Kreditkontroll — beställ via UC/Creditsafe
   ☐ Styrelsebeslut — nästa styrelsemöte 2026-04-22
   
   Mäklaren frågade 2026-04-15:
   "Hej, har ni hunnit göra kreditkontrollen?"
   → Obesvarat i 2 dagar
```

---

## 2. Privatförsäljning (PRIVATE_SALE)

**Frekvens:** Låg. Försäljning utan mäklare — parterna hanterar själva.

**Typiskt mail:**
```
Från: maria.svensson@företag.se
Ämne: Försäljning av min lägenhet 1008
"Hej, jag har sålt min lägenhet till min granne
Per Johansson i lgh 1009. Vi har gjort upp privat.
Hur gör vi med överlåtelsen?"
```

### Krav

| Krav | Skillnad mot mäklarledd |
|------|------------------------|
| Säljare identifierad | Obligatoriskt — **måste vara verifierad medlem** (till skillnad från mäklarledd där mäklaren intygar) |
| Köpare identifierad | Namn + kontaktuppgifter |
| Köpeavtal | Systemet bör fråga om skriftligt avtal finns |
| Köpesumma | Rekommenderat (underlag för avgift) |

```
💡 Privatförsäljning kräver extra omsorg:
   - Inget mäklaransvar för underlag
   - Styrelsen bör verifiera att båda parter är överens
   - Köpeavtal bör begäras in
   - Kreditkontroll av köpare är särskilt viktig

Föreslaget svar med instruktioner:
"Hej Maria, tack för informationen. För att vi ska
kunna hantera överlåtelsen behöver vi:
1. Undertecknat köpeavtal
2. Medlemsansökan från köparen (Per)
3. Köparens kontaktuppgifter
4. Överenskommen köpesumma
5. Önskat tillträdesdatum

Per kan lämna in sin medlemsansökan via Hemmet:
[länk]"
```

---

## 3. Arv (INHERITANCE)

**Frekvens:** Låg men känslomässigt komplex.

**Typiskt mail:**
```
Från: advokat.nilsson@juristbyran.se
Ämne: Dödsbo Karl Pettersson — bostadsrätt lgh 3001
"Jag företräder dödsboet efter Karl Pettersson, tidigare
innehavare av bostadsrätt lgh 3001 i er förening.

Karl avled 2026-03-01. Dödsbodelägare är:
- Lisa Pettersson (maka)
- Anna Pettersson (dotter)
- Erik Pettersson (son)

Dödsboet avser att överföra bostadsrätten till Lisa
Pettersson som ensam ägare. Bouppteckning bifogas.

Vänligen meddela vilka underlag ni behöver."
```

### Krav

| Krav | Kommentar |
|------|-----------|
| Avliden identifierad | Matchas mot befintlig medlem/ägare |
| Dödsbo/representant | Jurist eller dödsbodelägare |
| Bouppteckning | Krävs som underlag |
| Ny ägare identifierad | Vem som ska ta över |
| Medlemsansökan ny ägare | Om inte redan medlem |

### Systemets beteende

```
┌─ Identifierat arvsärende ──────────────────────────────┐
│                                                         │
│  Typ: Arv (INHERITANCE)                                 │
│  Avsändare: Advokat Nilsson, Juristbyrån AB             │
│                                                         │
│  Avliden: Karl Pettersson                               │
│    → ✅ Match: Karl Pettersson, lgh 3001                │
│    → Medlem sedan: 2005-04-01                           │
│    → Ägare: 50% (delat med Lisa Pettersson)             │
│                                                         │
│  Lisa Pettersson                                        │
│    → ✅ Match: befintlig medlem, äger 50% av lgh 3001  │
│    → Medlemsansökan behövs EJ (redan medlem)            │
│    → Ägarandel uppdateras: 50% → 100%                  │
│                                                         │
│  📎 Bouppteckning bifogad                              │
│                                                         │
│  ⚠ Överlåtelseavgift tas normalt INTE ut vid arv       │
│    till närstående (kontrollera stadgarna).              │
│                                                         │
│  Åtgärder:                                              │
│  ☐ Verifiera bouppteckning                             │
│  ☐ Uppdatera ägarandel Lisa Pettersson → 100%          │
│  ☐ Avsluta Karl Petterssons medlemskap (dödsfall)      │
│  ☐ Hantera eventuella pantbrev                         │
│  ☐ Meddela advokaten om avgifter och process           │
└─────────────────────────────────────────────────────────┘
```

### Bekräftelse till advokaten
```
Hej,

Tack för informationen om dödsboet efter Karl Pettersson.
Vi beklagar sorgen.

Vi har registrerat ärendet (ref: ÖVL-2026-012). 
För att genomföra överlåtelsen behöver vi:

1. Bouppteckning (mottagen ✓)
2. Arvskifteshandling eller dödsbodelägares samtycke
   till överlåtelse till Lisa Pettersson
3. Eventuellt testamente

Eftersom Lisa Pettersson redan är delägare och medlem
behövs ingen ny medlemsansökan.

Överlåtelseavgift: enligt stadgarna utgår normalt ingen
avgift vid arv till maka/make/sambo.

Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
```

---

## 4. Dödsfall — initialt meddelande

**Skillnad mot arv:** Ibland kommer dödsfallsmeddelandet *innan* arvsfrågorna är utredda. Det första mailet handlar inte om överlåtelse — det handlar om att informera styrelsen.

**Typiskt mail:**
```
Från: anna.pettersson@gmail.com
Ämne: Pappa Karl Pettersson har gått bort
"Hej, jag vill meddela att min far Karl Pettersson
i lgh 3001 avled den 1 mars. Vi håller på med
bouppteckning och återkommer om lägenheten.
Det står en del post i hans brevlåda."
```

### Systemets beteende

Dödsfallet är inget överlåtelseärende ännu — det är ett **informationsärende** som *kan leda till* överlåtelse.

```
┌─ Dödsfallsmeddelande ──────────────────────────────────┐
│                                                         │
│  Typ: Dödsfall (information)                            │
│                                                         │
│  Avliden: Karl Pettersson                               │
│    → ✅ Match: Karl Pettersson, lgh 3001                │
│    → Medlem sedan: 2005-04-01                           │
│                                                         │
│  Kontaktperson: Anna Pettersson (dotter)                │
│    anna.pettersson@gmail.com                             │
│                                                         │
│  ⚠ Åtgärder vid dödsfall:                              │
│                                                         │
│  Omedelbart:                                            │
│  ☐ Registrera dödsfall i systemet                      │
│    (Karls konto markeras, utträdesorsak: DECEASED)      │
│  ☐ Pausa eventuella automatiska utskick till Karl      │
│  ☐ Notera kontaktperson för dödsboet                   │
│                                                         │
│  Praktiskt:                                             │
│  ☐ Hantera post/leveranser till lägenheten             │
│  ☐ Kontrollera om Karl hade styrelsuppdrag             │
│    → ⚠ Karl var ledamot i valberedningen               │
│  ☐ Kontrollera pågående ärenden                        │
│    → Inga pågående ärenden                              │
│                                                         │
│  Ekonomiskt:                                            │
│  ☐ Avgifter fortsätter till dödsboet tills överlåtelse │
│  ☐ Fakturering riktas till dödsboet                    │
│                                                         │
│  Senare (när bouppteckning klar):                       │
│  ☐ Skapa överlåtelseärende (arv)                       │
│                                                         │
│  💡 Lägenheten representeras av dödsboet tills          │
│     överlåtelse sker. Styrelsen bör inte driva          │
│     processen — avvakta dödsboets kontakt.              │
└─────────────────────────────────────────────────────────┘
```

### Svar till anhörig
```
Hej Anna,

Vi beklagar sorgen efter Karl. Vi har noterat informationen.

Vad gäller lägenheten:
- Månadsavgiften fortsätter att gälla tills överlåtelse sker
- Ni behöver inte skynda — ta den tid ni behöver
- När bouppteckningen är klar återkommer ni till oss
  om hur lägenheten ska hanteras
- Vi kan hjälpa till att vidarebefordra post om ni önskar

Om Karl hade nycklar till gemensamma utrymmen, kontakta
oss så löser vi det.

Med varma hälsningar,
Styrelsen, BRF Exempelgården
```

### Koppling dödsfall → överlåtelse

Systemet skapar en `Task` eller intern notering vid dödsfallet. När advokaten/dödsboet senare kontaktar om överlåtelse kopplas det befintliga dödsfallsärendet till den nya `TransferCase`:

```
📋 Kopplat ärende:
  Dödsfall Karl Pettersson (2026-03-01)
  Kontaktperson dödsboet: Anna Pettersson / Advokat Nilsson
  → Överlåtelseärende ÖVL-2026-012 (arv)
```

---

## 5. Bodelning (DIVORCE_SETTLEMENT)

**Typiskt mail från jurist:**
```
Från: familjerätt@advokatfirman.se
Ämne: Bodelning — lgh 2005, BRF Exempelgården
"I samband med äktenskapsskillnad mellan Erik och
Sara Lindström ska bostadsrätten lgh 2005 överföras
till Sara Lindström som ensam ägare.
Bodelningsavtal bifogas."
```

### Krav

| Krav | Kommentar |
|------|-----------|
| Parterna identifierade | Båda bör matchas mot befintliga ägare |
| Bodelningsavtal | Juridiskt underlag — obligatoriskt |
| Ny ägarfördelning | Vem övertar, andel |
| Medlemsansökan | Om mottagaren inte redan är medlem |

```
┌─ Identifierad bodelning ──────────────────────────────┐
│                                                         │
│  Lgh 2005 — nuvarande ägare:                           │
│    Erik Lindström (50%) — ✅ medlem                    │
│    Sara Lindström (50%) — ✅ medlem                    │
│                                                         │
│  Ny fördelning: Sara Lindström 100%                     │
│                                                         │
│  Sara är redan medlem — ingen ny ansökan behövs.        │
│  Eriks medlemskap avslutas efter överlåtelse.           │
│                                                         │
│  📎 Bodelningsavtal bifogat                            │
│                                                         │
│  ⚠ Överlåtelseavgift vid bodelning:                   │
│    Kontrollera stadgarna — många föreningar tar         │
│    inte ut avgift vid bodelning mellan makar.           │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Gåva (GIFT)

**Sällsynt.** Typiskt förälder → barn.

### Krav

| Krav | Kommentar |
|------|-----------|
| Givare identifierad | Nuvarande ägare, verifierad medlem |
| Mottagare identifierad | Namn + kontaktuppgifter |
| Gåvobrev | Juridiskt underlag |
| Medlemsansökan mottagare | Om inte redan medlem |
| Kreditkontroll mottagare | Mottagaren ska klara avgifterna |

```
💡 Vid gåva gäller samma medlemsprövning som vid
   försäljning. Att det är en gåva påverkar inte
   styrelsens rätt att pröva mottagarens lämplighet.
```

---

## 7. Exekutiv försäljning (FORCED_SALE)

**Avsändare: Kronofogdemyndigheten (KFM)**

```
Från: infokontor@kronofogden.se
Ämne: Exekutiv försäljning — bostadsrätt BRF Exempelgården
"Kronofogdemyndigheten har beslutat om exekutiv försäljning
av bostadsrätt tillhörande [namn], lägenhetsnr [X].
Mål nr: E-XXXX-XXXX.

Föreningen anmodas inkomma med uppgift om:
- Insats och årsavgift
- Eventuella skulder till föreningen
- Överlåtelsebegränsningar i stadgarna
- Pantförteckning"
```

### Systemets beteende

```
⚠ MYNDIGHETSPOST — KRONOFOGDEN
  Exekutiv försäljning

  ⛔ Styrelsen äger INTE denna process. Kronofogden driver
     försäljningen. Styrelsens uppgift:
     1. Lämna begärda uppgifter
     2. Pröva köparens medlemskap (efter budgivning)
     3. Fakturera överlåtelseavgift

  Begärd information:
  ☐ Insats lgh [X]: [auto-hämtas från Apartment]
  ☐ Årsavgift: [auto-hämtas]
  ☐ Skulder till föreningen: [auto-hämtas från ekonomi]
  ☐ Stadgebegränsningar: [auto-hämtas från BrfRules]
  ☐ Pantförteckning: [auto-hämtas från MortgageNotation]

  [Generera svar med automatiska uppgifter]
```

Systemet kan **förifyllla svaret** med data det redan har:

```
Kronofogdemyndigheten
Mål nr: E-XXXX-XXXX

Angående bostadsrätt lgh [X], BRF Exempelgården:

Insats: 650 000 kr
Årsavgift: 4 850 kr/mån (58 200 kr/år)
Skuld till föreningen: 0 kr
Överlåtelseavgift: 1 575 kr

Pantförteckningar:
1. Handelsbanken — 2 000 000 kr (reg. 2019-03-15)
2. SBAB — 500 000 kr (reg. 2021-06-01)

Stadgebegränsningar: Inga särskilda begränsningar
utöver medlemsprövning enligt BrfL 2:3.

Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
```

---

## 8. Pantsättning

**Frekvens:** Hög — varje gång en ägare tar nytt lån eller byter bank.

**Typiskt mail:**
```
Från: pant@handelsbanken.se
Ämne: Pantsättningsansökan — lgh 2003, BRF Exempelgården
"Vi önskar notera pant om 1 500 000 kr i ovan
bostadsrätt för låntagare Erik Lindqvist.
Org.nr: 769000-XXXX, Insats: 500 000 kr."
```

### Krav

| Krav | Kommentar |
|------|-----------|
| Lägenhet identifierad | Obligatoriskt |
| Ägare verifierad | Matchas mot nuvarande ägare |
| Bank identifierad | Pantagare |
| Belopp | Pantbelopp |
| Befintliga pantbrev | Visas för kontext |

```
┌─ Pantsättning ─────────────────────────────────────────┐
│                                                         │
│  Lgh 2003 — Erik Lindqvist ✅                          │
│                                                         │
│  Ny pant: 1 500 000 kr — Handelsbanken                 │
│                                                         │
│  Befintliga pantbrev:                                   │
│    SBAB: 2 000 000 kr (2020-01-15)                      │
│    Total pant inkl. ny: 3 500 000 kr                    │
│                                                         │
│  Pantsättningsavgift: 630 kr                           │
│  Betalas av: Låntagaren                                │
│                                                         │
│  [Skapa pantnotering]                                  │
│  [Bekräfta till banken + fakturera avgift]              │
└─────────────────────────────────────────────────────────┘
```

**Inkorg: Ekonomi** — kassören hanterar, men kan delegeras till ordförande.

---

## 9–13. Boende- och medlemsärenden

Redan detaljerade i `EPOST_FORVALTARE.md` (felanmälan) och `EPOST_MOTIONER.md` (motion). Sammanfattning av krav:

### 9. Felanmälan → Förvaltning

| Krav | Nivå |
|------|------|
| Avsändare identifierad | Valfritt — okänd OK |
| Plats | Parsas automatiskt |
| Allvarlighetsgrad | Föreslås från nyckelord |
| Medlem/boende | Fuzzy match, ej obligatorisk |

### 10. Renovering → Styrelsen

| Krav | Nivå |
|------|------|
| Avsändare identifierad | **Obligatoriskt — medlem** |
| Lägenhet | Obligatoriskt |
| Typ av renovering | Parsas från text |
| Påverkar konstruktion | Flaggas om nyckelord matchar |

### 11. Andrahand → Styrelsen

| Krav | Nivå |
|------|------|
| Avsändare identifierad | **Obligatoriskt — lägenhetsägare** |
| Period (från/till) | Obligatoriskt |
| Hyresgästens uppgifter | Namn + kontakt |
| Skäl | Rekommenderat |

### 12. Störning → Styrelsen

| Krav | Nivå |
|------|------|
| Avsändare identifierad | Valfritt |
| "Knacka på"-filter | Alltid — boendefilosofin gäller |
| Plats | Parsas från text |
| Typ | Parsas från nyckelord |

### 13. Förslag → Styrelsen

| Krav | Nivå |
|------|------|
| Avsändare identifierad | Valfritt |
| Innehåll | Parsas till titel + beskrivning |

---

## 14. Offert/besiktning → Förvaltning

Detaljerat i `EPOST_FORVALTARE.md`. Krav:

| Krav | Kommentar |
|------|-----------|
| Entreprenör identifierad | Matchas mot Contractor-modellen |
| Pågående ärende | Auto-koppling om möjligt |
| Bilagor | Sparas i dokumentarkivet |

---

## 15. Faktura → Ekonomi

**Typiskt mail:**
```
Från: faktura@anderssonvvs.se
Ämne: Faktura 2026-0142
Bilaga: faktura_2026_0142.pdf
```

### Krav

| Krav | Kommentar |
|------|-----------|
| Leverantör identifierad | Matchas mot Contractor eller kontaktbok |
| Belopp | Parsas från bilaga eller ämnesrad om möjligt |
| Förfallodatum | Flaggas för kassören |
| Kopplat ärende | Faktura för utfört arbete → DamageReport/Inspection |

```
┌─ Faktura ──────────────────────────────────────────────┐
│                                                         │
│  Leverantör: Andersson VVS ✅ (känd)                   │
│  Fakturanr: 2026-0142                                   │
│  📎 faktura_2026_0142.pdf                              │
│                                                         │
│  Möjliga kopplingar:                                    │
│  ● Felanmälan #142 "Vattenläcka källare B"             │
│    Entreprenör: Andersson VVS, status: Löst             │
│  ○ Inget kopplat ärende                                │
│                                                         │
│  [Skapa utgift]  [Koppla till ärende #142]             │
└─────────────────────────────────────────────────────────┘
```

---

## 16. Försäkring → Ekonomi

| Krav | Kommentar |
|------|-----------|
| Försäkringsbolag identifierat | Domän/avsändare |
| Skadenummer/referens | Parsas från text |
| Kopplat skadeärende | Matchas mot DamageReport |
| Belopp (reglering) | Om utbetalning nämns |

---

## 17. Bank/lån → Ekonomi

| Krav | Kommentar |
|------|-----------|
| Bank identifierad | Domän |
| Typ (ränta, amortering, avtal) | Parsas från ämne |
| Kopplat låneavtal | Om referensnummer nämns |

---

## 18. Revision → Ekonomi

**Säsongsbetonat** — mest aktivt jan–april.

```
Från: karin.revisor@revisionsfirman.se
Ämne: Frågor inför revision BRF Exempelgården
"Inför årsrevisionen behöver jag följande underlag:
1. Resultat- och balansräkning
2. Kontoutdrag för alla konton per 2025-12-31
3. Verifikationer för poster > 50 000 kr
..."
```

| Krav | Kommentar |
|------|-----------|
| Revisor identifierad | **Ska vara föreningens valda revisor** |
| Koppling till räkenskapsår | Parsas |
| Begärda underlag | Checklista |

```
✅ Avsändaren matchar föreningens revisor:
   Karin Lindberg, Revisionsfirman AB
   Vald revisor sedan 2024 (ordinarie stämma)

📋 Begärda underlag:
   ☐ Resultat- och balansräkning
   ☐ Kontoutdrag per 2025-12-31
   ☐ Verifikationer > 50 000 kr
   
   [Skapa uppgift till kassören]
```

---

## 19. Myndighetspost → Förvaltning/Styrelsen

Detaljerat i `EPOST_FORVALTARE.md`. Hanteras av den inkorg som matchar ämnet:

| Myndighet | Ämne | Inkorg |
|-----------|------|--------|
| Kommunen (bygglov, OVK) | Fastighet | Förvaltning |
| Brandskydd | Besiktning | Förvaltning |
| Boverket | Regler, föreskrifter | Styrelsen |
| Skatteverket | Skattefrågor, kontrolluppgifter | Ekonomi |
| Kronofogden | Exekutiv försäljning | Styrelsen |
| Hyresnämnden | Överklagande, tvister | Styrelsen |
| Lantmäteriet | Fastighetsförändringar | Styrelsen |

---

## Sammanfattning: Identifieringskrav per ärendetyp

### Tre nivåer

**Strikt: Verifierad medlem krävs**
Avsändaren måste vara, eller representera, en identifierad aktiv medlem. Ärende kan **inte** skapas utan verifiering.

- Motion (motionsrätt = medlemsrätt)
- Renovering (kräver lägenhetsägare)
- Andrahand (kräver lägenhetsägare)

**Identifierad extern part**
Avsändaren är extern (mäklare, jurist, bank, myndighet). Behöver inte vara medlem men bör identifieras och sparas som kontakt.

- Försäljning (mäklare)
- Arv (jurist/dödsbo)
- Bodelning (jurist)
- Exekutiv försäljning (KFM)
- Pantsättning (bank)
- Faktura (leverantör)
- Revision (revisor)

**Valfritt: Okänd avsändare OK**
Ärendet kan skapas utan att veta vem som skickat mailet. Identifiering hjälper men blockerar inte.

- Felanmälan
- Störning
- Förslag

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  IDENTIFIERINGSNIVÅ                                    │
│                                                        │
│  ⛔ STRIKT (medlem)   ⚠ EXTERN PART    ✅ VALFRITT   │
│  ─────────────────    ─────────────     ───────────    │
│  Motion               Försäljning      Felanmälan     │
│  Renovering           Arv/Dödsfall     Störning       │
│  Andrahand            Bodelning        Förslag        │
│                       Gåva                             │
│                       Exekutiv förs.                   │
│                       Pantsättning                     │
│                       Faktura                          │
│                       Revision                         │
│                                                        │
│  Kan ej skapas        Sparas som        Skapas direkt  │
│  utan verifiering     extern kontakt    om möjligt     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Inkorg-routing: Vart hamnar vad?

### Styrelsen (primär)
Allt som rör **medlemsrätt, juridik, överlåtelser och styrelseansvar**:
- Försäljning (alla typer)
- Arv/dödsfall
- Bodelning
- Gåva
- Exekutiv försäljning
- Motion
- Renovering
- Andrahand
- Störning
- Myndighetspost (juridisk)

### Förvaltning
Allt som rör **fastigheten, underhåll och drift**:
- Felanmälan
- Offert/besiktning
- Entreprenörskontakt
- Myndighetspost (teknisk: OVK, brandskydd, hiss)

### Ekonomi
Allt som rör **pengar, avtal och revision**:
- Faktura
- Pantsättning
- Bank/lån
- Försäkring
- Revision
- Förslag (ekonomirelaterade)
- Myndighetspost (ekonomisk: Skatteverket)
- Överlåtelseavgifter (kopia/delegering från Styrelsen)

### Dubbelrouting

Vissa ärenden berör flera inkorgar:

| Ärende | Primär | Kopia/delegering |
|--------|--------|------------------|
| Försäljning | Styrelsen | Ekonomi (avgiftsberäkning) |
| Dödsfall | Styrelsen | Ekonomi (fakturering dödsbo) |
| Faktura kopplad till besiktning | Ekonomi | Förvaltning (godkänna arbetet) |
| Myndighetsföreläggande med vite | Förvaltning | Ekonomi (budgetpåverkan) |
| Renovering med VVS/el-påverkan | Styrelsen | Förvaltning (teknisk bedömning) |

Dubbelrouting = meddelandet syns i båda inkorgarna men ägs av primär. Sekundär ser det som "FYI" med länk till ärendet.
