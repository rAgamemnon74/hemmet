# E-postintegration — Skydd mot fakturabedrägerier

BRF:er är populära mål för fakturabedrägerier. Styrelseledamöter arbetar ideellt, kassören byts ut med några års mellanrum, och föreningar har pengar på kontot. Det här dokumentet analyserar attackvektorer, detekteringsregler och hur Hemmet kan skydda kassören.

---

## Varför BRF:er är sårbara

| Faktor | Beskrivning |
|--------|-------------|
| **Ideellt arbete** | Kassören gör detta på fritiden — hög arbetsbelastning, begränsad tid för kontroll |
| **Rotation** | Ny kassör vartannat/vart tredje år — känner inte alla leverantörer |
| **Många leverantörer** | VVS, el, hiss, trädgård, städ, snöröjning, brand, lås, skadedjur... |
| **Rimliga belopp** | Bedragare håller sig under "smärtgränsen" — 3 000–15 000 kr |
| **Tidspress** | Fakturor har förfallodatum. "Bättre att betala och klaga sedan" |
| **Ingen ekonomiavdelning** | Inget system för tre-vägsmatchning (beställning → leverans → faktura) |
| **Delad e-post** | Alla i styrelsen ser allt — ingen har specifikt ansvar att verifiera |

---

## Attackvektorer

### 1. Helt fabricerad faktura — okänd avsändare

Den vanligaste: ett mail från ett "företag" som aldrig utfört arbete.

```
Från: faktura@brandskyddsnorden.se
Ämne: Faktura — brandskyddskontroll BRF Exempelgården
Bilaga: faktura_23891.pdf

"Enligt avtal bifogas faktura för utförd brandskydds-
kontroll av gemensamma utrymmen.
Belopp: 4 950 kr inkl. moms
Förfaller: 2026-05-01
Bankgiro: 987-6543"
```

**Varför den fungerar:** "Brandskyddskontroll" låter obligatoriskt. Kassören tänker "vi har väl haft brandskydd?" och beloppet är rimligt. Ingen i styrelsen minns exakt vilka besiktningar som är gjorda.

**Varianter:**
- "Katalogregistrering" / "Företagsregister"
- "Årsavgift — brandsläckare/utrymningsplan"
- "Trappstädning" / "Fönsterputs"
- "Ventilationskontroll" / "OVK-kontroll"
- "Golvvård gemensamma utrymmen"
- "Nyckelkopiering / låsbyte"
- "IT-support hemsida"
- "Juridisk rådgivning"

### 2. Efterapning av känd leverantör — spoofad avsändare

Bedragaren vet att föreningen använder Andersson VVS och skickar en faktura som ser ut att komma därifrån — men med annat bankgiro.

```
Från: faktura@andersson-vvs.se  (OBS: bindestreck, riktiga är anderssonvvs.se)
Ämne: Faktura 2026-0155 — BRF Exempelgården
Bilaga: faktura_2026_0155.pdf

"Vi har bytt bank. Vänligen notera nytt bankgiro: 765-4321.
Bifogad faktura avser löpande underhållsavtal.
Belopp: 12 400 kr"
```

**Varför den fungerar:** Fakturan ser ut som de brukar, beloppet stämmer ungefär, och bankbytet förklarar det nya kontonumret. Kassören som hanterar 20 fakturor i månaden kontrollerar inte domänen tecken för tecken.

### 3. Man-in-the-middle — kaprat leverantörskonto

Bedragaren har fått tillgång till leverantörens e-postkonto (via phishing) och skickar en riktig-ser-ut faktura från den riktiga adressen — men med ändrat bankgiro.

```
Från: info@anderssonvvs.se  (RIKTIGA adressen)
Ämne: Re: Faktura 2026-0142 — korrigering

"Hej, vi upptäckte ett fel i vår tidigare faktura.
Vänligen använd detta korrigerade bankgiro: 765-4321
för betalning. Beloppet är oförändrat: 18 750 kr."
```

**Varför den fungerar:** Avsändaradressen är korrekt. Det finns en riktig faktura med rätt belopp. Korrigeringen verkar rimlig. Detta är den farligaste varianten.

