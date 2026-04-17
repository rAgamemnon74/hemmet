# Analys: Revisorsrollen i Hemmet

## Rollens natur — en granskningsroll

Revisorn tillhör varken styrelsen eller de operativa föreningsrollerna. Det är en **granskningsroll** — oberoende, vald av stämman, med uppdrag att granska styrelsens förvaltning och räkenskaper.

### Tre rollkategorier i systemet

```
1. Styrelseroller       — BOARD_*                  — förvaltar, beslutar, skriver
2. Föreningsroller      — NOMINATING_COMMITTEE      — oberoende uppdrag, eget arbetsflöde
3. Granskningsroller    — AUDITOR                   — oberoende, full läsåtkomst, ingen skrivåtkomst
```

Revisorn har **maximal läsåtkomst** men **minimal skrivåtkomst** — det omvända mot valberedningen som har begränsad läsåtkomst men eget arbetsflöde.

### Två typer av revisorer

| Typ | Beskrivning | Konto i systemet? |
|-----|-------------|:-----------------:|
| **Förtroendevald revisor** | Medlem vald av stämman att granska förvaltningen | JA — loggar in och arbetar i systemet |
| **Auktoriserad revisor** | Extern professionell (revisionsbolag) som granskar räkenskaperna | KANSKE — arbetar ofta i eget system, behöver exporterad data |

`BrfRules.requireAuthorizedAuditor` styr om föreningen kräver en auktoriserad revisor (default: false).

---

## Nuläge i Hemmet

### Vad som fungerar

| Funktion | Status | Detalj |
|----------|:------:|--------|
| Roll i enum | OK | `AUDITOR` finns med 13 permissions |
| Revisorssuppleant | OK | `AUDITOR_SUBSTITUTE` med 7 permissions |
| Revisions-UI | OK | `/revision` med lista och detaljvy |
| Revisionsflöde | OK | PENDING → IN_PROGRESS → COMPLETED |
| Revisionsberättelse | OK | Strukturerat formulär med yttrande, anmärkningar, rekommendation |
| Rekommendation | OK | APPROVE, APPROVE_WITH_REMARKS, DENY |
| Årsredovisning (läs) | OK | Revisorn kan se hela årsredovisningen |
| Ekonomi (läs) | OK | `expense:view_all`, `contract:view`, `procurement:view`, `contractor:view` |
| Styrelseprotokoll (läs) | OK | `meeting:view` och `meeting:protocol` |
| Medlemsregister (läs) | OK | Kan se namn, lägenhet, roller |
| Dokument (läs) | OK | Kan se styrelsedokument |
| Dagordningspunkt | OK | "Revisionsberättelse" i årsmötesmallen |
| Testanvändare | OK | `revisor@hemmet.se` / `password123` |

### Revisionsformuläret

Revisorn fyller i strukturerat:
1. **Granskning av räkenskaper** (financialReview) — fritext
2. **Granskning av förvaltning** (boardReview) — fritext
3. **Anmärkningar** (findings) — fritext, valfritt
4. **Revisionsberättelse** (statement) — obligatoriskt, det formella yttrandet
5. **Rekommendation** — APPROVE / APPROVE_WITH_REMARKS / DENY

### Statusflöde

```
Styrelse: Skapar årsredovisning (DRAFT)
    ↓
Styrelse: Skickar till revision, väljer revisor (REVIEW)
    ↓
Revisor: Startar granskning (IN_PROGRESS)
    ↓
Revisor: Lämnar revisionsberättelse + rekommendation (COMPLETED)
    → Årsredovisning → REVISED
    ↓
Styrelse: Godkänner (APPROVED) → Publicerar (PUBLISHED)
    ↓
Stämma: Revisorn presenterar "Revisionsberättelse" (dagordningspunkt)
    → Stämman röstar om ansvarsfrihet
```

---

## Genomförda förbättringar

### Ekonomisk läsåtkomst (tidigare brist 1) — IMPLEMENTERAD

Revisorn har nu full läsåtkomst till ekonomisk data:
- `expense:view_all` — alla utlägg och attestflöden
- `contract:view` — avtal
- `procurement:view` — upphandlingar
- `contractor:view` — entreprenörer

### Protokoll-läsåtkomst (tidigare brist 2) — IMPLEMENTERAD

Revisorn har nu läsåtkomst till styrelseprotokoll:
- `meeting:view` — se möten och dagordning
- `meeting:protocol` — läsa protokoll (utan `meeting:edit`, så ingen skrivrättighet)

### Revisorssuppleant (tidigare brist 5) — IMPLEMENTERAD

