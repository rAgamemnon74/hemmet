# E-postintegration — Fastighetsförvaltare

Detaljerad analys av e-postflöden, smart funktionalitet och UX för fastighetsansvarigs inkorg.

---

## Förvaltarens e-postverklighet

Fastighetsansvarig hanterar den mest varierade e-posten i styrelsen:

| Avsändare | Typ av mail | Frekvens |
|-----------|-------------|----------|
| Boende/medlemmar | Felanmälningar, frågor om renovering, klagomål | Dagligen–veckovis |
| Entreprenörer | Offerter, fakturor, besiktningsrapporter, avtal | Veckovis |
| Besiktningsfirmor | Rapporter, protokoll, uppföljning | Månatligen |
| Kommunen/myndigheter | OVK-krav, brandskydd, hissbesiktning, tillsyn | Kvartalsvis |
| Försäkringsbolag | Skadereglering, besiktning efter skada | Vid behov |
| Energibolag | Driftstörningar, avtal, avläsning | Kvartalsvis |

Det gemensamma: nästan allt har en plats i ärendesystemet men landar idag i en personlig inkorg utan koppling.

---

## Flöde 1: Felanmälan via e-post

### Scenariot

```
Från: erik.lindqvist@hotmail.com
Ämne: Läcker från taket i källaren
Brödtext: "Hej, det droppar vatten från taket i källargång B,
precis utanför förråd 12. Har droppat sedan igår kväll.
Mvh Erik i lgh 2003"
```

### Steg-för-steg: Vad systemet gör

#### 1. Avsändaridentifiering

`erik.lindqvist@hotmail.com` — systemet söker i tre steg:

1. **Exakt e-postmatch i User-tabellen** → träff/miss
2. **Fuzzy: namnmatch + lägenhetsreferens** → parsear "Erik" + "lgh 2003" ur brödtexten
3. **Andrahandskoll** → om lgh 2003 har pågående SubletApplication, kontrollera om avsändaren är hyresgästen

Resultat visas som en av fyra lägen:

| Läge | Visning |
|------|---------|
| **Exakt match** | ✅ Erik Lindqvist, lgh 2003 (medlem) |
| **Fuzzy match** | ⚠ Möjlig match: Erik Lindqvist, lgh 2003. E-postadressen skiljer sig (registrerad: erik@lindqvist.se) |
| **Andrahandshyresgäst** | 🔑 Lgh 2003 uthyrd i andrahand t.o.m. 2026-08. Hyresgäst: Erik Lindqvist. Ägare: Maria Svensson |
| **Okänd** | ❓ Ingen match. Avsändaren finns inte i systemet |

#### Åtgärder vid match

**Fuzzy match med avvikande e-post:**
```
⚠ E-postadressen erik.lindqvist@hotmail.com finns inte i registret.
  Registrerad e-post för Erik Lindqvist: erik@lindqvist.se

  [Använd registrerad e-post för ärendet]
  [Erbjud uppdatering] → Skickar mail till Erik:
    "Vi ser att du mailade från en annan adress.
     Vill du uppdatera din registrerade e-post?
     Uppdatera: https://hemmet.brfexempel.se/installningar/profil"
```

**Andrahandshyresgäst:**
- Felanmälan kopplas till **lägenheten** (inte hyresgästen)
- Lägenhetsägaren (Maria) notifieras om ärendet
- Kommunikation kan ske med hyresgästen (Erik) men ärendet ägs av fastigheten
- Systemet visar: *"Kontakt med ägaren kan behövas — hyresgästen kan inte fatta beslut om åtgärder i lägenheten"*

**Okänd avsändare:**
- Skapa felanmälan utan lägenhetskoppling
- Förvaltaren kan manuellt koppla eller be om mer info via svar
- Kan vara granne i annan fastighet, besökare, eller hantverkare som noterat problem

#### 2. Platsparsning