### 4. Intern bedrägeri — styrelsemedlem

Ovanligt men förekommer: en styrelsemedlem skapar fiktiva fakturor eller överdebiterar utlägg.

```
Styrelsemedlem skickar utläggskvitto:
"Köpte material till gårdsstädningen: 3 400 kr"
Bilaga: kvitto.jpg (manipulerat — verkligt belopp 340 kr)
```

**Varför den fungerar:** Kollegialt förtroende. Ingen vill misstänka sina styrelsekollegor. Beloppen är små nog att inte ifrågasättas.

### 5. Abonnemangsfällan

Föreningen "registreras" i en katalog eller tjänst via ett mail som ser ut som information men som juridiskt är en beställning.

```
Från: info@foreningsregistret.se
Ämne: Registrering BRF Exempelgården

"Er registrering i Föreningsregistret Sverige har
förnyats. Årsavgift: 2 990 kr.
Se bifogade villkor."
```

**Varför den fungerar:** Ser ut som en myndighet eller branschorganisation. Liten text i villkoren anger att det är en beställning. Kassören betalar "årsavgiften" utan att reflektera.

### 6. Dubbelfakturering

Leverantören (medvetet eller av misstag) skickar samma faktura två gånger, kanske med små variationer i fakturanummer.

```
Faktura 2026-0142: 18 750 kr (originalet)
Faktura 2026-0142B: 18 750 kr ("påminnelse" eller "kopia")
```

---

## Detekteringsregler i Hemmet

### Nivå 1: Hårda blockeringar

Ärenden som **inte kan** skapas utan manuellt godkännande.

| Regel | Trigger | Åtgärd |
|-------|---------|--------|
| **Okänd leverantör + faktura** | Avsändardomän finns inte i Contractor eller kontaktbok | ⛔ Flagga: "Okänd leverantör — har vi beställt detta?" |
| **Bankgiroskillnad** | Känd leverantör men bankgiro matchar inte registrerat | ⛔ Flagga: "VARNING — annorlunda bankgiro" |
| **Dubbelfaktura** | Samma leverantör + liknande belopp (±5%) inom 30 dagar | ⛔ Flagga: "Möjlig dubbelfaktura" |
| **Självgodkännande** | Kassören försöker godkänna egen utgift | ⛔ Blockeras av `expenseSelfApprovalBlocked` |

### Nivå 2: Varningar

Ärenden som **kan** skapas men som visar tydliga varningar.

| Regel | Trigger | Varning |
|-------|---------|---------|
| **Inget kopplat ärende** | Faktura utan matchande felanmälan/besiktning/avtal | ⚠ "Ingen beställning hittades i systemet" |
| **Avvikande belopp** | Belopp avviker >50% från snittfaktura från leverantören | ⚠ "Ovanligt högt/lågt belopp jämfört med historik" |
| **Ny domän liknande känd** | `andersson-vvs.se` vs registrerad `anderssonvvs.se` | ⚠ "Domänen liknar men matchar inte [känd leverantör]" |
| **"Bankbyte"-meddelande** | Nyckelord "bytt bank", "nytt konto", "nytt bankgiro" | ⚠ "Bankgiroändring — verifiera direkt med leverantören" |
| **Första faktura ny leverantör** | Leverantör i Contractor men aldrig fakturerat förut | ⚠ "Första fakturan från denna leverantör" |
| **Katalog/registreringsavgift** | Nyckelord "registrering", "katalog", "årsavgift", "förnyelse" | ⚠ "Möjlig abonnemangsfälla — har vi beställt detta?" |
| **Kort förfallotid** | Förfallodag < 7 dagar från mottagning | ⚠ "Kort betalningstid — bedragare vill skapa tidspress" |
| **Runda belopp** | Exakt jämna tusental utan öresavsändning | ⚠ "Jämnt belopp — riktiga fakturor har ofta ören" |

### Nivå 3: Informationsberikande

Automatisk bakgrundsinfo som hjälper kassören bedöma.

