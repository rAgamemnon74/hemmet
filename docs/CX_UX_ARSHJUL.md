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

## Rendering: Integrerat i dashboarden

Ingen separat sida. Årshjulet är en del av dashboarden (`/`).

### Dashboard-layout (en sida, tre sektioner)

```
/ (Dashboard)

┌─ MITT JUST NU ──────────────────────────────┐
│ Personliga poster som kräver uppmärksamhet   │
│ (felanmälningar, protokoll att signera,      │
│  aktiviteter att anmäla sig till)            │
└──────────────────────────────────────────────┘

┌─ ÅRSHJULET ─────────────────────────────────┐
│ Kompakt: aktuella processer per verksamhetsår│
│ [Visa hela tidslinjen ↓] expanderar inline  │
└──────────────────────────────────────────────┘

┌─ ROLLSPECIFIKT ─────────────────────────────┐
│ Ordförande: ansökningar, utlägg att godkänna │
│ Kassör: ekonomi, prisbasbelopp               │
│ Boende: felanmälan, förslag                  │
└──────────────────────────────────────────────┘
```

### Kompaktvy (default)

Visar bara pågående + nästa process per verksamhetsår:

```
Årshjulet

  2025 (avslutas)     → Revision pågår
                      ○ Stämma 15 maj

  2026 (pågående)     ✓ Budget beslutad
                      → Underhåll tak planerat aug

  [Visa hela tidslinjen ↓]
```

### Expanderad vy (klicka "visa hela")

Hela tvåspåriga tidslinjen expanderar inline — scroll ner, ingen ny sida.

### Mobil

Samma kompaktvy som desktop. Vid "visa hela" renderas enkelspårig tidslinje med personliga poster markerade med blå vänsterkant.

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

Årshjulet är INTE en separat sida. Det är integrerat i dashboarden (`/`).

```
Översikt:
├── Dashboard (/ — innehåller årshjul + personligt + rollspecifikt)
└── Min sida (/min-sida — profil, lägenhet, samtycke)
```

Ingen navigation till årshjulet behövs — det syns direkt på startsidan.

---

## Prioriterad implementation

| Prio | Komponent | Komplexitet |
|------|-----------|:-----------:|
| 1 | **tRPC endpoint** — beräkna processstatus + personliga poster per användare | Medel |
| 2 | **"Mitt just nu"** — personliga poster som kräver uppmärksamhet | Låg |
| 3 | **Årshjul kompaktvy** — integrerad i dashboard, aktuella processer | Låg |
| 4 | **Expanderbar tidslinje** — "visa hela" expanderar inline | Medel |
| 5 | **Klicknavigation** — process → detaljsida med rollcheck | Medel |
| 6 | **Konfiguration** — anpassning per räkenskapsår | Låg |