Systemet söker efter kända platsmönster i ämnesrad + brödtext:

| Mönster | Match |
|---------|-------|
| "lgh 2003", "lägenhet 2003" | → Apartment 2003 |
| "källargång B", "källare B" | → Building B, plats "Källare" |
| "trapphus A", "trappan i A" | → Building A, plats "Trapphus" |
| "tvättstugan", "tvätten" | → Plats "Tvättstuga" |
| "innergården", "gården" | → Plats "Innergård" |
| "garaget", "P-platsen" | → Plats "Garage" |
| "hissen", "hiss" | → Plats "Hiss" + flagga som potentiellt hissärende |
| "taket", "tak" | → Plats "Tak" |
| "fasad", "fasaden" | → Plats "Fasad" |
| "förråd 12" | → Plats "Förråd", detalj "12" |

**Kombination:** "källargång B, utanför förråd 12" → Building B, plats "Källare", detalj "vid förråd 12"

#### 3. Allvarlighetsförslag

Regelbaserad (inte AI — förutsägbart och granskningsbart):

| Nyckelord | Föreslagen allvarlighetsgrad | Motivering |
|-----------|------------------------------|------------|
| läcker, vatten, översvämning, vattenskada | **HÖG** | Vattenskador eskalerar |
| brand, rök, brandlarm, brinner | **KRITISK** | Akut säkerhetsrisk |
| hiss, fastnat, stuck | **HÖG** | Tillgänglighet + säkerhet |
| el, kortslutning, gnistor, ström | **HÖG** | Brandrisk |
| mögel, fukt, lukt | **NORMAL → HÖG** | Beroende på omfattning |
| trasig, sönder, funkar inte | **NORMAL** | Standardfel |
| lampa, belysning | **LÅG** | Kosmetiskt/komfort |
| klotter, nedskräpning | **LÅG** | Estetiskt |
| skadedjur, råttor, möss, kackerlackor | **HÖG** | Hälsorisk, kräver snabb åtgärd |

Förvaltaren ser förslaget med motivering och kan ändra fritt. Förslaget loggas inte — bara det slutliga valet.

#### 4. Ärendehistorik

Systemet korsrefererar automatiskt mot:

**a) Platshistorik** — tidigare ärenden på samma plats:
```
📋 Tidigare ärenden — Byggnad B, källare:
   #089 Fukt i förråd 14 (2025-11, löst — kostnad: 12 500 kr)
   #067 Stopp i golvbrunn källare B (2025-03, löst — kostnad: 4 200 kr)

   ⚠ Två tidigare fuktärenden i samma källargång inom 12 månader.
```

**b) Avsändarhistorik** — tidigare ärenden från samma person:
```
📋 Tidigare ärenden från Erik Lindqvist:
   #102 Trasig porttelefon (2026-01, löst)
   Inga pågående ärenden.
```

**c) Dubblettdetektering** — liknande pågående ärenden:
```
⚠ Möjlig dubblett:
   #141 "Vattenläcka källare B" — skapad igår av Anna Berg (lgh 2004)
   Status: Anmäld
   
   [Slå ihop med #141]  [Skapa separat ärende]
```

Dubblettdetektering baseras på:
- Samma byggnad + liknande plats + skapad inom 7 dagar
- Liknande nyckelord i titel/beskrivning
- Inte exakt match krävs — "Läcker i källaren" ≈ "Vattenläcka källare B"

#### 5. Komponentkorsreferens (K3)

Baserat på plats + ärendetyp, visa berörda komponenter:

```
🔧 Berörda komponenter — Byggnad B:
   Tappvattenledningar (2004) — 22 år / 50 år livslängd
     Senaste besiktning: 2024-09-15 ✓
   Avloppsstammar (2004) — 22 år / 50 år livslängd
     Senaste besiktning: 2024-09-15 ✓
   Dränering (1968) — 58 år / 50 år livslängd
     ⚠ PASSERAD LIVSLÄNGD
     Senaste besiktning: ingen registrerad
   Källargolv (1968) — 58 år / 40 år livslängd
     ⚠ PASSERAD LIVSLÄNGD
     Senaste besiktning: ingen registrerad
```