| Kontroll | Vad det visar |
|----------|---------------|
| **Leverantörshistorik** | Senaste 12 mån fakturor: antal, totalbelopp, snitt |
| **Ärendekoppling** | Vilka ärenden leverantören är kopplad till |
| **Organisationsnummer** | Om angivet — kontrollera mot Bolagsverket (framtid) |
| **Domänålder** | Nyregistrerade domäner (<6 mån) är högre risk |
| **Google-check** | "Har andra varnat för detta företag?" (framtid) |

---

## Skyddsvy — kassörens gränssnitt

### Flaggad faktura

```
┌─ ⚠ FAKTURA MED VARNINGAR ─────────────────────────────┐
│                                                         │
│  Från: faktura@brandskyddsnorden.se                     │
│  Ämne: Faktura — brandskyddskontroll                    │
│  Belopp: 4 950 kr                                       │
│                                                         │
│  ┌─ VARNINGAR (3) ─────────────────────────────────┐   │
│  │                                                   │   │
│  │  ⛔ OKÄND LEVERANTÖR                             │   │
│  │  "Brandskyddsnorden" finns inte i systemet.       │   │
│  │  Ingen har registrerat detta företag som           │   │
│  │  leverantör eller beställt tjänst.                │   │
│  │                                                   │   │
│  │  ⚠ INGET KOPPLAT ÄRENDE                         │   │
│  │  Det finns ingen besiktning, felanmälan eller     │   │
│  │  uppgift i systemet som matchar "brandskydds-     │   │
│  │  kontroll".                                       │   │
│  │                                                   │   │
│  │  ⚠ MÖJLIG KATALOGFAKTURA                        │   │
│  │  Nyckelord "kontroll" + okänd leverantör          │   │
│  │  matchar mönster för falska fakturor.             │   │
│  │                                                   │   │
│  └───────────────────────────────────────────────────┘   │
│                                                         │
│  💡 REKOMMENDATION                                     │
│  Betala INTE denna faktura utan att verifiera.          │
│  Kontrollera:                                           │
│  1. Har vi beställt brandskyddskontroll?                │
│  2. Finns avtal med detta företag?                      │
│  3. Fråga förvaltaren — känner hen igen företaget?     │
│                                                         │
│  [Markera som bedrägeri]  [Verifiera — skapa ärende]   │
│  [Arkivera utan åtgärd]                                │
└─────────────────────────────────────────────────────────┘
```

### Bankgirobyte-varning

```
┌─ ⛔ KRITISK VARNING ───────────────────────────────────┐
│                                                         │
│  Faktura från: Andersson VVS                            │
│  ✅ Känd leverantör                                    │
│                                                         │
│  ⛔ BANKGIRO MATCHAR INTE                              │
│                                                         │
│  Registrerat bankgiro: 123-4567                         │
│  Fakturans bankgiro:   765-4321  ← AVVIKER             │
│                                                         │
│  Fakturan nämner "vi har bytt bank".                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🛡️ BANKGIROÄNDRING ÄR EN VANLIG                │   │
│  │  BEDRÄGERIMETOD                                   │   │
│  │                                                   │   │
│  │  Bedragare skickar "korrigerade" fakturor med     │   │
│  │  nytt bankgiro. Den riktiga leverantören vet      │   │
│  │  inte om att någon skickar fakturor i deras namn.  │   │
│  │                                                   │   │
│  │  RING leverantören på det telefonnummer ni        │   │
│  │  har sedan tidigare (inte numret i mailet)        │   │
│  │  och bekräfta bankbytet.                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Andersson VVS registrerat telefon: 08-123 456          │
│                                                         │
│  [Ring och verifiera → uppdatera bankgiro]              │
│  [Markera som bedrägeri]                                │
│  [Avvakta]                                              │
└─────────────────────────────────────────────────────────┘
```

### Liknande domän-varning

