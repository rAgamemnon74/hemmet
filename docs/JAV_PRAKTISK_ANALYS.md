# Jäv i styrelsemöten: Praktisk analys

## Grundproblemet

En jävig ledamot **ska inte delta i beslut** (LEF 7 kap. 23 §). Men styrelsen måste vara **beslutför** (vanligtvis >50% närvarande). I en liten styrelse kan en enda jävsituation göra styrelsen beslutoför.

### Exempel: Beslutförhet vid jäv

| Styrelse | Närvarande | Jävig | Kvar | Beslutför? |
|----------|:---------:|:-----:|:----:|:----------:|
| 7 ledamöter | 5 | 1 | 4 | JA (4 > 3.5) |
| 5 ledamöter | 4 | 1 | 3 | JA (3 > 2.5) |
| 5 ledamöter | 3 | 1 | 2 | **NEJ** (2 < 2.5) |
| 3 ledamöter | 3 | 1 | 2 | **GRÄNSFALL** (2 > 1.5, men knappt) |
| 3 ledamöter | 2 | 1 | 1 | **NEJ** |

### Med flera jäviga

| Styrelse | Närvarande | Jäviga | Kvar | Beslutför? |
|----------|:---------:|:------:|:----:|:----------:|
| 7 ledamöter | 7 | 2 | 5 | JA |
| 7 ledamöter | 5 | 2 | 3 | **NEJ** (3 < 3.5) |
| 5 ledamöter | 5 | 2 | 3 | JA (3 > 2.5) |
| 5 ledamöter | 4 | 2 | 2 | **NEJ** |

---

## Hur jäv uppstår

En ledamot är jävig när hen:

| Jävsgrund | Exempel i BRF-kontext |
|-----------|----------------------|
| **Eget intresse** | Ledamot äger byggfirma som lämnar offert |
| **Nära anhörig berörs** | Make/maka/barn söker andrahandsuthyrning |
| **Part i ärende** | Ledamotens lägenhet berörs av renovering/avgiftsbeslut |
| **Lojalitetskonflikt** | Ledamot representerar extern organisation med motstridigt intresse |
| **Ekonomisk fördel** | Ledamot kan tjäna på beslutet direkt eller indirekt |

### Vanliga jävssituationer i BRF:er

1. **Upphandling** — ledamot eller anhörig äger/arbetar på leverantörsfirman
2. **Andrahandsansökan** — ledamotens egen ansökan behandlas
3. **Renoveringstillstånd** — ledamotens egen renovering behandlas
4. **Avgiftsjustering** — om den avviker per lägenhet (t.ex. individuell mätning)
5. **Arvodesbeslut** — hela styrelsen är jävig (alltid stämmobeslut)
6. **Störningsärende** — ledamoten är den som stör eller den som anmält
7. **Skadeståndsärende** — mot eller av ledamoten

---

## Systemets logik: Fyra steg

### Steg 1: Jävsdeklaration per beslut

Innan varje beslut frågar systemet: "Är någon närvarande ledamot jävig i detta ärende?"

- Varje närvarande ledamot kan deklarera jäv
- Ordförande kan uppmärksamma om jäv borde föreligga
- Jävsanledningen dokumenteras (fritext)
- Den jäviga ledamoten markeras som icke-deltagande i beslutet

### Steg 2: Beräkna beslutförhet efter jävsavräkning

```
Kvarorum = floor(antal registrerade ledamöter / 2) + 1
Tillgängliga röster = närvarande − jäviga

Om tillgängliga >= kvarorum → beslutfört → fortsätt
Om tillgängliga < kvarorum → ej beslutfört → varna
```

**OBS:** Kvarorum räknas på **totalt antal ledamöter i styrelsen**, inte bara närvarande. Stadgarna kan ha avvikande kvotregler (t.ex. 2/3 närvarande).

### Steg 3: Hantera situationen när beslutförhet bryts

Tre utvägar:

**A. Bordlägg ärendet** — vanligast
- Skjut upp till nästa möte
- Se till att fler ledamöter eller suppleanter är närvarande
- Systemet registrerar: "Ärendet bordlagt pga jäv och bristande beslutförhet"

**B. Suppleant inträder** — om suppleant finns tillgänglig
- Suppleanten ersätter den jäviga ledamoten **för just detta ärende**
- Suppleanten behöver inte ersätta för hela mötet
- Systemet loggar: "Suppleant X inträder för Y under §Z"
- Kräver att suppleanten är närvarande eller kan kallas in

**C. Hänskjut till stämma** — sista utväg
- Om hela styrelsen är jävig i frågan
- Normalt för: arvodesbeslut, ansvarsfrihet, personliga tvister
- Systemet flaggar: "Ärendet kräver stämmobeslut"

### Steg 4: Logga allt

Systemet ska logga per beslut:
- Vilka som var **närvarande** vid beslutstillfället
- Vilka som deklarerade **jäv** och anledningen
- Om **suppleant inträdde** och för vem
- Vilka som **deltog i beslutet** (= närvarande minus jäviga)
- Om ärendet **bordlades** och anledningen
- Beslutets **utgång** (bifall/avslag/bordläggning)

