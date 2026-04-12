# CX/UX: Årshjulet — föreningens puls

## Koncept

Årshjulet är en visuell representation av alla formella processer som återkommer under ett verksamhetsår. Det är:

1. **Öppet för alla** — transparens, alla boende ser vad som händer
2. **Navigerbart** — berörda roller klickar vidare till detaljer
3. **Levande** — visar status (gjort/pågår/kommande) i realtid
4. **Konfigurerbart** — baseras på föreningens räkenskapsår och BrfRules

---

## Årshjulets processer

### Formella basprocesser (alla BRF:er)

| Månad (jan-dec) | Process | Ansvarig | Systemkoppling |
|:-:|-----------|---------|---------------|
| **Jan** | Prisbasbelopp uppdateras | Kassör | BrfRules.prisbasbelopp |
| **Jan-Feb** | Bokslutsarbete | Kassör + förvaltare | Externt (SIE-import) |
| **Feb** | Motionsdeadline | Medlemmar | BrfRules.motionDeadlineMonth/Day |
| **Feb-Mar** | Årsberättelse sammanställs | Styrelsen | AnnualReport (DRAFT) |
| **Mar** | Årsberättelse layoutas + signeras | Styrelsen | AnnualReport (FINAL_UPLOADED → SIGNED) |
| **Mar-Apr** | Revision | Revisor | Audit (PENDING → COMPLETED) |
| **Apr** | Kallelse + dagordning | Sekreterare | Meeting (DRAFT → SCHEDULED) |
| **Maj** | **Ordinarie stämma** | Styrelsen | Meeting (type=ANNUAL) |
| **Maj** | Konstituerande styrelsemöte | Nya styrelsen | Meeting (type=BOARD) |
| **Jun** | Deadline stämma (LEF 7:10) | — | Varning om ej genomförd |
| **Jul** | Bolagsverket inlämning | Kassör/förvaltare | Externt |
| **Sep** | Budgetarbete nästa år | Kassör | — |
| **Okt** | Underhållsplan granskning | Fastighetsansvarig | BuildingComponent |
| **Nov** | Avgiftskalkyl + beslut | Kassör + styrelse | Decision |
| **Dec** | Räkenskapsåret avslutas | — | BrfSettings.fiscalYearEnd |

### Löpande processer (visas i hjulets mitt)

| Process | Frekvens | Ansvarig |
|---------|----------|---------|
| Styrelsemöten | 6-12/år | Ordförande |
| Felanmälningar | Löpande | Fastighetsansvarig |
| Överlåtelser | Vid behov | Ordförande + kassör |
| Besiktningar | Enligt kalender | Fastighetsansvarig |
| Utlägg/fakturor | Löpande | Kassör |

### Säsongsprocesser (valfria)

| Process | Typisk period | Ansvarig |
|---------|:------------:|---------|
| Vår-städdag | April-maj | Aktivitetsansvarig/alla |
| Höst-städdag | September-oktober | Aktivitetsansvarig/alla |
| Trädgårdsskötsel | Maj-september | Fastighetsansvarig |
| Snöröjning | November-mars | Fastighetsansvarig |
| Julglögg/grillkväll | December/juni | Aktivitetsansvarig |

---

## UX-design

### Visuellt årshjul

```
                        JAN
                    ╱    │    ╲
                DEC      │      FEB
               ╱    Prisbasbelopp  ╲
              │     Bokslut    Motions- │
         NOV  │                deadline │  MAR
        Avgift│    ┌──────────┐  Årsber.│
         kalkyl    │ LÖPANDE  │  Layout │
              │    │          │  Signera│
         OKT  │    │ Möten    │        │  APR
        Under-│    │ Felanm.  │  Revis.│
        hålls-│    │ Överlåt. │ Kallelse│
        plan  │    └──────────┘        │
               ╲                      ╱  MAJ
           SEP  ╲    Budget    STÄMMA ╱
                 ╲              ╱
                   AUG  JUL  JUN
                        │
                    Bolagsverket
```

