# E-postintegration — Kassör

Detaljerad analys av kassörens e-postflöden, smart funktionalitet och koppling till föreningens ekonomi.

---

## Kassörens e-postverklighet

Kassören har den mest **transaktionsdrivna** inkorgen. Till skillnad från förvaltaren (reaktiv — saker går sönder) och ordföranden (relationsdriven — medlemmar, myndigheter) är kassörens mail nästan alltid kopplade till **pengar in eller ut**.

| Avsändare | Typ av mail | Frekvens | Ekonomisk påverkan |
|-----------|-------------|----------|-------------------|
| Leverantörer | Fakturor (PDF/e-faktura) | Veckovis | Utgift |
| Banker | Pantsättning, lån, räntor | Månatligen | Avgift + skuld |
| Mäklare/jurister | Överlåtelseavgifter | Vid försäljning | Intäkt |
| Försäkringsbolag | Premier, skadereglering | Kvartalsvis | Utgift/intäkt |
| Revisorer | Underlagsbegäran, rapporter | Säsong (jan–apr) | Indirekt |
| Skatteverket | Kontrolluppgifter, moms, arbetsgivaravgifter | Kvartalsvis | Skatt |
| Styrelsemedlemmar | Utläggskvitton, frågor | Löpande | Utgift |
| Ekonomisk förvaltare | Rapporter, avstämningar | Månatligen | Rapportering |

**Grundproblemet:** Kassören ska koppla varje ekonomisk transaktion till rätt ärende, verifiera belopp, och se till att inget faller mellan stolarna — allt medan fakturor har förfallodatum som tickar.

---

## Flöde 1: Faktura från leverantör

### Scenariot

```
Från: faktura@anderssonvvs.se
Ämne: Faktura 2026-0142 — BRF Exempelgården
Bilaga: faktura_2026_0142.pdf (89 KB)
Brödtext: "Bifogad faktura avser reparation av vattenläcka
i källargång B enligt överenskommelse.
Belopp: 18 750 kr inkl. moms.
Förfallodag: 2026-05-10.
Bankgiro: 123-4567."
```

### Vad systemet gör

#### Leverantörsidentifiering
```
👤 AVSÄNDARE
  faktura@anderssonvvs.se
  ✅ Känd leverantör: Andersson VVS AB
     Registrerad i Contractor-registret
     Org.nr: 556XXX-XXXX
     Kategori: VVS
     Senaste faktura: 2026-02 (4 200 kr)
     Totalt fakturerat 2026: 22 950 kr
```

#### Fakturaextraktion

Systemet parsear e-posttext och (i fas 2+) PDF-bilagan:

```
┌─ Identifierad faktura ─────────────────────────────────┐
│                                                         │
│  Leverantör: Andersson VVS AB ✅                       │
│  Fakturanr: 2026-0142                                   │
│  Belopp: 18 750 kr (inkl. moms)                        │
│    → Moms (25%): 3 750 kr                              │
│    → Exkl. moms: 15 000 kr                             │
│  Förfallodag: 2026-05-10 (28 dagar)                    │
│  Bankgiro: 123-4567                                     │
│                                                         │
│  📎 faktura_2026_0142.pdf                              │
└─────────────────────────────────────────────────────────┘
```

#### Ärendekoppling

```
┌─ Möjliga kopplingar ──────────────────────────────────┐
│                                                         │
│  Fakturan nämner "källargång B" + "vattenläcka".        │
│  Leverantör: Andersson VVS.                             │
│                                                         │
│  Matchande ärenden:                                     │
│  ● Felanmälan #142 "Vattenläcka källare B"             │
│    Entreprenör: Andersson VVS                           │
│    Status: Löst (2026-04-13)                            │
│    Estimerad kostnad: 15 000–20 000 kr                  │
│    → Fakturabelopp inom estimat ✅                     │
│                                                         │
│  ○ Inget kopplat ärende (fristående utgift)            │
│                                                         │
│  [Skapa utgift kopplad till #142]                      │
└─────────────────────────────────────────────────────────┘
```

#### Auto-ifyllning av utgift

