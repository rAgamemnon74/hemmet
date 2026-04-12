# E-postintegration — Motioner till stämman

Analys av motionshantering via e-post. Motioner skiljer sig från felanmälningar i en fundamental aspekt: **motionsrätt kräver verifierat medlemskap**.

---

## Juridisk grund

Motionsrätten regleras i bostadsrättslagen och föreningens stadgar:

- **Bara medlemmar** får lämna motion till stämma (BrfL 9:14, LEF 7:6)
- Boende utan medlemskap (hyresgäster, andrahandshyresgäster, sambo utan andel) har **ingen motionsrätt**
- Motionen måste kunna kopplas till en identifierad medlem
- Styrelsen är skyldig att behandla inkomna motioner — en oidentifierad motion kan inte behandlas

**Konsekvens:** Till skillnad från felanmälan (där okänd avsändare är OK) kan en motion från en oidentifierad avsändare **aldrig** skapas som ärende direkt. Medlemskapet måste bekräftas först.

---

## Scenariot

```
Från: maria.svensson72@gmail.com
Ämne: Motion till årsstämman — laddstolpar i garaget
Brödtext: "Hej styrelsen,

Jag vill lämna in en motion till kommande årsstämma.

Bakgrund:
Allt fler i föreningen har elbil eller planerar att skaffa.
Idag finns inga laddmöjligheter i garaget. Grannföreningen
BRF Björken installerade 12 laddstolpar förra året och det
har fungerat utmärkt.

Yrkande:
Jag yrkar att styrelsen utreder möjligheten att installera
laddstolpar i föreningens garage och presenterar en plan
med kostnadsuppskattning till nästa ordinarie stämma.

Med vänlig hälsning,
Maria Svensson, lgh 1008"
```

---

## Steg-för-steg: Vad systemet gör

### 1. Avsändaridentifiering — OBLIGATORISK

Samma fuzzy-matchning som felanmälan, men med hårdare krav:

```
┌─ Avsändare ────────────────────────────────────────────┐
│  maria.svensson72@gmail.com                             │
│                                                         │
│  ⚠ E-postadressen finns inte i medlemsregistret.       │
│                                                         │
│  Möjliga matchningar:                                   │
│  ● Maria Svensson — lgh 1008, Storgatan 1A             │
│    Registrerad e-post: maria.svensson@företag.se        │
│    Medlemsstatus: ✅ Aktiv medlem sedan 2018-06-01      │
│    Ägarandel: 100% (ensam ägare)                        │
│    [Bekräfta identitet]                                 │
│                                                         │
│  ● Maria Svensson-Ek — lgh 2014, Storgatan 1B          │
│    Registrerad e-post: maria@svenssonek.se              │
│    Medlemsstatus: ✅ Aktiv medlem sedan 2021-02-15      │
│    [Bekräfta identitet]                                 │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ⛔ Motion kräver verifierat medlemskap.                │
│  Välj matchande medlem eller be avsändaren              │
│  bekräfta sin identitet.                                │
│                                                         │
│  [Be om bekräftelse via e-post]                         │
└─────────────────────────────────────────────────────────┘
```

#### Fyra möjliga lägen

| Läge | Systemets beteende |
|------|-------------------|
| **Exakt e-postmatch + aktiv medlem** | ✅ Direkt: "Skapa motion" aktiveras |
| **Fuzzy match (namn + lgh)** | ⚠ Styrelsemedlem bekräftar rätt person → "Skapa motion" aktiveras |
| **Flera möjliga matchningar** | ⚠ Styrelsemedlem väljer rätt person, eller ber avsändaren förtydliga |
| **Ingen match alls** | ⛔ Motion kan inte skapas. Systemet föreslår svarsmall |

#### Ingen match — svarsmall

```
Från: styrelsen@brfexempel.se
Till: maria.svensson72@gmail.com
Ämne: Re: Motion till årsstämman — laddstolpar i garaget

Hej,

Tack för din motion. För att vi ska kunna registrera den
behöver vi bekräfta ditt medlemskap i föreningen.

Kan du uppge:
- Ditt fullständiga namn
- Lägenhetsnummer
- Den e-postadress du registrerat i Hemmet

Alternativt kan du lämna in motionen direkt via Hemmet:
https://hemmet.brfexempel.se/medlem/motioner

Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
```