```
┌─ ⚠ DOMÄNVARNING ──────────────────────────────────────┐
│                                                         │
│  Avsändare: faktura@andersson-vvs.se                    │
│                                                         │
│  Liknande registrerad leverantör:                       │
│    Andersson VVS — anderssonvvs.se                      │
│                                                         │
│  Skillnader:                                            │
│    andersson-vvs.se    (e-postens domän)                │
│    anderssonvvs.se     (registrerad domän)              │
│         ↑ bindestreck                                   │
│                                                         │
│  Det här kan vara:                                      │
│  a) Leverantören har en alternativ domän (legitimt)     │
│  b) En bedragare som efterapar leverantören             │
│                                                         │
│  Verifiera med leverantören innan betalning.            │
└─────────────────────────────────────────────────────────┘
```

---

## Tre-vägsmatchning — kärnskyddet

I en organisation med ekonomiavdelning görs tre-vägsmatchning:

```
Beställning (Purchase Order) 
    ↕ matchar
Leverans (Goods Receipt)
    ↕ matchar  
Faktura (Invoice)
```

BRF:er har normalt inget sådant system. Hemmet kan erbjuda en **förenklad variant**:

```
Ärende i systemet (beställning/beslut)
    ↕ matchar
Utfört arbete (statusändring i ärendet)
    ↕ matchar
Faktura (inkommande e-post)
```

### Hur det fungerar i praktiken

**Scenario 1: Faktura med ärende ✅**

```
1. Felanmälan #142 skapas (vattenläcka)
2. Förvaltaren kontaktar Andersson VVS
3. Arbete utförs → #142 status "Löst"
4. Faktura anländer från Andersson VVS
   → Auto-koppling: #142 + Andersson VVS ✅
   → Belopp inom estimat ✅
   → Bankgiro matchar ✅
   = Låg risk
```

**Scenario 2: Faktura utan ärende ⚠**

```
1. Faktura anländer från "Brandskyddsnorden"
   → Inget ärende i systemet ⛔
   → Okänd leverantör ⛔
   → Ingen beställning ⛔
   = Hög risk — flaggas
```

**Scenario 3: Faktura med ärende men fel leverantör ⚠**

```
1. Besiktning #12 skapas (stambesiktning)
2. Entreprenör: Andersson VVS
3. Faktura anländer från "Stockholm VVS AB"
   → Ärende #12 finns, men fel leverantör ⚠
   → Fråga: "Har ni bytt entreprenör?"
```

---

## Organisationsnummervalidering

### Bolagsverkets data (framtid — API-integration)

```
Faktura anger org.nr: 556789-0123

Kontroll mot Bolagsverket:
  ✅ Företaget finns: Andersson VVS AB
  ✅ Aktivt (inte avregistrerat)
  ✅ F-skatt: Godkänd
  ⚠  Registrerat 2025-11-01 (6 mån sedan — nytt företag)
```

Varningsregler:

| Signal | Risk |
|--------|------|
| Org.nr finns inte | ⛔ Kritisk |
| Företaget avregistrerat | ⛔ Kritisk |
| Ej F-skatt | ⚠ Hög — BRF blir betalningsansvarig för skatt |
| Registrerat < 6 mån | ⚠ Medium — nytt företag |
| Annan bransch än förväntat | ⚠ Medium — "VVS-firma" men registrerad som "Konsult" |
| Företagsnamn matchar inte | ⚠ Medium — org.nr pekar på annat namn |

### Utan API-integration (fas 1)

Visa org.nr prominent så kassören kan kontrollera manuellt:

```
Org.nr på fakturan: 556789-0123
[Kontrollera på allabolag.se ↗]
[Kontrollera F-skatt på skatteverket.se ↗]
```

---

## Mönsterigenkänning över tid

### Leverantörsprofil

Systemet bygger upp en profil per leverantör baserat på historik:

```
Andersson VVS AB
  Fakturor 2025: 6 st, totalt 48 200 kr
  Snittfaktura: 8 033 kr
  Intervall: ca var 6:e vecka
  Bankgiro: 123-4567 (sedan 2024)
  Kategori: VVS
  Kopplad till: 4 felanmälningar, 1 besiktning
```

Avvikelser flaggas:

| Avvikelse | Trigger |
|-----------|---------|
| Ovanligt hög faktura | >2x snittfaktura |
| Ovanligt tät fakturering | <50% av normalt intervall |
| Faktura utan ärende | Tidigare fakturor alltid kopplade |
| Ny kontaktperson | Avsändarnamn skiljer sig |
| Domänändring | Ny avsändardomän men samma företagsnamn |