```
┌─ Skapa utgift från faktura ────────────────────────────┐
│                                                         │
│  Beskrivning: [Reparation vattenläcka källare B      ]  │
│  Belopp: [18 750,00] kr                                │
│  Kategori: [Underhåll — VVS                        ▼]  │
│  Kvittokopia: faktura_2026_0142.pdf ✅                 │
│                                                         │
│  Förfallodag: 2026-05-10                               │
│  Bankgiro: 123-4567                                     │
│  Referens: Faktura 2026-0142                            │
│                                                         │
│  Kopplad till: Felanmälan #142                          │
│  Bokföringsreferens: [                               ]  │
│    (Fylls i efter synk med Fortnox/Visma)               │
│                                                         │
│  [Avbryt]  [Skapa utgift — inväntar godkännande]       │
└─────────────────────────────────────────────────────────┘
```

Utgiften skapas med status `SUBMITTED` och hamnar i godkännandeflödet.

#### Godkännandeflöde

Fakturan kopplas till godkännandeprocessen i Hemmet:

```
SUBMITTED → kassören/styrelsemedlem godkänner → APPROVED → kassören betalar → PAID
```

Självgodkännande blockeras om `expenseSelfApprovalBlocked` är aktivt (BrfRules). Belopp över `expenseApprovalMaxAmount` kräver styrelsebeslut.

```
⚠ Belopp 18 750 kr överstiger godkännandegränsen (15 000 kr).
   Kräver styrelsebeslut.
   
   [Lägg till på dagordning nästa styrelsemöte]
   [Begär godkännande via e-post till ordförande]
```

---

## Flöde 2: Pantsättningsärende från bank

### Scenariot

```
Från: pant@handelsbanken.se
Ämne: Pantsättningsansökan — lgh 2003, org.nr 769000-XXXX
Brödtext: "Vi önskar notera pant om 1 500 000 kr i
bostadsrätt lgh 2003. Låntagare: Erik Lindqvist.
Vänligen bekräfta och meddela pantsättningsavgift."
```

### Vad systemet gör

```
┌─ Pantsättningsärende ──────────────────────────────────┐
│                                                         │
│  Bank: Handelsbanken ✅                                │
│  Lägenhet: lgh 2003 → Erik Lindqvist ✅ (aktiv ägare) │
│  Pantbelopp: 1 500 000 kr                              │
│                                                         │
│  Befintliga pantbrev:                                   │
│    SBAB: 2 000 000 kr (reg. 2020-01-15) — aktiv        │
│    Nordea: 500 000 kr (reg. 2018-03-01) — aktiv        │
│    Total befintlig pant: 2 500 000 kr                   │
│    + Ny pant: 1 500 000 kr                              │
│    = Total pant: 4 000 000 kr                           │
│                                                         │
│  Pantsättningsavgift:                                   │
│    1% av prisbasbelopp (59 800 kr) = 598 kr             │
│    Betalas av: Låntagaren (Erik Lindqvist)              │
│                                                         │
│  [Registrera pant + skicka bekräftelse]                 │
└─────────────────────────────────────────────────────────┘
```

#### Bekräftelse till banken

```
Från: ekonomi@brfexempel.se
Till: pant@handelsbanken.se
Ämne: Re: Pantsättningsansökan — lgh 2003

Brf Exempelgården bekräftar notering av pant om
1 500 000 kr i bostadsrätt lgh 2003 för låntagare
Erik Lindqvist.

Pantsättningsavgift: 598 kr
Bankgiro för inbetalning: 123-4567
Referens: PANT-2026-015

Med vänliga hälsningar,
Kassören, BRF Exempelgården
```

#### Auto-registrering

Vid "Registrera pant":
1. `MortgageNotation` skapas (bankName, amount, fee, notationDate)
2. `Expense` skapas för avgiftsintäkt (598 kr, kategori: Pantsättningsavgift)
3. `ActivityLog` loggar registreringen
4. Bekräftelsemail skickas till banken

### Volym och automation

Pantsättning är **högfrekvent** — varje gång en ägare omförhandlar lån, byter bank eller tar tilläggslån. En förening med 100 lägenheter kan ha 20–30 pantsättningsärenden per år.

Flödet är **extremt standardiserat** — samma information varje gång:
- Lägenhet + ägare + bank + belopp
- Svar: bekräftelse + avgift + bankgiro