#### Fuzzy match bekräftad — erbjud e-postuppdatering

När styrelsemedlemmen bekräftar "detta är Maria i lgh 1008":

```
Marias registrerade e-post: maria.svensson@företag.se
Motionen skickades från: maria.svensson72@gmail.com

☐ Föreslå e-postuppdatering till Maria
  (Skickar mail med länk till profilinställningar)
```

Inte automatisk uppdatering — Maria bestämmer själv (GDPR).

---

### 2. Motionsparsning

Systemet försöker identifiera motionens tre delar:

| Del | Nyckelord/mönster | Resultat |
|-----|-------------------|----------|
| **Titel** | Ämnesraden (minus "Motion till årsstämman — ") | "Laddstolpar i garaget" |
| **Bakgrund/motivering** | Text före "yrkar", "föreslår", "hemställer" | Stycket om elbilsbehovet |
| **Yrkande** | Text efter "yrkar att", "föreslår att", "hemställer att" | "styrelsen utreder möjligheten..." |

```
┌─ Parsad motion ────────────────────────────────────────┐
│                                                         │
│  Titel (från ämnesrad):                                 │
│  [Laddstolpar i garaget                              ]  │
│                                                         │
│  Bakgrund och motivering:                               │
│  [Allt fler i föreningen har elbil eller planerar    ]  │
│  [att skaffa. Idag finns inga laddmöjligheter i     ]  │
│  [garaget. Grannföreningen BRF Björken installerade  ]  │
│  [12 laddstolpar förra året och det har fungerat     ]  │
│  [utmärkt.                                           ]  │
│                                                         │
│  Yrkande:                                               │
│  [Jag yrkar att styrelsen utreder möjligheten att    ]  │
│  [installera laddstolpar i föreningens garage och    ]  │
│  [presenterar en plan med kostnadsuppskattning till   ]  │
│  [nästa ordinarie stämma.                            ]  │
│                                                         │
│  ✓ Alla tre delar identifierade                        │
└─────────────────────────────────────────────────────────┘
```

#### Ofullständig motion

Om yrkande saknas:

```
⚠ Inget tydligt yrkande identifierat.

En motion måste innehålla ett konkret yrkande —
"Motionären yrkar att..."

Föreslaget svar:
"Tack för din motion. För att styrelsen ska kunna
behandla den behöver vi ett konkret yrkande — vad
du vill att stämman ska besluta. Kan du komplettera
med ett 'Jag yrkar att...'?"

[Skicka kompletteringsbegäran]  [Skapa ändå — fyll i manuellt]
```

---

### 3. Tidskontroll

Motioner har deadlines kopplade till stämman:

```
┌─ Tidskontroll ─────────────────────────────────────────┐
│                                                         │
│  Nästa stämma: Ordinarie årsstämma 2026-05-20           │
│  Motionsstopp enligt stadgarna: 2026-03-31              │
│                                                         │
│  ✅ Motionen inkom 2026-03-15 — inom tidsfristen.      │
│                                                         │
│  Alternativt:                                           │
│  ⚠ Motionen inkom 2026-04-12 — EFTER motionsstopp.    │
│     Styrelsen kan välja att ändå behandla motionen      │
│     men är inte skyldig att göra det.                   │
│                                                         │
│     ○ Behandla ändå (styrelsen beslutar)                │
│     ○ Avvisa med hänvisning till tidsfristen            │
│       [Skicka avvisningsmail med förklaring]            │
└─────────────────────────────────────────────────────────┘
```

Tidskontroll hämtar:
- Nästa planerade stämma (Meeting med type ANNUAL/EXTRAORDINARY)
- Motionsstopp från BrfRules (om konfigurerat) eller stadgarna
- Beräknar om motionen kom in i tid

#### Sen motion — svarsmall

```
Hej Maria,

Tack för din motion om laddstolpar. Tyvärr inkom den
efter motionsstoppet (2026-03-31) för årets stämma.

Styrelsen kommer att diskutera om motionen ändå kan
tas upp. Du kan också välja att lämna in den till
nästa stämma.

Du är välkommen att höra av dig om du har frågor.

Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
```

---

### 4. Kontextpanel