`AUDITOR_SUBSTITUTE`-rollen finns med 7 permissions: `annual:view`, `annual_report:view`, `audit:view`, `meeting:view`, `document:view_board`, `announcement:view`, `member:view_registry`. Saknar `audit:perform` — aktiveras först vid behov.

---

## Kvarstående brister

### 1. Revisorn kan inte rösta på stämman

- `annual:vote` saknas på AUDITOR — revisorn är ofta också medlem
- Revisorn har `AUDITOR` men inte `MEMBER` roll i testdata
- I verkligheten är den förtroendevalda revisorn nästan alltid också medlem

**Åtgärd:** Revisorn bör ha dubbla roller: `AUDITOR` + `MEMBER`. Seed-data bör uppdateras.

### 2. Ingen skillnad mellan förtroendevald och auktoriserad revisor

- Systemet har en enda `AUDITOR`-roll
- Ingen markering av om revisorn är auktoriserad/godkänd
- `BrfRules.requireAuthorizedAuditor` finns men kontrolleras inte vid rolltilldelning
- En extern auktoriserad revisor behöver kanske inte fullt systemkonto — snarare exportfunktion

**Åtgärd:**
- Lägg till fält `isAuthorized` på UserRole eller separat modell
- Alternativt: två roller `AUDITOR_ELECTED` (förtroendevald) och `AUDITOR_AUTHORIZED` (auktoriserad)
- Om auktoriserad: stöd för export av revisionsunderlag (PDF/SIE) istället för inloggning

### 3. Revisionsberättelsen presenteras inte i mötessystemet

- Dagordningspunkten "Revisionsberättelse" finns men har ingen `specialType`
- Revisionsberättelsens text visas inte automatiskt i mötesadmin eller presentation
- Ordförande/sekreterare måste manuellt referera till revisionen

**Åtgärd:** Ny `specialType: "AUDIT_REPORT"` som automatiskt visar revisionsberättelsen och rekommendationen under den dagordningspunkten.

### 4. Ansvarsfrihet kopplas inte till revisionsutlåtande

- Dagordningspunkten "Fråga om ansvarsfrihet för styrelsen" finns men har ingen `specialType`
- Inget samband mellan revisorns rekommendation (APPROVE/DENY) och ansvarsfrihetsbeslut
- Om revisorn avstyrker (DENY) borde systemet flagga detta tydligt vid ansvarsfrihetspunkten

**Åtgärd:** Ny `specialType: "DISCHARGE_VOTE"` som visar revisorns rekommendation och varnar om revisorn avstyrkt.

### 5. Ingen åtkomstloggning av revisorns granskning

- Revisorn har bred läsåtkomst men systemet loggar inte vad som lästs
- GDPR kräver loggning vid åtkomst till personuppgifter
- Revisionsspåret (vad revisorn granskade och när) saknas

**Åtgärd:** Logga revisorns åtkomst till personuppgifter och ekonomisk data.

### 6. Ingen kontinuerlig granskning

- Nuvarande flöde är batch: styrelsen skickar färdig årsredovisning → revisorn granskar allt på en gång
- I verkligheten granskar revisorn löpande under verksamhetsåret
- Ingen möjlighet att lämna löpande anmärkningar eller frågor till styrelsen

**Åtgärd:** Komplettera med möjlighet för revisorn att ställa frågor och lämna observationer löpande, kopplade till specifika perioder/transaktioner.

---

## Permissions: Nuläge

### AUDITOR (13 permissions)

```
annual:view, annual_report:view,
audit:perform, audit:view,
meeting:view, meeting:protocol,
expense:view_all,
contract:view, procurement:view, contractor:view,
document:view_board,
announcement:view,
member:view_registry
```

### AUDITOR_SUBSTITUTE (7 permissions)

```
annual:view, annual_report:view,
audit:view,
meeting:view,
document:view_board,
announcement:view,
member:view_registry
```

Suppleanten saknar `audit:perform`, `meeting:protocol`, `expense:view_all` och ekonomi-permissions (`contract:view`, `procurement:view`, `contractor:view`) — dessa aktiveras först om suppleanten träder in som ordinarie.

### Saknas fortfarande

```
annual:vote                   // Rösta på stämma — kräver dubbel roll AUDITOR + MEMBER
```

### Behörighetskontroll: läs vs skriv

Revisorn har `meeting:protocol` men inte `meeting:edit`. Protokolltabben visar bara edit-UI om `canEdit` (som kräver `meeting:edit`), så revisorn får automatiskt läsåtkomst utan skrivrättighet. Samma mönster gäller `expense:view_all` — revisorn kan se men inte attestera.

---

## Jämförelse med andra roller