**Automation-möjlighet (fas 4+):**
```
💡 Pantsättning med auto-bekräftelse

  Om alla kriterier uppfylls:
  ✅ Lägenhet identifierad
  ✅ Ägare matchar låntagare
  ✅ Bank identifierad
  ✅ Belopp angivet
  
  Kan systemet:
  1. Registrera panten automatiskt
  2. Skicka standardbekräftelse med avgift
  3. Lägga ärendet i kassörens "auto-hanterade" lista
  
  Kassören granskar i efterhand istället för i förhand.
  [Aktivera auto-pantsättning: ☐]
```

Detta sparar kassören mest tid av alla e-postflöden — rutinärende som tar 15 minuter manuellt, 0 minuter automatiskt.

---

## Flöde 3: Överlåtelseavgift vid försäljning

### Scenariot

Överlåtelseärende ÖVL-2026-007 har godkänts av styrelsen. Kassören ska fakturera överlåtelseavgiften.

**Trigger:** Styrelsen godkänner överlåtelse → kassören notifieras.

```
📬 Ny uppgift i Ekonomi-inkorgen:

  Överlåtelse godkänd — fakturera överlåtelseavgift
  
  ÖVL-2026-007: Försäljning lgh 1008
  Säljare: Maria Svensson
  Köpare: Johan & Lisa Andersson
  Mäklare: Anna Bergman, Mäklarfirman AB
  
  Överlåtelseavgift: 1 495 kr
  Betalas av: Säljare (enligt stadgarna)
  Tillträde: 2026-06-01

  [Skicka faktura till mäklare]
  [Skicka faktura till säljare]
```

#### Automatisk faktura

```
Från: ekonomi@brfexempel.se
Till: anna.bergman@maklarfirman.se
Kopia: maria.svensson@företag.se
Ämne: Överlåtelseavgift — lgh 1008, BRF Exempelgården

Hej,

I samband med överlåtelse av bostadsrätt lgh 1008
debiteras överlåtelseavgift enligt föreningens stadgar:

Överlåtelseavgift: 1 495 kr
Betalas av: Säljaren (Maria Svensson)
Bankgiro: 123-4567
Referens: ÖVL-2026-007
Förfallodatum: 2026-05-15

Vänligen notera att tillträde förutsätter att
avgiften är betald.

Med vänliga hälsningar,
Kassören, BRF Exempelgården
```

#### Betalningsuppföljning

```
⏰ Obetalda överlåtelseavgifter:
   ÖVL-2026-007 — 1 495 kr — förfaller 2026-05-15 (3 dagar)
   ÖVL-2026-005 — 1 495 kr — förfaller 2026-04-28 (förfallen!)
     → Tillträde 2026-05-01 — avgift INTE betald
     [Skicka påminnelse till mäklare]
```

---

## Flöde 4: Revisorskommunikation

### Scenariot

```
Från: karin.lindberg@revisionsfirman.se
Ämne: Underlag revision BRF Exempelgården 2025
Brödtext: "Hej,

Inför årsrevisionen behöver jag:
1. Resultat- och balansräkning 2025
2. Kontoutdrag alla konton per 2025-12-31
3. Verifikationer för poster > 50 000 kr
4. Hyresförteckning per 2025-12-31
5. Underhållsplanens status och fondavsättning

Bifogar det senaste revisionsutlåtandet för referens.
Kan vi boka avstämning vecka 12?

Med vänlig hälsning,
Karin Lindberg, Auktoriserad revisor"
```

### Vad systemet gör

#### Revisorsverifiering
```
✅ Känd revisor: Karin Lindberg
   Revisionsfirman AB
   Vald som ordinarie revisor: Stämma 2024-05-22
   Mandatperiod: t.o.m. stämma 2026
```