```
┌─ Kontext ──────────────────────────────────────────────┐
│                                                         │
│  👤 AVSÄNDARE                                          │
│  ⚠ Fuzzy match: Maria Svensson, lgh 1008              │
│  ✅ Aktiv medlem                                       │
│  E-post avviker från registret                          │
│                                                         │
│  📅 TIDSFRIST                                          │
│  ✅ Inom motionsstopp (2026-03-31)                     │
│  Stämma: 2026-05-20                                     │
│                                                         │
│  📋 TIDIGARE MOTIONER                                  │
│  Maria Svensson har lämnat 1 motion tidigare:           │
│  "Cykelrum i källaren" (2024, bifall)                   │
│                                                         │
│  🔍 LIKNANDE MOTIONER                                  │
│  Inga pågående motioner om laddstolpar/elbil.           │
│  Historiskt: Ingen liknande motion behandlad.           │
│                                                         │
│  📎 BILAGOR                                            │
│  Inga bilagor i e-postmeddelandet.                      │
│                                                         │
│  💡 NOTERING                                           │
│  Motionen berör gemensamhetsanläggning (garage).        │
│  Kan kräva stämmobeslut med kvalificerad majoritet      │
│  om det innebär väsentlig förändring.                   │
└─────────────────────────────────────────────────────────┘
```

---

### 5. Liknande och relaterade motioner

Systemet söker efter:

**a) Dubbletter** — samma ämne från samma eller annan medlem:
```
⚠ Erik Lindqvist (lgh 2003) lämnade motion 2026-03-10:
  "Elbilsladdning i garaget"
  Status: Inskickad

  Motionerna liknar varandra. Överväg att:
  [Slå ihop — kontakta båda motionärerna]
  [Behåll som separata motioner]
```

**b) Historiska motioner** — samma ämne behandlat tidigare:
```
📋 Relaterat:
  2023: Motion "Eluttag i garaget" — avslogs
    Skäl: "Kostnaden bedömdes som för hög i förhållande
    till antalet elbilar i föreningen."
```

Det här är värdefullt — styrelsen ser att frågan kommit upp förut och hur den besvarades. Kanske har förutsättningarna ändrats.

**c) Styrelsebeslut i samma ämne:**
```
📋 Styrelsebeslut:
  2025-09-15: "Styrelsen avvaktar med laddstolpar tills
  garagerenoveringen är klar (planerad 2026)."
```

---

### 6. Det färdiga flödet

```
┌─ Skapa motion från e-post ─────────────────────────────┐
│                                                         │
│  Motionär                                               │
│  ⚠ Bekräftad: Maria Svensson, lgh 1008 [Ändra]        │
│  ✅ Aktiv medlem                                       │
│                                                         │
│  Titel                                                  │
│  [Laddstolpar i garaget                              ]  │
│                                                         │
│  Bakgrund och motivering                                │
│  [Allt fler i föreningen har elbil eller planerar    ]  │
│  [att skaffa. Idag finns inga laddmöjligheter...     ]  │
│                                                         │
│  Yrkande                                                │
│  [Jag yrkar att styrelsen utreder möjligheten att    ]  │
│  [installera laddstolpar i föreningens garage...     ]  │
│                                                         │
│  Tidsfrist: ✅ Inkom 2026-03-15 (stopp: 2026-03-31)   │
│                                                         │
│  Koppla till stämma: [Ordinarie stämma 2026-05-20  ▼]  │
│                                                         │
│  ┌─ Relaterat ─────────────────────────────────────┐   │
│  │ Liknande motion från Erik Lindqvist (2026-03-10) │   │
│  │ Avslagen motion "Eluttag i garaget" (2023)       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ☑ Bifoga originalmail i ärendet                       │
│  ☑ Skicka mottagningsbekräftelse                       │
│                                                         │
│  [Avbryt]  [Skapa motion]                              │
└─────────────────────────────────────────────────────────┘
```

---

## Efter skapande

### Mottagningsbekräftelse

```
Från: styrelsen@brfexempel.se
Till: maria.svensson72@gmail.com
Ämne: Re: Motion till årsstämman — laddstolpar i garaget

Hej Maria,

Tack för din motion "Laddstolpar i garaget". Vi har
tagit emot den och registrerat den inför ordinarie
stämma 2026-05-20.

Referens: Motion #23

Styrelsen kommer att lämna sitt yttrande i kallelsen
till stämman. Du kan följa din motion i Hemmet:
https://hemmet.brfexempel.se/medlem/motioner/abc123

Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
```