### Säsongsmönster

Vissa leverantörer fakturerar säsongsbetonat:

```
Trädgårdstjänst AB:
  Apr–Okt: 1–2 fakturor/mån (gräsklippning, beskärning)
  Nov–Mar: 0 fakturor (vintervila)

⚠ Faktura från Trädgårdstjänst AB i januari
   → Ovanligt — flagga för kontroll
```

---

## Skyddsrutiner — processuella

Systemet kan stödja men inte ersätta processuella skyddsrutiner:

### 1. Tvåpersonsregel vid betalning

```
┌─ Godkännandeflöde ─────────────────────────────────────┐
│                                                         │
│  Faktura skapad av: Kassör (Maria)                      │
│  → Kan INTE godkännas av: Kassör (Maria)               │
│  → Måste godkännas av: Annan styrelsemedlem             │
│                                                         │
│  Belopp > 15 000 kr:                                    │
│  → Kräver styrelsebeslut (ej enskild person)            │
└─────────────────────────────────────────────────────────┘
```

### 2. Leverantörsregistrering

Nya leverantörer bör registreras *innan* första fakturan:

```
💡 Best practice: Registrera leverantörer proaktivt

  När föreningen anlitar en ny entreprenör:
  1. Registrera i Contractor-registret
  2. Ange org.nr, bankgiro, kontaktperson, domän
  3. Koppla till ärende

  Då kan systemet verifiera framtida fakturor automatiskt.
```

### 3. Bankgiro som ankare

Bankgiro ändras sällan. Det bör behandlas som en **identifierare**:

```
⚠ Ändring av bankgiro kräver manuell verifiering

  Systemet tillåter aldrig automatisk uppdatering av
  ett registrerat bankgiro baserat på en faktura.

  Process:
  1. Kassören ser varning om avvikande bankgiro
  2. Ringer leverantören på KÄNT nummer (inte fakturans)
  3. Bekräftar bankbytet
  4. Uppdaterar manuellt i Contractor-registret
  5. ActivityLog: "Bankgiro ändrat — verifierat per telefon"
```

### 4. Årlig leverantörsgenomgång

```
📋 Årlig leverantörsgenomgång (rekommenderad)

  Systemet kan generera:
  - Lista alla leverantörer som fakturerat senaste 12 mån
  - Totala belopp per leverantör
  - Leverantörer utan kopplat ärende
  - Leverantörer som inte fakturerat på >12 mån (inaktiva)
  - Leverantörer utan org.nr eller bankgiro

  Kassören + ordförande granskar listan:
  "Känner vi igen alla dessa? Stämmer beloppen?"
```

---

## Interna bedrägerier — skydd

### Utläggskvitton

| Kontroll | Beskrivning |
|----------|-------------|
| **Fotovalidering** | Kvittobild — datum, butik, belopp synligt? |
| **Beloppskontroll** | Stämmer angivet belopp med kvittot? |
| **Relevans** | Utgiften rimlig för föreningsarbete? |
| **Frekvens** | Ovanligt många utlägg från samma person? |
| **Dubblett** | Samma kvitto insänt tidigare? |

```
📋 Utläggsstatistik 2026:
  Erik (ordförande): 12 utlägg, totalt 4 850 kr
  Maria (kassör): 3 utlägg, totalt 1 200 kr
  Sara (sekreterare): 8 utlägg, totalt 6 200 kr ← över snitt
  Johan (ledamot): 0 utlägg

  Snitt per styrelsemedlem: ~3 000 kr/år
  ⚠ Sara ligger 2x över snitt — inte nödvändigtvis fel,
     men värt att notera.
```

### Revisorns roll

Revisorn granskar alla transaktioner årligen. Hemmet kan underlätta:

```
📊 Revisorsexport — flaggade poster

  Fakturor utan ärendekoppling: 3 st, 12 400 kr
  Utlägg utan kvittobild: 1 st, 450 kr
  Leverantörer med bankgiroändring under året: 1 st
  Godkännande av närstående: 0 st
  
  [Exportera för revisor]
```

