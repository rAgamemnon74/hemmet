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
| Roll i enum | OK | `AUDITOR` finns med 8 permissions |
| Revisions-UI | OK | `/revision` med lista och detaljvy |
| Revisionsflöde | OK | PENDING → IN_PROGRESS → COMPLETED |
| Revisionsberättelse | OK | Strukturerat formulär med yttrande, anmärkningar, rekommendation |
| Rekommendation | OK | APPROVE, APPROVE_WITH_REMARKS, DENY |
| Årsredovisning (läs) | OK | Revisorn kan se hela årsredovisningen |
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

## Kritiska brister

### 1. Revisorn kan inte se ekonomisk data

**Den största bristen.** En revisor som inte kan se ekonomin kan inte revidera.

- Ingen `expense:view_all` — kan inte se utlägg, fakturor, attestflöden
- Ingen tillgång till budget, avgiftshistorik, bankuppgifter
- Årsredovisningens `economy`-fält är fritext som styrelsen skriver — revisorn kan inte verifiera mot underliggande data
- Inga verifikationer, kontoutdrag eller bokföringsdata i systemet

**Åtgärd:** Ge AUDITOR `expense:view_all` (läs, inte godkänna) samt en dedikerad ekonomivy med:
- Alla utlägg med kvitton/verifikationer
- Avgiftshistorik per lägenhet
- Utgifter per kategori och period
- Eventuellt SIE-export från ekonomisystemet

### 2. Revisorn kan inte se styrelseprotokoll

- Ingen `meeting:view` eller `meeting:protocol`
- Förvaltningsrevision kräver att revisorn läser protokollen för att bedöma om styrelsen fattat beslut på sakliga grunder
- Revisorn kan inte verifiera att beslut följts upp

**Åtgärd:** Ge AUDITOR `meeting:view` och `meeting:protocol` (läs, inte redigera).

### 3. Revisorn kan inte rösta på stämman

- `annual:vote` saknas — revisorn är ofta också medlem
- Revisorn har `AUDITOR` men inte `MEMBER` roll i testdata
- I verkligheten är den förtroendevalda revisorn nästan alltid också medlem

**Åtgärd:** Revisorn bör ha dubbla roller: `AUDITOR` + `MEMBER`. Seed-data bör uppdateras.

### 4. Ingen skillnad mellan förtroendevald och auktoriserad revisor

- Systemet har en enda `AUDITOR`-roll
- Ingen markering av om revisorn är auktoriserad/godkänd
- `BrfRules.requireAuthorizedAuditor` finns men kontrolleras inte vid rolltilldelning
- En extern auktoriserad revisor behöver kanske inte fullt systemkonto — snarare exportfunktion

**Åtgärd:**
- Lägg till fält `isAuthorized` på UserRole eller separat modell
- Alternativt: två roller `AUDITOR_ELECTED` (förtroendevald) och `AUDITOR_AUTHORIZED` (auktoriserad)
- Om auktoriserad: stöd för export av revisionsunderlag (PDF/SIE) istället för inloggning

### 5. Ingen revisorssuppleant-hantering

- `BrfRules.maxAuditorSubstitutes` = 2 men ingen `AUDITOR_SUBSTITUTE`-roll
- Suppleanten ska kunna träda in om ordinarie revisor avgår
- Ingen mekanism för detta i systemet

**Åtgärd:** Lägg till `AUDITOR_SUBSTITUTE`-roll med samma läspermissions som AUDITOR men utan `audit:perform` (aktiveras först vid behov).

### 6. Revisionsberättelsen presenteras inte i mötessystemet

- Dagordningspunkten "Revisionsberättelse" finns men har ingen `specialType`
- Revisionsberättelsens text visas inte automatiskt i mötesadmin eller presentation
- Ordförande/sekreterare måste manuellt referera till revisionen

**Åtgärd:** Ny `specialType: "AUDIT_REPORT"` som automatiskt visar revisionsberättelsen och rekommendationen under den dagordningspunkten.

### 7. Ansvarsfrihet kopplas inte till revisionsutlåtande

- Dagordningspunkten "Fråga om ansvarsfrihet för styrelsen" finns men har ingen `specialType`
- Inget samband mellan revisorns rekommendation (APPROVE/DENY) och ansvarsfrihetsbeslut
- Om revisorn avstyrker (DENY) borde systemet flagga detta tydligt vid ansvarsfrihetspunkten

