# CX/UX: Årshjulet — föreningens puls

## Koncept

Årshjulet är en vertikal tidslinje som visar föreningens formella och vardagliga processer. Det är:

1. **Öppet för alla** — transparens, alla boende ser vad som händer
2. **Tvåspårigt** — vänster: mitt boende (personligt), höger: föreningen (formellt)
3. **Logiskt grupperat** — per verksamhetsår, inte per kalendermånad
4. **Levande** — visar status (gjort/pågår/kommande) i realtid

---

## Grundinsikt: Två verksamhetsår lever parallellt

Det pågår alltid två verksamhetsår samtidigt:

- **Föregående året** stängs successivt (bokslut → årsberättelse → revision → stämma → ansvarsfrihet)
- **Innevarande året** rullar på (avgifter, underhåll, felanmälningar, styrelsemöten)

Stämman hör **logiskt** till det föregående verksamhetsåret — den är slutpunkten, inte en händelse i det nya. Konstituerande mötet (nya styrelsen tillträder) är det logiskt första steget i det innevarande året.

```
Verksamhetsår 2025:
    Jan 2025 — Verksamheten börjar
    Dec 2025 — Verksamheten avslutas, bokslut
    Feb 2026 — Årsberättelse
    Apr 2026 — Revision
    Maj 2026 — STÄMMA (sista punkten för 2025)

Verksamhetsår 2026:
    Maj 2026 — Konstituerande möte (första punkten för 2026)
    ...verksamheten pågår...
    Dec 2026 — Bokslut
```

---

## Tvåspårsmodellen

### Design

```
    MITT BOENDE                          FÖRENINGEN
    (personligt)                         (formellt)
    
    ═══ Verksamhetsår 2025 (avslutande) ═════════════════════
    
                                         ● Bokslut                     ✓
                                         │ Räkenskapsåret avslutades
                                         │
                                         ● Årsberättelse               ✓
                                         │ Signerad av styrelsen
                                         │
                                         ● Revision                    → Pågår
                                         │ Revisorns granskning
                                         │
    Motioner du lämnat ──────────────── ● Stämma 15 maj               ○
    resultat presenteras                 │ Årsredovisning, ansvarsfrihet,
                                         │ val av styrelse och revisor
                                         │
                                         ● Ansvarsfrihet               ○
                                         │ Stämman beslutar
                                         │
                                         ● Bolagsverket                ○
                                           Senast 31 juli 2026
    
    ═══ Verksamhetsår 2026 (pågående) ═══════════════════════
    
                                         ● Konstituerande möte         ○
                                         │ Nya styrelsen tillträder
                                         │
    Ny avgift: 4 500 kr/mån ────────── ● Budget 2026 beslutad        ✓
    sedan januari                        │
                                         │
    Din felanmälan: kran lgh 2001 ───── ● Styrelsemöte mars           ✓
    → åtgärdas denna vecka              │ 5 beslut fattade
                                         │
    Renovering: ditt badrum ──────────── ● Styrelsemöte april          → Pågår
    ansökan under behandling             │
                                         │
    Städdag 10 maj ─────────────────── ● Aktiviteter                  ○
    anmäl dig!                           │
                                         │
    Andrahand: din ansökan ───────────── │
    godkänd t.o.m. december              │
                                         │
                                         ● Underhåll: tak Hus A       ○
                                         │ Planerat augusti
                                         │
                                         ● Budgetarbete 2027          ○
                                         │ September-november
                                         │
                                         ● Avgiftskalkyl 2027         ○
                                           November
```

### Designprinciper

**1. Logisk gruppering, inte kalender**
Processer grupperas per verksamhetsår. Stämman i maj 2026 visas under "Verksamhetsår 2025 (avslutande)" — inte under 2026.

**2. Vänster = mig, höger = föreningen**
Vänster spåret visar bara saker som berör den inloggade användaren personligen. Höger spåret visar föreningens formella processer. Kopplingslinjerna visar sambandet.

**3. Vänster spåret är personligt**
Det renderas dynamiskt baserat på vem som är inloggad:
- Boende ser: sin avgift, sina felanmälningar, sina ansökningar, aktiviteter
- Medlem ser: ovan + motioner, stämma (rösta), nomineringar
- Styrelsemedlem ser: ovan + "mina styrelsebeslut", protokoll att signera

**4. Höger spåret är gemensamt**
Alla ser samma formella processer. Statusfärgerna är identiska för alla. Det enda som skiljer: vilka processer man kan **klicka vidare** på beror på roll.

**5. Det föregående året tonas ner successivt**
Processer som är klara visas dimmat/kompakt. Pågående processer framhävs. Kommande visas normalt.

---

## Vad varje roll ser i vänster spåret

### Boende (RESIDENT)

```
MITT BOENDE:
├── Min avgift/hyra
├── Mina felanmälningar (status)
├── Mina förslag (status)
├── Mina bokningar (tvättstuga, bastu)
├── Aktiviteter (städdag, grillkväll)
└── Störningsärende (om berörd)
```

### Medlem (MEMBER)

```
MITT BOENDE:
├── Allt ovan +
├── Min lägenhet (andelstal, avgift)
├── Mina motioner (status, resultat vid stämma)
├── Min andrahandsansökan (status)
├── Min renoveringsansökan (status)
├── Stämma (datum, dagordning, rösta)
├── Nomineringsförslag (om period öppen)
└── Överlåtelse (om pågående)
```

### Styrelsemedlem (BOARD_*)

```
MITT BOENDE:
├── Allt ovan +
├── Mina uppgifter (tilldelade tasks)
├── Protokoll att signera
├── Årsberättelse att signera
├── Jävsdeklarationer jag gjort
└── Nästa styrelsemöte (dagordning)
```

