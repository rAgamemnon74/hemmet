# Analys: Styrelseledamoten (BOARD_MEMBER) i Hemmet

## Rollens natur

Styrelseledamoten är en **grundläggande styrelseroll** utan specialansvar. Det är en fullvärdig röstberättigad medlem av styrelsen som deltar i alla beslut men som inte har delegerat ansvar för ett specifikt område (ekonomi, fastighet, protokoll etc.).

I verkligheten är detta ofta:
- Nyvalda styrelsemedlemmar som ännu inte fått ett specifikt ansvar
- Ledamöter i större styrelser där specialrollerna redan är besatta
- Erfarna ledamöter som medvetet valt att inte ha ett portfoljansvar

---

## Vad ledamoten kan idag

### Permissions (BOARD_COMMON — 25 st)

Ledamoten har exakt samma permissions som miljöansvarig och aktivitetsansvarig — alla tre har `BOARD_COMMON` utan tillägg.

### Konkret i systemet

**Möten:**
- Visa och delta i styrelsemöten
- Rösta på dagordningspunkter
- Skriva/redigera protokoll (delar `meeting:protocol` med alla styrelseroller)
- Checka in sig själv via QR-kod

**Ärenden och beslut:**
- Skapa och tilldela uppgifter
- Se alla beslut
- Se alla utlägg (men inte godkänna)
- Redigera årsredovisning

**Medlemshantering:**
- Se medlemsregistret med kontaktuppgifter
- Svara på motioner (styrelsens yttrande)
- Svara på boendeförslag
- Skapa meddelanden

**Dokument:**
- Ladda upp och se styrelsedokument

### Vad ledamoten INTE kan

| Förmåga | Vem kan | Varför ledamoten inte kan |
|---------|---------|--------------------------|
| Skapa möten | Ordförande, sekreterare | Mötesinitiativ = ordförandens ansvar |
| Tilldela mötesroller | Ordförande, sekreterare | Organisatoriskt ansvar |
| Godkänna utlägg | Ordförande, kassör | Attesträtt kräver firmateckningsansvar |
| Hantera felanmälningar | Fastighetsansvarig | Delegerat driftansvar |
| Granska ansökningar | Ordförande | Medlemsprövning = ordförandens delegation |
| Hantera överlåtelser | Ordförande, kassör | Ekonomi + prövning |
| Ändra medlemsdata | Ordförande | Registeransvar |
| Systemadministration | Admin | Teknisk förvaltare |

---

## Ledamotens roll i verkligheten

### Grundansvar enligt LEF

Alla styrelseledamöter — oavsett titel — delar **solidariskt ansvar** för förvaltningen (LEF 8 kap. 4 §). Det innebär:

1. **Deltar i alla styrelsebeslut** — har rösträtt och ansvar för besluten
2. **Informationsplikt** — ska hålla sig informerad om föreningens angelägenheter
3. **Lojalitetsplikt** — agera i föreningens intresse, inte eget
4. **Aktsamhetsplikt** — fatta beslut på saklig grund med tillgänglig information
5. **Personligt ansvar** — kan hållas personligt skadeståndsskyldig vid vårdslöshet

### Typiska uppgifter i praktiken

| Uppgift | Frekvens | Systemstöd idag |
|---------|----------|:---------------:|
| Delta i styrelsemöten | 6-12/år | OK — möten, dagordning, röstning |
| Läsa och godkänna protokoll | Efter varje möte | OK — protokollvy |
| Följa upp tilldelade uppgifter | Löpande | OK — task-systemet |
| Läsa in sig på ärenden inför möte | Före varje möte | Delvis — ingen samlad "inför mötet"-vy |
| Bevaka sitt ansvarsområde (om tilldelat) | Löpande | Beror på område |
| Representera styrelsen vid behov | Vid behov | Inget stöd |
| Anmäla jäv | Vid varje berört beslut | **Saknas** |
| Reagera på allvarliga felanmälningar | Vid behov | OK — kan se felanmälningar |

---

## Skillnad: Ledamot vs Suppleant

| Aspekt | Ledamot (BOARD_MEMBER) | Suppleant (BOARD_SUBSTITUTE) |
|--------|:----------------------:|:----------------------------:|
| Rösträtt i styrelsen | Ja, alltid | Bara vid inträde för frånvarande ledamot |
| Permissions | BOARD_COMMON (25 st) | Begränsad (12 st) |
| Kan skapa uppgifter | Ja | Nej |
| Kan svara på motioner | Ja | Nej |
| Kan redigera årsredovisning | Ja | Nej |
| Kan skapa meddelanden | Ja | Nej |
| Kan ladda upp dokument | Ja | Nej |
| Personligt ansvar | Ja, alltid | Ja, vid inträde |

---

## Skillnad: Ledamot vs Specialiserade roller

Ledamoten har samma basaccess som alla styrelsemedlemmar. Skillnaden är att specialiserade roller har **tillagda permissions** för sina ansvarsområden:

```
BOARD_MEMBER     = BOARD_COMMON
BOARD_ENVIRONMENT = BOARD_COMMON (identisk — ingen specialisering idag)
BOARD_EVENTS     = BOARD_COMMON (identisk — ingen specialisering idag)

BOARD_SECRETARY  = BOARD_COMMON + meeting:create, meeting:assign_roles
BOARD_TREASURER  = BOARD_COMMON + expense:approve, transfer:create/manage_financial/view
BOARD_PROPERTY_MGR = BOARD_COMMON + report:manage
BOARD_CHAIRPERSON = BOARD_COMMON + 11 extra permissions
```

**Noterbart:** Miljöansvarig och aktivitetsansvarig har idag **exakt samma** permissions som en vanlig ledamot. De är i praktiken ledamöter med en titel men utan systemstöd.

---

## Kritiska brister

### 1. Ingen samlad "inför mötet"-vy

Ledamoten ska komma förberedd till styrelsemöten. Idag måste de manuellt navigera:
- Se dagordningen
- Läsa föregående protokoll
- Kolla öppna ärenden/uppgifter
- Läsa inkomna motioner och förslag
- Se felanmälningar

**Åtgärd:** En "Förbered inför möte"-vy som samlar allt relevant material för kommande möte.

### 2. Ingen jävsdeklaration

Se `docs/JAV_PRAKTISK_ANALYS.md`. Ledamoten ska kunna deklarera jäv per beslut. Saknas helt.

### 3. Ingen notifiering

Ledamoten får inga notifieringar om:
- Nytt möte inbokat
- Ny uppgift tilldelad
- Motion inkommen som kräver styrelsens svar
- Felanmälan med hög allvarlighet
- Överlåtelseärende som väntar på beslut

`Notification`-modellen finns i schemat men är oanvänd.

### 4. Inget stöd för ad hoc-uppdrag

Ordförande kan muntligt ge en ledamot ett uppdrag ("kan du kontakta leverantören om offert?"). Det finns inget sätt att formellt delegera en specifik uppgift med deadline och uppföljning utöver det generella task-systemet.

### 5. Ingen insyn i vad som händer mellan möten

Mellan möten kan det hända mycket — nya felanmälningar, godkända utlägg, inkomna ansökningar. Ledamoten har ingen "sedan sist"-vy som sammanfattar vad som hänt sedan förra mötet.

### 6. Protokoll-behörighet bör ifrågasättas

Alla styrelseledamöter har `meeting:protocol` — dvs alla kan redigera protokollet. I verkligheten är det sekreterarens ansvar. Att alla kan redigera skapar risk för oavsiktliga ändringar.

**Fråga:** Bör `meeting:protocol` tas bort från BOARD_COMMON och bara ges till BOARD_SECRETARY (och ordförande)?

---

## Stödbehov från systemet

### Vad systemet bör ge en ledamot

| Behov | Beskrivning | Prioritet | Status |
|-------|-------------|:---------:|:------:|
| **Mötesförberedelse** | Samlad vy med dagordning, öppna ärenden, underlag inför nästa möte | HÖG | Saknas |
| **"Sedan sist"** | Sammanfattning av händelser sedan förra styrelsemötet | HÖG | Saknas |
| **Notifieringar** | Push/e-post vid nya uppgifter, möten, ärenden | HÖG | Modell finns, logik saknas |
| **Jävsdeklaration** | Checkbox + motivering per beslut | HÖG | Saknas |
| **Min sida (styrelsevy)** | Mina uppgifter, mina tilldelade ärenden, min närvarohistorik | MEDEL | Min sida finns, styrelsevy saknas |
| **Delegerade uppdrag** | Formell tilldelning av engångsuppdrag från ordförande | MEDEL | Task-system fungerar |
| **Dokumentsamling** | Enkelt hitta relevanta dokument (stadgar, policys, avtal) | MEDEL | Dokumenthantering finns |
| **Beslutshistorik** | Söka bland gamla beslut per ämne | LÅG | Beslutslogg finns |

### Vad systemet INTE behöver ge en ledamot

- Administrativ kontroll (det är ordförande/sekreterare/kassörs ansvar)
- Direkt kontakt med externa parter (det sker utanför systemet)
- Ekonomisk attest (kassörens ansvar)
- Fastighetsförvaltning (fastighetsansvarigs ansvar)

---

## Prioriterad åtgärdslista

| Prio | Funktion | Varför |
|------|----------|--------|
| 1 | **"Inför mötet"-vy** | Ledamotens viktigaste förberedelse — samla dagordning, underlag, öppna ärenden |
| 2 | **"Sedan sist"-sammanfattning** | Hålla sig informerad mellan möten (informationsplikt) |
| 3 | **Jävsdeklaration** | Juridiskt krav, personligt ansvar |
| 4 | **Notifieringar** | Reagera i tid på nya ärenden |
| 5 | **Utvärdera meeting:protocol** | Bör kanske begränsas till sekreterare |
| 6 | **Testanvändare** | Lägg till `ledamot@hemmet.se` i seed-data |
