# Analys: Fastighetsansvarigrollen i Hemmet

## Vad som fungerar idag

### Permissions

BOARD_PROPERTY_MGR har BOARD_COMMON (24 permissions) plus:
- `report:manage` — enda rollspecifika permissionen (hanterar felanmälningsstatus och resolution)

Delar `report:manage` med BOARD_CHAIRPERSON och ADMIN.

### Felanmälningshantering (enda specialiserade funktionen)

Fullt flöde implementerat:
- **SUBMITTED** -> **ACKNOWLEDGED** -> **IN_PROGRESS** -> **RESOLVED** -> **CLOSED**
- Kan ändra status, lägga till resolution-text, kommentera (publikt och internt)
- Interna kommentarer (dolda för boende) stöds
- Allvarlighetsnivåer: LOW, NORMAL, HIGH, CRITICAL
- Platskategorier: Trapphus, Tvättstuga, Cykelrum, Källare, Garage, Innergård, Tak, Fasad, Hiss, Entré, Soprum, Övrigt
- Koppling till lägenhet (valfritt — gemensamma utrymmen har `apartmentId: null`)

### Möteskontext

- Deltar i möten med `meeting:view`/`meeting:vote`
- Dagordningsmallen har "Fastighetsförvaltning" (15 min) — "Pågående och planerade underhållsåtgärder, felanmälningar"
- Kan inte skapa möten eller tilldela mötesroller

### Övriga förmågor

- Kan skapa och tilldela uppgifter (`task:create`, `task:assign`)
- Kan svara på boendeförslag (`suggestion:respond`)
- Kan ladda upp dokument (`document:upload`)
- Kan svara på motioner (`motion:respond`)
- Kan redigera årsredovisning (`annual_report:edit`)

## Kritiska brister

### 1. Underhållsplan — saknas helt (K3-krav 2026)

- `BrfRules.maintenancePlanRequired` = true, `maintenancePlanYears` = 30 — men **ingen datamodell**
- Ingen komponentregister (tak, stammar, fönster, hiss, fasad etc.)
- Ingen statusbedömning per komponent
- Ingen koppling till avskrivningsberäkning (K3-obligatorium)
- Ingen koppling till budget/avsättning
- Ingen möjlighet att planera eller prioritera underhållsåtgärder

**Detta är den mest kritiska bristen** — K3 kräver komponentavskrivning från räkenskapsåret 2026, vilket förutsätter att systemet kan spåra fastighetens komponenter med livslängd, skick och planerad åtgärd.

### 2. Besiktningskalender — saknas helt

Lagstadgade besiktningar som fastighetsansvarig måste bevaka:

| Besiktning | Lagkrav | Intervall | Status i Hemmet |
|-----------|---------|-----------|:---------------:|
| OVK (ventilation) | PBL + BFS | 3-6 år beroende på typ | Saknas |
| Hissbesiktning | AFS 2003:6 | Årlig | Saknas |
| Brandskydd (SBA) | LSO 2003:778 | Löpande egenkontroll | Saknas |
| Energideklaration | Lag 2006:985 | 10 år | `Building.energyDeclarationExpiry` finns men oanvänd |
| Radonmätning | Miljöbalken | Vid behov / egenkontroll | Saknas |
| Lekplatsbesiktning | SS-EN 1176 | Årlig | Saknas |
| Cisternkontroll | NFS 2021:10 | 6/12 år | Saknas |

`Building`-modellen har `energyRating` och `energyDeclarationExpiry` men ingen logik använder dem. Inga påminnelser, inga automatiska varningar.

### 3. Entreprenad- och leverantörshantering — saknas helt

- Inget leverantörsregister
- Inga avtal med kontraktstid och uppsägningstid
- Ingen offertförfrågan eller offertjämförelse
- Ingen koppling mellan felanmälan och entreprenör
- Ingen uppföljning av utfört arbete
- Inget stöd för garantibevakning

### 4. Felanmälningen saknar djup

Grundflödet fungerar men saknar:
- **Kostnadsuppskattning** — inget fält för beräknad reparationskostnad
- **Entreprenörstilldelning** — kan inte tilldela felanmälan till extern utförare
- **SLA/svarstider** — ingen bevakning av hur lång tid det tar att hantera ärenden
- **Koppling till underhållsplan** — en felanmälan om läckande tak borde trigga granskning av takkomponenten
- **Fotodokumentation** — `Document`-koppling finns men inget dedikerat foto-UI
- **Ärendehistorik per lägenhet** — ingen vy som visar alla ärenden för en specifik lägenhet
- **Prioriterad kö** — ingen vy sorterad efter allvarlighet och ålder
- **Automatisk eskalering** — inga varningar om ärenden som legat länge utan åtgärd