#### Underlagschecklista
```
┌─ Begärda underlag ─────────────────────────────────────┐
│                                                         │
│  Revision räkenskapsår 2025                             │
│                                                         │
│  ☐ 1. Resultat- och balansräkning                      │
│       → Finns i Fortnox/Visma? [Exportera]              │
│  ☐ 2. Kontoutdrag alla konton 2025-12-31               │
│       → Begär från banken                               │
│  ☐ 3. Verifikationer > 50 000 kr                       │
│       → 7 poster i systemet (visa lista)                │
│  ☐ 4. Hyresförteckning                                 │
│       → Kan genereras från Hemmet [Exportera]           │
│  ☐ 5. Underhållsplan + fondavsättning                  │
│       → Komponentregistret [Exportera sammanfattning]   │
│                                                         │
│  📅 Mötesförslag: vecka 12 (2026-03-16 – 2026-03-20)  │
│                                                         │
│  [Skapa uppgiftslista]                                 │
│  [Svara med preliminärt datum]                          │
└─────────────────────────────────────────────────────────┘
```

#### Data från Hemmet

Systemet kan hjälpa kassören genom att exportera data det redan har:

| Begärt underlag | Finns i Hemmet? | Åtgärd |
|-----------------|-----------------|--------|
| Hyresförteckning | Ja (Apartment + avgifter) | Auto-export CSV |
| Underhållsplan | Ja (BuildingComponent) | Auto-export sammanfattning |
| Verifikationer > 50 000 kr | Delvis (Expense med belopp) | Filtrera och lista |
| Resultaträkning | Nej (i Fortnox/Visma) | Hänvisa kassören |
| Kontoutdrag | Nej (i banken) | Skapa uppgift: "Begär från bank" |

#### Revisionskalender

Systemet vet att revision sker varje år och kan förbereda:

```
📅 Revisionskalender 2026:
   Jan: Avsluta bokföring 2025
   Feb: Sammanställa årsredovisning
   Mar: Skicka underlag till revisor
   → Vi är här (vecka 11)
   Apr: Revisionsmöte + revisionsberättelse
   Maj: Ordinarie stämma 2026-05-20
```

---

## Flöde 5: Försäkringsärende

### Scenariot

```
Från: skador@tryggaforsakring.se
Ämne: Skadeärende 2026-3456 — vattenskada BRF Exempelgården
"Vi har registrerat er skadeanmälan avseende vattenskada
i källargång B. Besiktningsman kontaktar er inom 5 dagar.

Självrisk: 7 500 kr
Skadeärende: 2026-3456

Kontaktperson: Lars Ågren, 08-123 4567"
```

### Vad systemet gör

```
┌─ Försäkringsärende ────────────────────────────────────┐
│                                                         │
│  Försäkringsbolag: Trygga Försäkring ✅                │
│  Skadenr: 2026-3456                                     │
│  Självrisk: 7 500 kr                                    │
│  Kontaktperson: Lars Ågren                              │
│                                                         │
│  Möjlig koppling:                                       │
│  ● Felanmälan #142 "Vattenläcka källare B"             │
│    Faktura: Andersson VVS 18 750 kr                     │
│    → Självrisken (7 500 kr) < fakturabeloppet           │
│    → Möjlig ersättning: ~11 250 kr                     │
│                                                         │
│  [Koppla till felanmälan #142]                          │
│  [Skapa separat försäkringsärende]                     │
│                                                         │
│  ☐ Registrera självrisk som utgift (7 500 kr)          │
│  ☐ Bevaka: besiktningsman inom 5 dagar                 │
└─────────────────────────────────────────────────────────┘
```

#### Försäkringsflöde i tidslinjen

```
Felanmälan #142 — Vattenläcka källare B
─────────────────────────────────────────
  🔧 2026-04-10 Andersson VVS reparerade läckan
  💰 2026-04-12 Faktura: 18 750 kr (inkl. moms)
  📧 2026-04-12 Skadeanmälan skickad till Trygga Försäkring
  📧 2026-04-13 Svar: Skadenr 2026-3456, självrisk 7 500 kr
  ⏰ 2026-04-18 Bevaka: besiktningsman (5 dagar)
  📧 2026-04-20 Besiktningsman bekräftar skada
  💰 2026-05-03 Utbetalning: 11 250 kr från försäkring
```

---

## Flöde 6: Skatteverket

### Scenariot

```
Från: foreningar@skatteverket.se
Ämne: Kontrolluppgifter — BRF Exempelgården, org.nr 769000-XXXX
"Påminnelse: Kontrolluppgifter avseende ränteintäkter och
utdelningar för beskattningsår 2025 ska vara inlämnade
senast 2026-01-31."
```