Reply-To: `styrelsen+mot_abc123@brfexempel.se` — Marias eventuella svar hamnar i motionens tidslinje.

### Automatiskt i systemet

1. **Motion skapas** med status `SUBMITTED`, `authorId` = Maria
2. **E-postmeddelandet kopplas** till motionen (entityType: "Motion")
3. **Standardförslag skapas**: "Bifall" + "Avslag" (som vid webbaserad inlämning)
4. **Motionen syns** i styrelsens motionslista, redo för yttrande
5. **ActivityLog**: "Motion skapad från e-post av [styrelsemedlem]"
6. **Maria notifieras** (in-app om hon loggar in, + bekräftelsemail)

---

## Specialfall

### Flera motionärer

```
"Vi som bor i hus B vill lämna in en motion.
Undertecknat: Maria Svensson lgh 1008, Erik Lindqvist lgh 2003,
Anna Berg lgh 2004"
```

Alla tre måste vara medlemmar. Systemet:
- Identifierar alla tre namn + lägenhetsnummer
- Verifierar medlemskap för var och en
- Om alla OK → skapa motion med primär motionär (Maria, förstnämnd)
- Övriga listas i beskrivningen: "Undertecknad av: Maria Svensson, Erik Lindqvist, Anna Berg"

Om en person inte kan verifieras:

```
⚠ 3 motionärer identifierade, 1 ej verifierad:
  ✅ Maria Svensson, lgh 1008 — aktiv medlem
  ✅ Erik Lindqvist, lgh 2003 — aktiv medlem
  ❓ Anna Berg, lgh 2004 — ingen match
     Lgh 2004 ägs av: Per Berg
     Anna Berg kan vara sambo/familjemedlem utan eget medlemskap.

  En motion kräver att minst en undertecknare är medlem.
  ✅ Motionen kan skapas (Maria och Erik är medlemmar).
  
  [Skapa motion med Maria som huvudmotionär]
```

### Motion från ombud

```
"På uppdrag av min far Karl Pettersson (lgh 3001) som är
sjuk vill jag lämna in följande motion..."
```

Systemet flaggar:
```
⚠ Motionen verkar inlämnad av ombud.
  Avsändare: Lisa Pettersson (ej medlem)
  Hänvisar till: Karl Pettersson, lgh 3001

  Motionsrätt tillhör medlemmen. Om Karl Pettersson inte
  själv kan lämna in motionen digitalt, kan styrelsen
  acceptera den om det framgår att den representerar
  medlemmens vilja.

  ● Karl Pettersson, lgh 3001 — ✅ Aktiv medlem
  
  [Skapa motion med Karl som motionär]
  [Be om skriftlig fullmakt]
```

### Motion till extra stämma

Motioner kan även lämnas till extra stämma. Tidskontroll anpassas:

```
📅 Ingen ordinarie stämma planerad.
   Nästa möte: Extra stämma 2026-06-15
   Motionsstopp: Enligt stadgarna/kallelse

   Motioner till extra stämma behandlas enligt samma
   regler, men observera att extra stämmor ofta har
   en specifik dagordning.
```

### Motion som egentligen är annat

Ibland skickar medlemmar saker som "motion" som egentligen är:
- Felanmälan: "Motion: laga taket som läcker"
- Förslag/synpunkt: "Motion: det vore trevligt med blomlådor"
- Klagomål: "Motion: grannen spelar hög musik"

```
💡 Observera: Denna "motion" kan vara en felanmälan eller
   ett förslag snarare än en formell motion.

   En motion är ett förslag till stämmobeslut. Om avsändaren
   vill rapportera ett fel eller lämna en synpunkt kan det
   vara lämpligare att skapa ett annat ärende.

   [Skapa som motion ändå]
   [Skapa som felanmälan istället]
   [Skapa som förslag istället]
   [Svara och förklara skillnaden]
```