### 5. Byggnadsadministration — utestängd

- Fastighetsansvarig kan INTE redigera byggnadsdata (`admin:settings` krävs)
- Kan inte uppdatera `Building`-information (konstruktionsår, uppvärmning, energiklass)
- Kan inte hantera `Apartment`-data (area, rum, förråd, parkering)
- Kan inte ens SE föreningens inställningar (`admin:integrations` saknas)

### 6. Ingen fastighets-dashboard

- Ingen samlad vy: öppna felanmälningar, kommande besiktningar, underhållsstatus
- Felanmälningar blandat i "Boende"-sektionen i navigationen (inte i "Styrelse")
- Ingen överblick av fastighetens skick
- Ingen koppling till ekonomisk uppföljning av fastighetsutgifter

### 7. IoT och energidata — saknas helt

- Ingen integration med värmesystem, energimätare, vattenläckagevakter
- Ingen energiförbrukningsdata (EPBD-krav 2026)
- Ingen automatiserad övervakning eller larm
- `Building.heatingType` finns som textfält men är oanvänt

### 8. Uppgifter saknar koppling till felanmälningar

- `Task`-modellen kan kopplas till `Decision` men inte till `DamageReport`
- Fastighetsansvarig kan inte skapa en uppgift direkt från en felanmälan
- Ingen automatisk uppgiftsgenerering vid statusändring

## Jämförelse: Fastighetsansvarig vs andra roller

| Förmåga | Fastighetsansvarig | Ordförande | Kassör | Sekreterare |
|---------|:-:|:-:|:-:|:-:|
| Hantera felanmälningar | Y | Y | - | - |
| Skapa möten | - | Y | - | Y |
| Godkänna utlägg | - | Y | Y | - |
| Ändra byggnadsdata | - | - (ADMIN) | - | - |
| Underhållsplan | - | - | - | - |
| Besiktningskalender | - | - | - | - |
| Entreprenörshantering | - | - | - | - |
| Energiuppföljning | - | - | - | - |

## Vad borde finnas: Datamodell

### Komponentregister (K3-krav)

```
BuildingComponent {
  id
  buildingId          // Koppling till byggnad
  category            // Tak, Stammar, Fönster, Fasad, Hiss, El, VVS, Ventilation, etc.
  name                // "Yttertak - Hus A"
  installYear         // Installationsår
  expectedLifespan    // Förväntad livslängd i år
  condition           // GOOD, FAIR, POOR, CRITICAL
  lastInspectedAt     // Senaste besiktning
  nextActionYear      // Planerat åtgärdsår
  estimatedCost       // Beräknad åtgärdskostnad
  notes
  
  inspections[]       // Besiktningshistorik
  maintenanceActions[] // Utförda åtgärder
}
```

### Besiktning

```
Inspection {
  id
  buildingId
  componentId?        // Valfri koppling till komponent
  type                // OVK, HISS, BRAND, ENERGI, RADON, LEKPLATS, CISTERN
  scheduledAt
  completedAt
  result              // APPROVED, APPROVED_WITH_REMARKS, FAILED
  inspector           // Namn/företag
  certificateUrl      // Besiktningsprotokoll
  nextDueAt           // Nästa besiktningsdatum
  remarks
}
```

### Entreprenör/Leverantör

```
Contractor {
  id
  name
  orgNumber
  contactPerson
  phone
  email
  category            // PLUMBER, ELECTRICIAN, LOCKSMITH, PAINTER, etc.
  contractStartDate
  contractEndDate
  contractUrl         // Avtalsdokument
  rating              // Intern bedömning
  notes
}
```

## Prioriterad åtgärdslista

| Prio | Funktion | Varför |
|------|----------|--------|
| 1 | **Komponentregister + underhållsplan** | K3-krav 2026, absolut nödvändigt |
| 2 | **Besiktningskalender med påminnelser** | Lagstadgade besiktningar (OVK, hiss, brand) |
| 3 | **Fastighets-dashboard** | Samlad vy: öppna felanmälningar, kommande besiktningar, underhållsstatus |
| 4 | **Utöka felanmälan** med kostnad, entreprenörstilldelning, SLA-bevakning |
| 5 | **Leverantörsregister** med avtal, kontaktuppgifter, avtalsbevakning |
| 6 | **Ge fastighetsansvarig byggnadspermissions** — redigera Building-data utan admin |
| 7 | **Koppling felanmälan → uppgift** — automatisk uppgiftsgenerering |
| 8 | **Energiuppföljning** — EPBD-krav, energiförbrukningsdata |
| 9 | **Ärendehistorik per lägenhet** — alla felanmälningar, renoveringar, ägarbyte |