---

## Bedrägerikategorier — sammanfattning

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  RISKNIVÅ OCH SYSTEMETS SKYDD                          │
│                                                        │
│  ⛔ KRITISK — Systemet blockerar                       │
│  ─────────────────────────────────                     │
│  • Bankgiro avviker från registrerat                   │
│  • Självgodkännande av utgift                          │
│  • Dubblettfaktura (samma leverantör + belopp)         │
│                                                        │
│  ⚠ HÖG — Systemet varnar tydligt                      │
│  ────────────────────────────────                      │
│  • Okänd leverantör + faktura                          │
│  • Ingen ärendekoppling (tre-vägsmatchning misslyckas) │
│  • Liknande domän som känd leverantör (spoofing)       │
│  • "Bankbyte"-meddelande                               │
│  • Katalogfaktura / registreringsavgift                │
│  • Belopp >2x leverantörens snitt                      │
│                                                        │
│  💡 MEDIUM — Systemet informerar                       │
│  ──────────────────────────────                        │
│  • Första faktura från ny leverantör                   │
│  • Kort förfallotid (<7 dagar)                         │
│  • Jämnt belopp (inga ören)                            │
│  • Faktura utanför leverantörens normala säsong        │
│  • Ny kontaktperson hos känd leverantör                │
│  • Nyregistrerat företag (<6 mån)                      │
│                                                        │
│  ✅ LÅG — Normal hantering                            │
│  ───────────────────────────                           │
│  • Känd leverantör + kopplat ärende + rätt bankgiro    │
│  • Belopp inom förväntat intervall                     │
│  • Standard förfallotid                                │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Implementation

### Fas 2 (Ärendekoppling) — bedrägerigrundskydd

- [ ] Leverantörsmatchning mot Contractor + kontaktbok
- [ ] Bankgirojämförelse mot registrerat bankgiro
- [ ] Dubblettfaktura-detektering (leverantör + belopp + period)
- [ ] Tre-vägsmatchning: faktura ↔ ärende ↔ leverantör
- [ ] Flaggsystem med tre nivåer (kritisk/hög/medium)
- [ ] "Okänd leverantör"-varning på alla fakturor utan Contractor-match
- [ ] Domänlikhetsanalys (Levenshtein-avstånd mot kända domäner)

### Fas 4 (Smart funktionalitet) — utökade kontroller

- [ ] Leverantörsprofil: snittbelopp, intervall, säsong
- [ ] Avvikelsedetektion: belopp, frekvens, tidpunkt
- [ ] Katalogfaktura-detektion (nyckelord + okänd avsändare)
- [ ] "Bankbyte"-detektion med verifieringsflöde
- [ ] Bankgiro som skyddad identifierare (aldrig auto-uppdatering)
- [ ] Utläggsstatistik per styrelsemedlem
- [ ] Årlig leverantörsgenomgång (auto-genererad)
- [ ] Revisorsexport med flaggade poster

### Framtid — API-integrationer

- [ ] Bolagsverket: org.nr-validering, F-skatt, bransch
- [ ] Bankgirocentralen: verifiera att bankgiro tillhör rätt företag
- [ ] Domänålderskontroll via WHOIS
- [ ] UC/Creditsafe: företagskreditkontroll för nya leverantörer

---

## Tonläge i varningar

Systemet ska varna utan att skapa paranoia. Kassören hanterar tiotals legitima fakturor för varje bedrägeriförsök. Varningar ska vara:

1. **Specifika** — "Bankgiro avviker" är bättre än "Möjligt bedrägeri"
2. **Handlingsbara** — "Ring leverantören på 08-123 456" inte bara "Kontrollera"
3. **Proportionerliga** — rött för bankgiroskillnad, gult för okänd leverantör, grått för runda belopp
4. **Aldrig automatiskt blockerande** — kassören fattar alltid slutbeslutet, systemet informerar och rekommenderar

En kassör som ignorerar varningar för att de alltid visar sig vara falsklarm är ett sämre skydd än ingen varning alls. Precision > recall.