**Åtgärd:** Ny `specialType: "DISCHARGE_VOTE"` som visar revisorns rekommendation och varnar om revisorn avstyrkt.

### 8. Ingen åtkomstloggning av revisorns granskning

- Revisorn har bred läsåtkomst men systemet loggar inte vad som lästs
- GDPR kräver loggning vid åtkomst till personuppgifter
- Revisionsspåret (vad revisorn granskade och när) saknas

**Åtgärd:** Logga revisorns åtkomst till personuppgifter och ekonomisk data.

### 9. Ingen kontinuerlig granskning

- Nuvarande flöde är batch: styrelsen skickar färdig årsredovisning → revisorn granskar allt på en gång
- I verkligheten granskar revisorn löpande under verksamhetsåret
- Ingen möjlighet att lämna löpande anmärkningar eller frågor till styrelsen

**Åtgärd:** Komplettera med möjlighet för revisorn att ställa frågor och lämna observationer löpande, kopplade till specifika perioder/transaktioner.

---

## Permissions: Nuläge vs föreslagen

### Nuvarande (8 permissions)

```
annual:view, annual_report:view,
audit:perform, audit:view,
document:view_board,
announcement:view,
member:view_registry
```

### Föreslagna tillägg

```
// Ekonomisk granskning
expense:view_all              // Se alla utlägg och attestflöden (LÄS)

// Mötesprotokoll
meeting:view                  // Se möten och dagordning (LÄS)
meeting:protocol              // Läsa protokoll (LÄS, ej redigera — behöver finare kontroll)

// Stämmodeltagande (som medlem)
annual:vote                   // Rösta på stämma (om också MEMBER)
```

### Finare behörighetskontroll behövs

Nuvarande system har binära permissions — du har `meeting:protocol` eller inte. Revisorn behöver **läsa** protokoll men inte **redigera** dem. Detta kräver antingen:
1. Uppdelad permission: `meeting:protocol:read` vs `meeting:protocol:write`
2. Eller: ge `meeting:protocol` men kontrollera rollen vid skrivning (befintligt mönster med `canEdit`)

Alternativ 2 fungerar redan — protokolltabben visar bara edit-UI om `canEdit` (som kräver `meeting:edit`). Så att ge revisorn `meeting:protocol` utan `meeting:edit` ger läsåtkomst automatiskt.

---

## Jämförelse med andra roller

| Aspekt | Förtroendevald revisor | Auktoriserad revisor | Styrelsemedlem | Valberedare |
|--------|:---------------------:|:--------------------:|:--------------:|:-----------:|
| Vald av stämman | JA | Nej (upphandlad) | JA | JA |
| Oberoende krav | JA (starkt) | JA (lagstadgat) | NEJ | JA |
| Del av styrelsen | NEJ | NEJ | JA | NEJ |
| Konto i systemet | JA | Kanske (export) | JA | JA |
| Se ekonomi | JA (bör ha) | JA (externt) | JA | NEJ |
| Se protokoll | JA (bör ha) | JA (externt) | JA | NEJ |
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

| Prio | Funktion | Varför |
|------|----------|--------|
| 1 | **Ge revisor ekonomi-läsåtkomst** | Kan inte revidera utan att se ekonomin |
| 2 | **Ge revisor protokoll-läsåtkomst** | Förvaltningsrevision kräver protokollgranskning |
| 3 | **specialType för revisionsberättelse** | Visa revisionen automatiskt vid stämman |
| 4 | **specialType för ansvarsfrihet** | Koppla revisorns rekommendation till ansvarsfrihetsbeslut |
| 5 | **Revisorssuppleant-roll** | `AUDITOR_SUBSTITUTE` med läspermissions |
| 6 | **Skilja förtroendevald/auktoriserad** | Olika flöden: inloggning vs export |
| 7 | **Löpande granskning** | Möjlighet att ställa frågor under verksamhetsåret |
| 8 | **Revisionsunderlag-export** | PDF/SIE-export för extern revisor |
| 9 | **Åtkomstloggning** | GDPR-krav vid revisorns läsåtkomst |