Hjulet renderas som en cirkulär grafik (SVG/Canvas) med:
- **12 segment** — ett per månad
- **Aktuell månad markerad** (t.ex. blå sektor)
- **Klickbara processer** — text/ikon per process
- **Statusfärger** — grön (klart), blå (pågår), grå (kommande), röd (försenat)
- **Centrum** — löpande processer med räknare (3 öppna felanmälningar, 1 pågående överlåtelse)

### Tre vyer

**1. Fullvy (desktop) — /arshjul**
Stor cirkulär grafik med alla processer synliga. Hover visar detaljer. Klick navigerar till relevant sida.

**2. Kompaktvy (dashboard-widget)**
Mindre version som visar nuvarande + nästa 2 processer:
```
┌─────────────────────────────────┐
│  Årshjulet                      │
│                                 │
│  ← April 2026 →                │
│                                 │
│  ✓ Årsberättelse signerad       │
│  → Revision pågår               │
│  ○ Kallelse (deadline 15 april) │
│                                 │
│  Nästa: Stämma (5 maj)         │
└─────────────────────────────────┘
```

**3. Mobilvy**
Vertikal tidslinje istället för cirkel — lättare att scrolla:
```
┌────────────────────┐
│ ✓ Jan — Prisbasb.  │
│ ✓ Feb — Motioner   │
│ ✓ Mar — Signering  │
│ → Apr — REVISION   │  ← du är här
│ ○ Maj — STÄMMA     │
│ ○ Jun — Deadline   │
│ ...                │
└────────────────────┘
```

### Vem ser vad

| Element | Alla boende | Medlem | Styrelse | Roll-specifik |
|---------|:----------:|:------:|:--------:|:-------------:|
| Årshjulet (översikt) | Y | Y | Y | — |
| Processstatus (klart/pågår) | Y | Y | Y | — |
| Klicka → detaljsida | — | Delvis | Y | Bara sin roll |
| Redigera/agera | — | — | — | Y (berörd roll) |

**Exempel:**
- Alla ser: "April — Revision pågår"
- Medlem klickar: ser årsberättelsen (läs)
- Kassör klickar: ser revisionsdetaljer + kan agera
- Boende klickar: ser "Stämma planerad 5 maj" (info)

### Interaktion per process

| Process i hjulet | Klick leder till | Vem kan klicka vidare |
|-----------------|-----------------|:---------------------:|
| Prisbasbelopp | Inställningar → BrfRules | Kassör, Admin |
| Bokslutsarbete | Info-ruta: "Hanteras av förvaltaren" | Alla (info) |
| Motionsdeadline | /medlem/motioner | Alla medlemmar |
| Årsberättelse | /styrelse/arsberattelse/[id] | Styrelse (redigera), alla (läsa efter publicering) |
| Revision | /revision/[id] | Revisor (agera), styrelse (läsa) |
| Kallelse | /styrelse/moten/[id] (årsmöte) | Sekreterare, ordförande |
| Stämma | /medlem/arsmote/[id] | Alla medlemmar |
| Konstituerande möte | /styrelse/moten/[id] | Styrelse |
| Bolagsverket | Info-ruta: "Hanteras av förvaltaren" | Alla (info) |
| Budgetarbete | Info-ruta + beslut | Kassör |
| Underhållsplan | /förvaltning/komponenter | Fastighetsansvarig |
| Avgiftskalkyl | Styrelsebeslut → Decision | Kassör, styrelse |
| Felanmälningar (löpande) | /boende/skadeanmalan | Alla boende |
| Överlåtelser (löpande) | /styrelse/overlatelser | Kassör, ordförande |
| Besiktningar (löpande) | /förvaltning/besiktningar | Fastighetsansvarig |

---

## Dynamisk statusberäkning

Systemet beräknar automatiskt status per process baserat på data:

```typescript
function getProcessStatus(process, fiscalYear, now) {
  switch (process) {
    case "PRISBASBELOPP":
      // Kolla om BrfRules.prisbasbelopp uppdaterats i januari
      return rules.updatedAt > fiscalYearStart ? "DONE" : "PENDING";

    case "MOTIONSDEADLINE":
      // Kolla om deadline passerat
      const deadline = new Date(now.getFullYear(), rules.motionDeadlineMonth - 1, rules.motionDeadlineDay);
      return now > deadline ? "DONE" : now.getMonth() === deadline.getMonth() ? "ACTIVE" : "UPCOMING";

    case "ARSBERATTELSE":
      // Kolla AnnualReport status
      const report = getReportForFiscalYear(fiscalYear);
      if (!report) return "UPCOMING";
      if (report.status === "PUBLISHED") return "DONE";
      if (["DRAFT", "FINAL_UPLOADED", "SIGNED"].includes(report.status)) return "ACTIVE";
      return "UPCOMING";

    case "STAMMA":
      // Kolla Meeting type=ANNUAL
      const meeting = getAnnualMeeting(fiscalYear);
      if (!meeting) return "UPCOMING";
      if (meeting.status === "COMPLETED") return "DONE";
      if (meeting.status === "IN_PROGRESS") return "ACTIVE";
      return "UPCOMING";

    case "DEADLINE_STAMMA":
      // 6 mån efter räkenskapsårets slut
      const deadlineDate = addMonths(fiscalYearEnd, 6);
      if (stammaCompleted) return "DONE";
      if (now > deadlineDate) return "OVERDUE";
      if (now > subMonths(deadlineDate, 1)) return "WARNING";
      return "UPCOMING";
  }
}
```

Status renderas som:
- 🟢 **DONE** — grön, bock
- 🔵 **ACTIVE** — blå, pulsande
- ⚪ **UPCOMING** — grå
- 🟡 **WARNING** — gul, snart deadline
- 🔴 **OVERDUE** — röd, försenat

---

## Konfiguration per förening

Årshjulet anpassas baserat på:

| Källa | Påverkar |
|-------|---------|
| `BrfSettings.fiscalYearStart/End` | Hela hjulets rotation — jan-dec vs jul-jun |
| `BrfRules.motionDeadlineMonth/Day` | Motionsdeadline-processen |
| `BrfRules.noticePeriodMinWeeks` | Kallelse-deadline relativt stämma |
| `BrfRules.protocolDeadlineWeeks` | Protokolldeadline efter möten |
| `BrfRules.commercialUnitsExist` | Visa/dölj momsredovisning |
| `BrfRules.maintenancePlanRequired` | Visa/dölj underhållsplan-granskning |

### Icke-kalenderår

Om räkenskapsåret är jul-jun roteras hela hjulet:
- Juli = "start" (istället för januari)
- Stämma typiskt i november-december
- Allt förskjuts 6 månader

---

## Navigationsplacering

```
Översikt (ny layout):
├── Dashboard (rollspecifikt)
├── Årshjulet (gemensamt)    ← NY
└── Min sida (personligt)
```

Årshjulet syns för **alla inloggade** — det är föreningens gemensamma klocka. Ingen permission krävs för att se det. Permission krävs bara för att klicka vidare till detaljsidor.

---

## Prioriterad implementation

| Prio | Komponent | Komplexitet |
|------|-----------|:-----------:|
| 1 | **Dashboard-widget** (kompaktvy) — nästa 3 processer med status | Låg |
| 2 | **tRPC endpoint** — beräkna status per process baserat på data | Medel |
| 3 | **Fullvy** (/arshjul) — cirkulär grafik med alla processer | Medel |
| 4 | **Mobilvy** — vertikal tidslinje | Låg |
| 5 | **Konfiguration** — anpassning per räkenskapsår | Låg |
| 6 | **Klicknavigation** — process → detaljsida med rollcheck | Medel |