Svarsmall:
```
Hej Maria,

Tack för att du hör av dig. Det du beskriver verkar vara
en felanmälan snarare än en motion till stämman.

En motion är ett förslag till beslut som stämman röstar om.
En felanmälan är en rapport om något som behöver åtgärdas
i fastigheten.

Du kan lämna en felanmälan direkt i Hemmet:
https://hemmet.brfexempel.se/boende/skadeanmalan/ny

Hör av dig om du har frågor!

Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
```

---

## Motionär utan Hemmet-konto

Alla medlemmar har inte nödvändigtvis loggat in i Hemmet. Motionen kan ändå skapas:

```
⚠ Maria Svensson har aldrig loggat in i Hemmet.
  
  Motionen skapas med Maria som author (baserat på
  User-posten från medlemsregistret).

  ☐ Skicka inbjudan till Hemmet i bekräftelsemailet
    "Du kan följa din motion och delta i andra
    föreningsfrågor via Hemmet: [registreringslänk]"
```

Möjlighet att uppmuntra digital delaktighet utan att kräva det.

---

## Styrelsens arbetsflöde efter mottagande

E-postintegrationen slutar inte vid skapande. Motionens livscykel i systemet:

```
SUBMITTED (via e-post)
    ↓
  Styrelsemedlem bekräftar mottagande (auto-mail)
    ↓
RECEIVED
    ↓
  Styrelsen diskuterar på styrelsemöte
  (Motion kopplas till mötesdagordning)
    ↓
  Styrelsen skriver yttrande
    ↓
BOARD_RESPONSE
    ↓
  Yttrande + motionärens förslag publiceras i kallelsen
    ↓
  Stämman röstar
    ↓
DECIDED (bifall/avslag/ändring)
```

Under hela processen kan styrelsen kommunicera med motionären via e-post — alla svar hamnar i motionens tidslinje.

```
Motion #23 — Laddstolpar i garaget
─────────────────────────────────────────
  📧 2026-03-15 Inkommande: Maria Svensson
     "Jag vill lämna in en motion till årsstämman..."

  ✉ 2026-03-15 Bekräftelse skickad till Maria

  📧 2026-03-22 Inkommande: Maria Svensson
     "Hej, jag glömde bifoga offerten jag fick från
      Charge Amps. Se bilaga."
     📎 offert_chargeamps_2026.pdf

  💬 2026-04-01 Styrelsekommentar (internt)
     "Bra motion. Vi bör tillstyrka men föreslå att
      kostnaden fördelas via höjd garageavgift."

  📧 2026-04-10 Utgående till Maria
     "Hej Maria, styrelsen har diskuterat din motion
      och kommer att lämna yttrande i kallelsen..."

  📋 2026-04-15 Styrelsens yttrande registrerat
     Rekommendation: Tillstyrka med ändring
```

---

## Implementation — motionsspecifikt

Utöver de generella faserna i `EPOST.md`:

### Fas 2 (Ärendekoppling) — tillägg

- [ ] Obligatorisk medlemsverifiering innan motion kan skapas
- [ ] Motionsparsning: titel, bakgrund, yrkande (tre-delad)
- [ ] Tidskontroll mot kommande stämma + motionsstopp
- [ ] Koppling till planerad stämma vid skapande
- [ ] Hantering av flera motionärer i samma mail
- [ ] Hantering av ombud/representant
- [ ] Dubblettdetektering mot pågående motioner
- [ ] Historisk sökning: liknande motioner från tidigare stämmor
- [ ] Klassificeringshjälp: motion vs felanmälan vs förslag

### Fas 3 (Svar) — tillägg

- [ ] Mottagningsbekräftelse-mall med motionsreferens + stämmodatum
- [ ] Kompletteringsbegäran-mall (saknat yrkande, oklar avsändare)
- [ ] Avvisningsmail-mall (efter motionsstopp)
- [ ] Svarsmall för "detta är inte en motion"
- [ ] Yttrande-notifikation till motionär ("styrelsens yttrande finns nu")

### Fas 4 (Smart funktionalitet) — tillägg

- [ ] Koppling till styrelsebeslut i samma ämne
- [ ] Kontextvisning av relaterade K3-komponenter (om motionen rör fastigheten)
- [ ] "Motionär utan konto"-flöde med inbjudningslänk
- [ ] Sen motion-hantering med styrelsediskussion