---

## Interaktion

### Klick på höger spåret (föreningens processer)

| Process | Alla | Medlem | Styrelse | Berörd roll |
|---------|:----:|:------:|:--------:|:-----------:|
| Bokslut | Info | Info | Info | Kassör → SIE-import |
| Årsberättelse | Läs (efter publicering) | Läs | Redigera/signera | Sekreterare → layout |
| Revision | Info | Info | Läs | Revisor → granska |
| Stämma | Datum/plats | Dagordning + rösta | Admin + presentation | Ordförande → leda |
| Ansvarsfrihet | Info | Rösta | Presenteras | — |
| Budget | Info | Se | Redigera | Kassör → kalkylera |
| Underhåll | Info | Info | Planera | Fastighetsansv. → schemalägga |
| Styrelsemöte | — | — | Detaljer | Ordförande → dagordning |

### Klick på vänster spåret (mina saker)

Alltid: navigera direkt till relevant detaljsida.
- "Din felanmälan: kran" → `/boende/skadeanmalan/{id}`
- "Renovering: ditt badrum" → `/boende/renovering`
- "Städdag 10 maj" → `/info` (meddelande)
- "Protokoll att signera" → `/styrelse/moten/{id}?tab=protocol`

---

## Tre renderingslägen

### 1. Fullvy (`/arshjul`)

Hela tidslinjen med båda spår synliga. Scroll ner = framåt i tiden.
Expanderbara sektioner: klicka på en process → visa detaljer inline.

### 2. Dashboard-widget

Kompakt: bara aktuella och nästa 2-3 processer per spår:

```
┌─────────────────────────────────────────────┐
│  Årshjulet                                  │
│                                             │
│  2025 (avslutas):    → Revision pågår       │
│                      ○ Stämma 15 maj        │
│                                             │
│  2026 (pågående):    Din felanmälan →       │
│                      åtgärdas denna vecka    │
│                      ○ Städdag 10 maj        │
└─────────────────────────────────────────────┘
```

### 3. Mobilvy

Samma vertikala tidslinje men enkelspårig — "mitt boende" och "föreningen" alternerar:

```
┌──────────────────────┐
│ ── 2025 (avslutas) ──│
│ ✓ Bokslut            │
│ ✓ Årsberättelse      │
│ → Revision pågår     │
│ ○ Stämma 15 maj      │
│   Din motion behandlas│
│                      │
│ ── 2026 (pågående) ──│
│ ✓ Avgift 4 500 kr    │
│ → Felanmälan: kran   │
│ ○ Städdag 10 maj     │
│ ○ Underhåll tak aug  │
└──────────────────────┘
```

Personliga poster markeras visuellt (t.ex. blå vänsterkant) för att skilja från formella.

---

## Dynamisk statusberäkning

Systemet beräknar status per process:

| Status | Visuellt | Betydelse |
|--------|----------|-----------|
| `DONE` | ● grön + bock | Slutfört |
| `ACTIVE` | ◉ blå + puls | Pågår just nu |
| `UPCOMING` | ○ grå | Kommande, inget att göra ännu |
| `WARNING` | ◉ gul | Deadline närmar sig |
| `OVERDUE` | ● röd | Försenat — kräver handling |
| `PERSONAL` | ◉ blå + vänsterkant | Min personliga post |

Beräknas automatiskt från systemdata:
- Årsberättelse: `AnnualReport.status` → DONE om PUBLISHED
- Revision: `Audit.status` → ACTIVE om IN_PROGRESS
- Stämma: `Meeting.status` (type=ANNUAL) → DONE om COMPLETED
- Felanmälan: `DamageReport.status` → ACTIVE om IN_PROGRESS
- Deadline stämma: `fiscalYearEnd + 6 mån` → OVERDUE om passerat utan stämma

---

## Konfiguration

Tidslinjen anpassas baserat på:

| Källa | Påverkar |
|-------|---------|
| `BrfSettings.fiscalYearStart/End` | Gruppering av verksamhetsår |
| `BrfRules.motionDeadlineMonth/Day` | Motionsdeadline-position |
| `BrfRules.noticePeriodMinWeeks` | Kallelsedeadline relativt stämma |
| Användarens roller | Vad som visas i vänster spåret |
| Användarens ärenden | Personliga poster (felanmälan, ansökningar etc.) |

### Icke-kalenderår

Vid räkenskapsår jul-jun förskjuts hela tidslinjen. Grupperna "avslutande" och "pågående" roterar 6 månader. Logiken förblir densamma — bara månaderna skiftar.

---

## Navigationsplacering

```
Översikt:
├── Dashboard (rollspecifikt)      ← befintlig
├── Årshjulet (/arshjul)          ← NY sida, länk i nav + dashboard-widget
└── Min sida (personligt)          ← befintlig
```

Ingen permission krävs för att se årshjulet. Det är föreningens gemensamma klocka.

---

## Prioriterad implementation

| Prio | Komponent | Komplexitet |
|------|-----------|:-----------:|
| 1 | **tRPC endpoint** — beräkna processstatus + personliga poster per användare | Medel |
| 2 | **Dashboard-widget** — kompakt tvåspår med aktuella processer | Låg |
| 3 | **Fullvy** (`/arshjul`) — vertikal tvåspårig tidslinje | Medel |
| 4 | **Mobilvy** — enkelspårig med visuell markering personligt/formellt | Låg |
| 5 | **Klicknavigation** — process → detaljsida med rollcheck | Medel |
| 6 | **Konfiguration** — anpassning per räkenskapsår | Låg |