Det här ger förvaltaren kontext som annars kräver att hen öppnar komponentregistret separat. Informationen kan avgöra om det ska kallas in en rörmokare (symptombehandling) eller en besiktningsfirma (grundutredning).

---

## Flöde 2: Offert från entreprenör

### Scenariot

```
Från: info@anderssonvvs.se
Ämne: Offert stambesiktning Storgatan 1A-C
Bilagor: offert_stambesiktning_2026.pdf (245 KB)
Brödtext: "Hej, enligt överenskommelse bifogar vi offert för
stambesiktning av tre trapphus. Giltig t.o.m. 2026-06-30.
Hör av er om ni har frågor. Mvh Anders, Andersson VVS"
```

### Vad systemet gör

#### Entreprenörsidentifiering

```
✅ Känd entreprenör: Andersson VVS
   Registrerad i Contractor-registret
   Kategori: VVS
   Tidigare ärenden: 5 (senaste: 2026-02)
   Kontaktperson: Anders Andersson
```

#### Koppling till pågående ärende

```
📋 Pågående ärenden med Andersson VVS:
   Besiktning #12 "Stambesiktning planerad 2026" — status: Planerad
   
   [Koppla offert till besiktning #12]
```

#### Bilagehantering

PDF-bilagan:
1. Sparas i dokumentarkivet (Document-modellen)
2. Kategoriseras som "Offert"
3. Kopplas till ärendet via Attachment
4. Metadata: filnamn, storlek, datum, kopplad entreprenör

#### Åtgärdsförslag

```
Föreslagna åtgärder:
  ● Koppla till befintlig besiktning #12
  ○ Skapa nytt ärende: Upphandling/Offert
  ○ Vidarebefordra till kassören (ekonomi-inkorgen)
  ○ Arkivera (ingen åtgärd)
```

---

## Flöde 3: Myndighetsmail

### Scenariot

```
Från: tillsyn@brandskydd.se
Ämne: Föreläggande — brandskyddsbesiktning BRF Exempelgården
Brödtext: "Enligt 2 kap. 2 § lagen om skydd mot olyckor ska ägare
till byggnader vidta åtgärder... Besiktning ska genomföras senast
2026-09-30. Vid utebliven åtgärd kan vite utfärdas."
```

### Vad systemet gör

```
⚠ MYNDIGHETSPOST
  Avsändare: tillsyn@brandskydd.se
  Nyckelord: "föreläggande", "vite", "senast"

  📅 Identifierad deadline: 2026-09-30
  
  Föreslagna åtgärder:
  ● Skapa besiktningsärende med deadline 2026-09-30
  ○ Skapa uppgift till ordförande/styrelsen
  ○ Koppla till befintlig brandskyddskomponent

  ☑ Markera som brådskande
  ☑ Notifiera ordförande
```

Myndighetspost identifieras via:
- Känd domän (kommun.se, brandskydd.se, boverket.se, etc.)
- Nyckelord: föreläggande, tillsyn, vite, lagkrav
- Systemet föreslår alltid att notifiera ordförande vid myndighetspost

---

## Flöde 4: Uppföljning av pågående ärende

### Scenariot

Förvaltaren mailade Andersson VVS om en akut läcka för 3 dagar sedan. Inget svar.

### Vad systemet gör