| Aspekt | Förtroendevald revisor | Auktoriserad revisor | Styrelsemedlem | Valberedare |
|--------|:---------------------:|:--------------------:|:--------------:|:-----------:|
| Vald av stämman | JA | Nej (upphandlad) | JA | JA |
| Oberoende krav | JA (starkt) | JA (lagstadgat) | NEJ | JA |
| Del av styrelsen | NEJ | NEJ | JA | NEJ |
| Konto i systemet | JA | Kanske (export) | JA | JA |
| Se ekonomi | JA | JA (externt) | JA | NEJ |
| Se protokoll | JA | JA (externt) | JA | NEJ |
| Se medlemsregister | JA (begränsat) | Nej normalt | JA | JA (begränsat) |
| Se personnummer | NEJ | NEJ | Ordförande/kassör | NEJ |
| Ändra data | NEJ — bara revisionsberättelse | NEJ | JA | Nomineringar |
| Rösta på stämma | JA (som medlem) | NEJ | JA (som medlem) | JA (som medlem) |

---

## Koppling till BrfRules

### Befintliga regler

| Regel | Default | Relevans |
|-------|---------|----------|
| `minAuditors` | 1 | Minst en revisor ska väljas |
| `maxAuditors` | 2 | Max två revisorer |
| `maxAuditorSubstitutes` | 2 | Max två revisorssuppleanter |
| `requireAuthorizedAuditor` | false | Om auktoriserad revisor krävs |

### Föreslagna tillägg

```
BrfRules {
  auditDeadlineWeeks          Int     @default(6)    // Veckor revisorn har på sig att granska
  auditContinuousEnabled      Boolean @default(false) // Löpande granskning aktiverad
  auditRequiresFinancialData  Boolean @default(true)  // Krav på ekonomiskt underlag vid revision
}
```

---

## Dagordnings-integration (årsmöte)

### Nuvarande

| Punkt | specialType | Koppling till revision |
|-------|:-----------:|:---------------------:|
| Styrelsens årsredovisning | Ingen | Ingen |
| Revisionsberättelse | Ingen | Ingen |
| Fråga om ansvarsfrihet | Ingen | Ingen |
| Val av revisor | Ingen | Ingen |

### Föreslaget

| Punkt | Föreslagen specialType | Funktion |
|-------|:---------------------:|----------|
| Styrelsens årsredovisning | `ANNUAL_REPORT` | Visa årsredovisningens sammanfattning |
| Revisionsberättelse | `AUDIT_REPORT` | Visa revisionsberättelse + rekommendation automatiskt |
| Fråga om ansvarsfrihet | `DISCHARGE_VOTE` | Visa revisorns rekommendation, varna vid DENY |
| Val av revisor | `AUDITOR_ELECTION` | Visa valberedningens förslag, registrera val |

---

## Extern revisor: Exportflöde

Om föreningen har en auktoriserad revisor som arbetar i eget system behöver Hemmet stödja:

1. **Export av revisionsunderlag**
   - Årsredovisning som PDF
   - Utlägg/verifikationer som SIE-fil eller PDF
   - Styrelseprotokoll som PDF
   - Medlemsregister (anonymiserat vid behov)

2. **Import av revisionsberättelse**
   - Revisorn levererar sitt yttrande
   - Styrelsen registrerar det i systemet
   - Alternativt: revisorn får en begränsad inloggning för att bara lämna revisionsberättelse

3. **Auktoriserad revisors PUB-avtal**
   - GDPR kräver PUB-avtal om revisorn får personuppgifter
   - Systemet bör kräva registrerat PUB-avtal innan export/åtkomst

---

## Prioriterad åtgärdslista

| Prio | Funktion | Status |
|------|----------|--------|
| ~~1~~ | ~~Ge revisor ekonomi-läsåtkomst~~ | KLAR — `expense:view_all`, `contract:view`, `procurement:view`, `contractor:view` |
| ~~2~~ | ~~Ge revisor protokoll-läsåtkomst~~ | KLAR — `meeting:view`, `meeting:protocol` |
| ~~3~~ | ~~Revisorssuppleant-roll~~ | KLAR — `AUDITOR_SUBSTITUTE` med 7 permissions |
| 4 | **specialType för revisionsberättelse** | Visa revisionen automatiskt vid stämman |
| 5 | **specialType för ansvarsfrihet** | Koppla revisorns rekommendation till ansvarsfrihetsbeslut |
| 6 | **Skilja förtroendevald/auktoriserad** | Olika flöden: inloggning vs export |
| 7 | **Åtkomstloggning** | GDPR-krav vid revisorns läsåtkomst |
| 8 | **Löpande granskning** | Möjlighet att ställa frågor under verksamhetsåret |
| 9 | **Revisionsunderlag-export** | PDF/SIE-export för extern revisor |