### Vad systemet gör

```
⚠ MYNDIGHETSPOST — SKATTEVERKET
  Deadline: 2026-01-31

  Kontrolluppgifter som kan beröra BRF:
  ☐ KU50 — Ränta på inlåning (om föreningen har sparkonto)
  ☐ KU55 — Utdelning/vinst (normalt ej tillämpligt)
  ☐ KU66 — Schablonintäkt (investeringsfonder om tillämpligt)

  💡 De flesta BRF:er som inte är oäkta behöver inte
     lämna kontrolluppgifter. Kontrollera med revisorn.

  [Skapa uppgift med deadline 2026-01-31]
  [Vidarebefordra till revisor]
```

---

## Flöde 7: Medlems utläggskvitto

### Scenariot

```
Från: erik.larsson@gmail.com (ordförande)
Ämne: Utlägg: Kontorsmaterial + porto styrelsemöte
"Hej, bifogar kvitton för kontorsmaterial och porto
inför styrelsemöte 2026-04-22.
Staples: 847 kr
Posten: 132 kr
Totalt: 979 kr"
Bilagor: kvitto_staples.jpg, kvitto_posten.jpg
```

### Vad systemet gör

```
┌─ Utläggskvitto ────────────────────────────────────────┐
│                                                         │
│  Avsändare: Erik Larsson                                │
│    → ✅ Ordförande, styrelsemedlem                     │
│                                                         │
│  Identifierade utgifter:                                │
│    1. Kontorsmaterial (Staples): 847 kr                 │
│    2. Porto (Posten): 132 kr                            │
│    Totalt: 979 kr                                       │
│                                                         │
│  📎 2 kvitton bifogade                                 │
│                                                         │
│  Skapa som:                                             │
│  ● En utgift (979 kr, "Kontorsmaterial + porto")       │
│  ○ Separata utgifter (847 kr + 132 kr)                 │
│                                                         │
│  Kategori: [Administration                          ▼] │
│                                                         │
│  ⚠ Självgodkännande blockerat — en annan              │
│    styrelsemedlem måste godkänna utlägget.             │
│                                                         │
│  [Skapa utgift → inväntar godkännande]                 │
└─────────────────────────────────────────────────────────┘
```

---

## Flöde 8: Andrahandsavgift

### Scenariot

Andrahandsuthyrning godkänd → kassören ska fakturera avgiften.

```
📬 Automatiskt i Ekonomi-inkorgen:

  Andrahand godkänd — fakturera avgift

  Lgh 2003: Erik Lindqvist
  Period: 2026-05-01 – 2026-10-31 (6 mån)
  
  Andrahandsavgift:
    10% av prisbasbelopp (59 800 kr) = 5 980 kr/år
    → 6 mån = 2 990 kr
  
  [Skicka faktura till Erik Lindqvist]
```

---

## Smart kontextpanel — kassörsvy

All ekonomisk kontext samlad:

```
┌─ Ekonomisk kontext ────────────────────────────────────┐
│                                                         │
│  💰 KASSAFLÖDE DENNA MÅNAD                             │
│  Inkomster: 487 500 kr (avgifter)                       │
│  + Överlåtelseavgifter: 2 990 kr                       │
│  + Pantsättningsavgifter: 1 196 kr                     │
│  Utgifter: 34 200 kr                                    │
│    varav obetalda fakturor: 18 750 kr                   │
│                                                         │
│  📋 OBETALDA FAKTUROR (3)                              │
│  Andersson VVS: 18 750 kr — förfaller 2026-05-10       │
│  Securitas: 8 400 kr — förfaller 2026-05-15            │
│  PostNord: 1 240 kr — förfaller 2026-04-30 ⚠          │
│                                                         │
│  ⏰ OBETALDA AVGIFTER (1)                              │
│  ÖVL-2026-005 — 1 495 kr — FÖRFALLEN (5 dagar)        │
│                                                         │
│  📧 OBESVARADE MAIL (2)                                │
│  Handelsbanken: pantsättning lgh 3004 (2 dagar)        │
│  Trygga Försäkring: besiktning källare (4 dagar)       │
└─────────────────────────────────────────────────────────┘
```