**Påminnelsepanel i inkorgen:**
```
⏰ Väntande svar (3)
   Andersson VVS — "Akut: Vattenläcka källare B"
     Skickat: 2026-04-09 (3 dagar sedan)
     Kopplat till: Felanmälan #142
     [Påminn]  [Ring: 08-123 456]  [Eskalera]

   Securitas AB — "Larmavtal förnyelse"
     Skickat: 2026-04-05 (7 dagar sedan)
     Kopplat till: Uppgift #347
     [Påminn]  [Eskalera]

   Kommun Stadsbyggnad — "Fråga om bygglov altaner"
     Skickat: 2026-03-28 (15 dagar sedan)
     Inget kopplat ärende
     [Påminn]  [Skapa ärende]
```

**"Påminn"** → genererar ett kort uppföljningsmail:
```
Från: forvaltning@brfexempel.se
Till: info@anderssonvvs.se
Ämne: Re: Akut: Vattenläcka källare B

Hej Anders,

Återkommer angående vattenläckan i källare B. 
Har ni möjlighet att komma ut idag eller imorgon?

Med vänliga hälsningar,
[Signatur]
```

Förvaltaren kan redigera innan den skickas. Texten är ett förslag, inte automatiskt.

---

## Flöde 5: Bekräftelsemail till anmälaren

När en felanmälan skapas från e-post kan förvaltaren välja att skicka bekräftelse.

### Mallsystem

```
Hej {förnamn},

Tack för din felanmälan om {ärendetitel}. Vi har registrerat
ärendet (referens: #{ärendenummer}).

{valfri_kommentar}

Du kan följa ärendet i Hemmet:
{ärendelänk}

Med vänliga hälsningar,
{signatur}
```

Variabler fylls i automatiskt. Förvaltaren kan:
- Lägga till en personlig kommentar ("Vi skickar ut rörmokare imorgon")
- Välja att inte skicka bekräftelse (t.ex. för interna ärenden)
- Redigera hela texten

### Automatisk bekräftelse (opt-in)

Föreningen kan konfigurera att bekräftelsemejl skickas automatiskt vid alla felanmälningar skapade från e-post. Standard: manuellt (förvaltaren väljer).

---

## Smart kontextpanel

All smart information samlas i en kontextpanel till höger om e-postmeddelandet:

```
┌─ Kontext ──────────────────────────────┐
│                                         │
│ 👤 AVSÄNDARE                           │
│ ⚠ Fuzzy match: Erik Lindqvist          │
│ Lgh 2003, Storgatan 1B                 │
│ Registrerad e-post avviker             │
│                                         │
│ 📍 PLATS                               │
│ Byggnad B → Källare → vid förråd 12    │
│                                         │
│ 📋 HISTORIK                            │
│ 2 fuktärenden i källare B (12 mån)     │
│ ⚠ Möjligt återkommande problem         │
│                                         │
│ 🔧 KOMPONENTER                         │
│ Dränering: 58 år ⚠ passerad            │
│ Källargolv: 58 år ⚠ passerad           │
│ Stammar: 22 år ✓                       │
│                                         │
│ 🔍 DUBBLETTER                          │
│ #141 "Vattenläcka källare B" (igår)    │
│                                         │
│ 💡 FÖRSLAG                             │
│ Allvarlighetsgrad: Hög                  │
│ Ärendetyp: Felanmälan                   │
└─────────────────────────────────────────┘
```

All information är **rådgivande** — förvaltaren fattar alla beslut. Systemet föreslår, människan beslutar.

---

## Konfigurerbara regler

I `/installningar/epost/forvaltning`:

| Inställning | Standard | Beskrivning |
|-------------|----------|-------------|
| Påminnelse obesvarat | 3 dagar | Dagar innan påminnelse om obesvarat mail |
| Auto-bekräftelse felanmälan | Av | Skicka bekräftelse automatiskt |
| Dubblettfönster | 7 dagar | Sök dubbletter inom N dagar |
| Komponentkorsreferens | På | Visa K3-komponenter i kontextpanel |
| Myndighetsdetektering | På | Flagga myndighetspost automatiskt |
| Platsparsning | På | Försök identifiera plats från e-posttext |
| Historiklängd | 12 mån | Hur långt tillbaka historik visas |

