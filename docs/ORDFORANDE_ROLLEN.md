# Analys: Ordföranderollen i Hemmet

## Vad som fungerar idag

### Permissions (24 st)

BOARD_CHAIRPERSON har flest permissions efter ADMIN och är den enda styrelserollen med:
- `admin:users` — kan tilldela/ta bort roller (delar med ADMIN)
- `admin:integrations` — kan se inställningar
- `application:review` — kan granska medlemsansökningar
- `member:edit` — kan redigera medlemsdata
- `expense:approve` — kan godkänna utlägg (delar med BOARD_TREASURER)
- `report:manage` — kan hantera skaderapporter (delar med BOARD_PROPERTY_MGR)
- `annual:schedule` — kan schemalägga årsmöten

### Möteskontext

- **Mötesroll:** Kan väljas som mötesordförande per möte (ELECT_CHAIR-punkt)
- **Mötesadmin:** Full kontroll — starta/avsluta/låsa möte, navigera dagordning, dokumentera beslut
- **Presentationsvy:** Visas som vald ordförande i realtid
- **FINALIZING:** Bara ordförande, sekreterare och justerare kan registrera röster
- **Kallelse:** Kan publicera med varning om kallelsetider inte uppfylls, kan överrida (`skipNoticePeriodCheck`)

### Övrig styrning

- **Rollhantering:** En av två roller (med ADMIN) som kan ge/ta bort roller från användare
- **Utläggshantering:** Kan godkänna/avslå utlägg
- **Motioner:** Kan svara med styrelsens yttrande och rekommendation
- **Medlemsansökningar:** Kan granska och godkänna/avslå
- **Organisationer:** Kan skapa, redigera, hantera ombud och mandat
- **Meddelanden:** Kan skapa och hantera meddelanden
- **Årsbokslut:** Kan skapa och redigera årsredovisning

## Kritiska brister

### 1. Utslagsröst (tieBreakerChairperson) — konfigurerad men ej implementerad

- `BrfRules.tieBreakerChairperson` boolean finns i schemat och är konfigurerbar i UI
- Ingen kod kontrollerar eller tillämpar utslagsrösten vid lika röstresultat
- Borde triggas automatiskt vid beslut med metod COUNTED där ja = nej

### 2. Inställningar — ordförande utestängd

- `admin:settings` finns bara på ADMIN-rollen
- Ordförande kan inte ändra föreningens grunduppgifter (namn, org.nummer, säte)
- Ordförande kan inte ändra stadgeregler (BrfRules)
- Ordförande kan inte uppdatera firmateckningsregel
- **Bör åtgärdas:** Ordförande borde ha `admin:settings` eller en delmängd

### 3. Firmateckning — rent informativt

- `BrfSettings.signatoryRule` lagrar texten "Ordförande och kassör var för sig..."
- `BrfSettings.signatories` lagrar namnen
- Ingen logik validerar firmateckningsrätt vid godkännanden
- Inget stöd för "i förening"-krav (t.ex. två firmatecknare krävs)
- Inget signeringsspår på dokument eller beslut

### 4. Ingen ordförande-dashboard

- Ingen samlad vy över ordförandens ansvarsområden
- Ingen översikt av: väntande ansökningar, utlägg att godkänna, motioner att svara på
- Ingen påminnelse om kommande möten eller deadlines
- Ingen uppgiftslista kopplad till mötesbeslut

### 5. Mötesledning saknar verkställighet

- `meetingChairpersonId` spårar vem som leder mötet men styr inte permissions
- Alla med `meeting:edit` kan navigera dagordning, starta/stoppa möte
- Ingen skillnad mellan ordförande och sekreterare under IN_PROGRESS
- Ordförande kan inte "ge ordet" eller begränsa vem som talar/röstar

### 6. Kallelse- och dagordningshantering

- Ordförande kan publicera kallelse men systemet skickar inte ut den
- Ingen integration med e-post eller digital distribution
- Ordförande kan redigera dagordning men ingen godkännandeflöde
- `BrfRules.noticeMethodDigital` finns men är oanvänd

### 7. Beslut saknar ordförande-specifik hantering

- Alla med `meeting:edit` kan skapa beslut — ingen ordförandebekräftelse
- Inget stöd för ordförandens utslagsröst vid lika (se punkt 1)
- `voteRequestedBy` lagras men kopplas inte till ordföranden
- Inget verkställighetsflöde: beslut → uppgifter → uppföljning

### 8. Revision — begränsad åtkomst

- `audit:perform` finns bara på ADMIN
- Ordförande kan bara se revision (`audit:view`)
- Borde åtminstone kunna initiera revisionsprocess och se revisionsrapporter

## Jämförelse: Ordförande vs andra roller

| Förmåga | Ordförande | Sekreterare | Kassör | Förvaltare | Ledamot | Admin |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|
| Skapa möten | Y | Y | - | - | - | Y |
| Tilldela mötesroller | Y | Y | - | - | - | Y |
| Godkänna utlägg | Y | - | Y | - | - | Y |
| Hantera skaderapporter | Y | - | - | Y | - | Y |
| Ge/ta roller | Y | - | - | - | - | Y |
| Ändra inställningar | - | - | - | - | - | Y |
| Granska ansökningar | Y | Y | Y | Y | - | Y |
| Utslagsröst | Konfigurerad men ej implementerad |

## Prioriterad åtgärdslista

| Prio | Funktion | Varför |
|------|----------|--------|
| 1 | **Implementera utslagsröst** | Finns i stadgarna, databas redo, saknar logik |
| 2 | **Ge ordförande admin:settings** | Ordförande måste kunna ändra föreningsuppgifter |
| 3 | **Ordförande-dashboard** | Samlad vy: utlägg, ansökningar, motioner, möten |
| 4 | **Firmateckningsvalidering** | Koppla signatoryRule till godkännandeflöden |
| 5 | **Kallelseverktyg** | Skicka kallelse digitalt med dagordning |
| 6 | **Mötesledning med verkställighet** | Ordförande styr dagordning exklusivt under mötet |
| 7 | **Beslut → uppgifter-flöde** | Beslut genererar uppgifter med ansvarig och deadline |