---

## Påminnelser och uppföljning

### Automatiska påminnelser

| Händelse | Påminnelse | Kanal |
|----------|------------|-------|
| Faktura förfaller inom 5 dagar | "Faktura från X förfaller om 5 dagar" | In-app |
| Faktura förfallen | "Faktura från X är förfallen!" | In-app + SMS |
| Överlåtelseavgift obetald vid tillträde | "OBS: Tillträde 2026-05-01 men avgift ej betald" | In-app + SMS |
| Pantsättning obesvarad 3 dagar | "Pantsättning från bank X inväntar svar" | In-app |
| Revisionsunderlag deadline | "Underlag till revisor ska vara klart" | In-app |
| Prisbasbelopp nytt år | "Prisbasbelopp 2027 publicerat — uppdatera i Hemmet" | In-app (jan) |

### Veckosammanfattning

```
📧 Ekonomi — vecka 15 (2026)

Inkomna mail: 6
  2 fakturor, 1 pantsättning, 1 försäkring, 2 övrigt

Hanterade: 4 (67%)
Ohanterade: 2
  ● Pantsättning lgh 3004 — Handelsbanken (2 dagar)
  ● Fråga om avgiftshöjning — medlem lgh 1012 (1 dag)

Ekonomisk sammanfattning:
  Fakturor att betala: 28 390 kr (3 st)
  Avgifter att inkassera: 1 495 kr (1 överlåtelse)
  Försäkringsersättning väntad: 11 250 kr

Kommande deadlines:
  2026-04-28: Revision — lämna underlag till revisor
  2026-04-30: PostNord-faktura förfaller
  2026-05-01: Tillträde lgh 1008 — avgift obetald!
```

---

## Koppling till ekonomisystemet

### Nuläge: Expense-modellen

Varje faktura/utlägg som skapas från e-post blir en `Expense` med:
- `amount` (Decimal)
- `category` (utgiftskategori)
- `receiptUrl` (länk till faktura-PDF i dokumentarkivet)
- `accountingRef` (tomt — fylls i vid synk med Fortnox/Visma)
- Status: `SUBMITTED → APPROVED → PAID`

### Framtid: Fortnox/Visma-synk

När integrationen byggs kan e-postflödet utökas:

```
Faktura anländer via e-post
    ↓
Kassören skapar Expense i Hemmet
    ↓
Godkännandeflöde (SUBMITTED → APPROVED)
    ↓
Synk till Fortnox: skapar leverantörsfaktura
    ↓
Kassören betalar i Fortnox/banken
    ↓
Synk tillbaka: APPROVED → PAID + bokföringsreferens
```

Tills dess lagrar Hemmet fakturan och godkännandeflödet — den faktiska betalningen sker i banken.

---

## Dubbelrouting — kassörens perspektiv

Kassören ser kopior av ärenden som har ekonomisk påverkan:

| Primär inkorg | Ärendetyp | Kassören ser |
|---------------|-----------|-------------|
| Styrelsen | Överlåtelse godkänd | "Fakturera överlåtelseavgift" |
| Styrelsen | Andrahand godkänd | "Fakturera andrahandsavgift" |
| Styrelsen | Dödsfall | "Omdirigera avgiftsfakturering till dödsboet" |
| Förvaltning | Felanmälan löst | "Faktura förväntas från entreprenör" |
| Förvaltning | Besiktning utförd | "Faktura förväntas" |
| Förvaltning | Myndighetsföreläggande | "Budgetpåverkan — kostnad förväntas" |

Dessa visas som **FYI-kort** i Ekonomi-inkorgen — inte som mail att svara på, utan som händelser att bevaka ekonomiskt.