---

## Ärendetyper per e-postsignal

Sammanfattning av vilka ärenden som kan skapas från förvaltningsinkorgen:

| E-postsignal | → Ärendetyp | Automatiska fält |
|---|---|---|
| Boende rapporterar fel | DamageReport | Plats, allvarlighet, lägenhet |
| Boende frågar om renovering | RenovationApplication | Typ, lägenhet |
| Entreprenör skickar offert | Koppla till Inspection/Task | Entreprenör, bilaga |
| Entreprenör skickar rapport | Koppla till Inspection | Bilaga → dokumentarkiv |
| Myndighet skickar föreläggande | Inspection + Task | Deadline, allvarlighet KRITISK |
| Försäkring om skadereglering | Koppla till DamageReport | Referensnummer |
| Boende klagar på annat boende | DisturbanceCase | Plats, typ (med "knacka på"-filter) |
| Generell fråga | Task eller Suggestion | — |

### Störningsanmälan via e-post — specialfall

Om ett mail identifieras som möjlig störningsanmälan visar systemet:

```
⚠ Detta kan vara en störningsanmälan.

Enligt föreningens policy ska boende uppmuntras att prata
med sin granne innan formell anmälan görs.

Föreslaget svar:
"Hej, tack för att du hör av dig. Vi rekommenderar att du
först pratar med din granne om detta — ofta löser sig saker
med ett samtal. Om problemet kvarstår efter det kan du göra
en formell anmälan via Hemmet: [länk]"

[Skicka föreslaget svar]  [Skapa ärende ändå]  [Skriv eget svar]
```

Boendefilosofin gäller även i e-postflödet.

---

## Veckosammanfattning

Varje måndag morgon får förvaltaren en sammanfattning:

```
📧 Förvaltning — vecka 15 (2026)

Inkomna: 8 mail
Hanterade: 6 (75%)
Ohanterade: 2
  ● Offert ventilationsbesiktning (Klimatbolaget AB, 3 dagar)
  ● Fråga om altanbygge (Lars Pettersson, lgh 1004, 1 dag)

Väntande svar: 3
  ⚠ Andersson VVS — akut läcka (3 dagar)
  ● Securitas — larmavtal (7 dagar)
  ● Kommunen — bygglovsfråga (15 dagar)

Skapade ärenden från e-post: 4
  #142 Felanmälan: Vattenläcka källare B
  #143 Felanmälan: Trasig belysning garage
  #144 Uppgift: Offert hisservice
  #145 Besiktning: OVK planering 2026
```

Levereras som in-app-notifikation + valfritt e-post till förvaltarens personliga mail.

---

## Implementation — förvaltarspecifikt

Utöver de generella faserna i `EPOST.md` kräver förvaltarinkorgen:

### Fas 2 (Ärendekoppling) — tillägg

- [ ] Avsändaridentifiering med fuzzy match mot User + Apartment
- [ ] Andrahandshyresgästdetektering via SubletApplication
- [ ] Platsparsning från e-posttext
- [ ] Allvarlighetsförslag baserat på nyckelord
- [ ] Dubblettdetektering (plats + tid + nyckelord)

### Fas 3 (Svar) — tillägg

- [ ] Bekräftelsemail-mall för felanmälan
- [ ] Konfiguration: auto-bekräftelse on/off
- [ ] "Knacka på"-filter för störningsrelaterade mail

### Fas 4 (Smart funktionalitet) — tillägg

- [ ] Ärendehistorik per plats
- [ ] Komponentkorsreferens (K3)
- [ ] Entreprenörsidentifiering via Contractor-modellen
- [ ] Myndighetsdetektering (domänlista + nyckelord)
- [ ] Deadline-parsning från myndighetsmail
- [ ] Påminnelsesystem för obesvarade mail
- [ ] Veckosammanfattning