---

## Stadgarnas påverkan

### Konfigurerbara regler (BrfRules)

| Stadgeregel | Påverkan på jävssårbarhet | BrfRules-koppling |
|------------|--------------------------|-------------------|
| Min antal styrelsemedlemmar | Lägre = mer sårbar | `minBoardMembers` |
| Max antal suppleanter | Fler suppleanter = bättre jävsbuffert | `maxBoardSubstitutes` |
| Externa ledamöter | Extern = sällan jävig i interna frågor | `allowExternalBoardMembers` |
| Kvarumregel | Högre krav = mer sårbar | Bör läggas till i BrfRules |

### Föreslagna nya BrfRules-fält

```
BrfRules {
  quorumRule              String  @default("SIMPLE_MAJORITY")  // SIMPLE_MAJORITY, TWO_THIRDS, CUSTOM
  quorumCustomPercent     Float?                               // Om CUSTOM: t.ex. 0.75
  allowSuppleantPerItem   Boolean @default(true)               // Suppleant kan inträda per ärende
}
```

### Sårbarhetstabell per styrelsestorlek

| Styrelse | Suppleanter | Jävstolerans (vid full närvaro) | Systemvarning |
|:--------:|:-----------:|:-------------------------------:|:-------------:|
| 3 | 0 | 0 jäviga | **KRITISK** — en enda jäv blockerar |
| 3 | 1 | 1 jävig (om suppleant inträder) | HÖG |
| 5 | 0 | 1 jävig | MEDEL |
| 5 | 2 | 2 jäviga (om suppleanter inträder) | LÅG |
| 7 | 0 | 2 jäviga | LÅG |
| 7 | 3 | 3 jäviga (om suppleanter inträder) | MINIMAL |

---

## Specialfall

### Arvodesbeslut — hela styrelsen är jävig

Styrelsens arvode beslutas **alltid** av stämman (LEF 7 kap. 7 §). Styrelsen ska aldrig besluta om sina egna arvoden.

I systemet bör "Beslut om arvoden" i dagordningsmallen automatiskt flaggas som stämmoärende.

### Ordförande jävig — vem leder?

Om ordförande deklarerar jäv:
1. Vice ordförande (om sådan finns) tar över som mötesordförande för ärendet
2. Om ingen vice: styrelsen utser tillfällig ordförande bland kvarvarande icke-jäviga
3. Systemet bör logga vem som ledde under det specifika ärendet

### Revisorns jäv

Revisorn ska vara **helt oberoende** av styrelsen. Om revisorn har koppling till styrelseledamot (familj, affärsrelation) är hela revisionen potentiellt ogiltig.

Systemet bör inte hantera revisorsjäv per ärende utan som en **permanent kvalifikation** — antingen är revisorn oberoende eller inte.

---

## Förebyggande åtgärder

### 1. Jävsregister per styrelsemedlem

Varje styrelsemedlem bör kunna registrera sina potentiella jävskopplingar i förväg:

```
ConflictOfInterest {
  id
  userId                  // Styrelsemedlemmen
  type                    // BUSINESS, FAMILY, PROPERTY, OTHER
  description             // "Ägare av Bygg & Måler AB (org.nr 556xxx-xxxx)"
  relatedEntity           // Fritext: företagsnamn, person, lägenhetsnr
  registeredAt
  active                  // Fortfarande relevant?
}
```

Systemet kan då automatiskt flagga: "OBS: Ledamot X har registrerad koppling till leverantör Y som detta ärende berör."

### 2. Varning vid styrelsekonfiguration

När BrfRules konfigureras (antal ledamöter, suppleanter) bör systemet visa:

> "Med 3 ledamöter och 0 suppleanter kan ett enda jäv göra styrelsen beslutoför. Rekommendation: minst 1 suppleant."

### 3. Automatisk jävsflagga vid upphandling

Om systemet har ett leverantörsregister och jävsregister kan det automatiskt korsreferera:
- "Ledamot X har registrerad koppling till Bygg AB"
- "Bygg AB har lämnat offert i detta ärende"
- → Automatisk varning innan beslut

---

## Implementationsplan för Hemmet

| Prio | Funktion | Komplexitet |
|------|----------|:-----------:|
| 1 | **Jävsdeklaration per beslut** i mötesadmin | Låg — checkbox + fritext per deltagare |
| 2 | **Automatisk beslutförhetsberäkning** med jävsavräkning | Låg — matematik baserad på närvarolista |
| 3 | **Loggning** av jäv, deltagare och utfall per beslut | Låg — utöka Decision-modellen |
| 4 | **Varning vid bristande beslutförhet** med förslag på utväg | Medel — UI-flöde med tre alternativ |
| 5 | **Suppleant-inträde per ärende** | Medel — tillfällig rollbyte under specifik dagordningspunkt |
| 6 | **Jävsregister** per styrelsemedlem (förebyggande) | Medel — ny modell + UI |
| 7 | **Automatisk korsreferens** leverantör ↔ jävsregister | Hög — kräver leverantörsregister |
| 8 | **Sårbarhetsbedömning** vid styrelsekonfiguration | Låg — beräkning i BrfRules-UI |