```
┌─ FYI — Ekonomisk påverkan ─────────────────────────────┐
│                                                         │
│  📋 Överlåtelse lgh 1008 godkänd (2026-04-15)         │
│     Avgift: 1 495 kr — fakturera säljare               │
│     [Skicka faktura]                                    │
│                                                         │
│  📋 Felanmälan #142 löst (2026-04-13)                  │
│     Entreprenör: Andersson VVS                          │
│     → Faktura inväntas                                  │
│                                                         │
│  📋 Andrahand lgh 2003 godkänd (2026-04-10)           │
│     Avgift: 2 990 kr (6 mån) — fakturera ägare         │
│     [Skicka faktura]                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Kassörsspecifika parsningsregler

### Fakturadetektion

| Signal | Matchning |
|--------|-----------|
| PDF-bilaga med "faktura" i filnamn | Stark indikation |
| Ord: "faktura", "invoice", "betalning" | Ämnesrad eller brödtext |
| Belopp + "kr" i text | Extraktion av summa |
| "Förfaller", "förfallodag", "betalningsvillkor" | Deadline-extraktion |
| "Bankgiro", "plusgiro", "IBAN", "Swish" | Betalningsinformation |
| "OCR", "referens" | Betalningsreferens |
| "Moms", "inkl. moms", "exkl. moms" | Momsberäkning |

### Pantsättningsdetektion

| Signal | Matchning |
|--------|-----------|
| Domän: @handelsbanken.se, @seb.se, @nordea.se, @swedbank.se, @sbab.se, @lansforsakringar.se | Bankidentifiering |
| Ord: "pant", "pantsättning", "inteckning", "notation" | Ärendetyp |
| "lgh" + nummer | Lägenhet |
| Belopp + "kr" | Pantbelopp |

### Överlåtelsedetektion

| Signal | Matchning |
|--------|-----------|
| Domän: @maklarfirman.se, @svensk-fastighetsformedling.se, etc. | Mäklare |
| Ord: "överlåtelse", "köpare", "säljare", "tillträde" | Ärendetyp |
| "lgh" + nummer | Lägenhet |
| Belopp + "köpesumma"/"köpeskilling" | Transaktionsvärde |

---

## Kassörens dashboard-integration

Ekonomi-inkorgen bör speglas i kassörens dashboard:

```
📊 Kassörens dashboard

┌─ Att göra ──────────┐  ┌─ Obetalda ──────────┐
│ 📧 2 nya mail        │  │ 3 fakturor: 28 390 kr│
│ 💰 1 utgift att     │  │ 1 avgift: 1 495 kr   │
│    godkänna          │  │                      │
│ 📋 1 överlåtelse    │  │ Förfaller snart:     │
│    att fakturera     │  │ PostNord 30 apr ⚠   │
└──────────────────────┘  └──────────────────────┘
```

---

## Implementation — kassörsspecifikt

Utöver de generella faserna i `EPOST.md`:

### Fas 2 (Ärendekoppling) — tillägg

- [ ] Fakturaextraktion: belopp, förfallodag, bankgiro, referens
- [ ] Auto-koppling faktura → pågående ärende (leverantör + plats/ärendetyp)
- [ ] Pantsättningsdetektering och auto-ifyllning
- [ ] Mäklare/juristidentifiering vid överlåtelse
- [ ] Beloppsvalidering mot estimerade kostnader i ärenden
- [ ] Dubblettfaktura-detektering (samma leverantör + belopp + period)

### Fas 3 (Svar) — tillägg

- [ ] Pantsättningsbekräftelse-mall med auto-beräknad avgift
- [ ] Överlåtelseavgift-fakturamall
- [ ] Andrahandsavgift-fakturamall
- [ ] Revisorsunderlag-svarsmall med checklista

### Fas 4 (Smart funktionalitet) — tillägg

- [ ] Förfallodagsbevakning med eskalerande påminnelser
- [ ] Auto-pantsättning (opt-in: registrera + bekräfta utan manuell hantering)
- [ ] FYI-kort från andra inkorgar med ekonomisk påverkan
- [ ] Ekonomisk sammanfattning per vecka/månad
- [ ] Prisbasbelopp-påminnelse (januari varje år)
- [ ] Momsberäkning vid fakturaextraktion
- [ ] Koppling till revisionskalender

### Fas 5 (Fortnox/Visma) — framtid

- [ ] Synk godkända utgifter → leverantörsfaktura i ekonomisystem
- [ ] Importera betalningsstatus → uppdatera Expense.status
- [ ] Exportera hyresförteckning, pantförteckning till revisor
- [ ] Auto-generera kontrolluppgifter (om tillämpligt)
