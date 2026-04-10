# BRF-system: Lagrum, GDPR och regulatorisk analys 2026

---

## Del I — Juridiska pelare

### 1. Grundlagarna för BRF-verksamhet

| Lag | SFS | Kärninnehåll | Systemrelevans |
|-----|-----|-------------|----------------|
| **Bostadsrättslagen** | 1991:614 | Medlemskap, överlåtelse, pant, andrahand, renoveringsansvar, medlemsförteckning | Medlemsregister, ägarskap, avgiftshantering |
| **Lag om ekonomiska föreningar** | 2018:672 | Styrelsens sammansättning, stämma, protokoll, revision, firmateckning, juridiskt ansvar | Möten, beslut, roller, signering |
| **Bokföringslagen** | 1999:1078 | Arkiveringskrav (7 år), verifikationer, räkenskapsår | Utlägg, årsredovisning, gallring |
| **Årsredovisningslagen** | 1995:1554 | Krav på årsredovisning, förvaltningsberättelse | Årsbokslut, K3-rapportering |
| **GDPR** | EU 2016/679 | All personuppgiftsbehandling | Medlemsregister, samtycke, radering |
| **Dataskyddslagen** | 2018:218 | Svensk GDPR-komplettering, personnummerskydd | Personnummerhantering |
| **Jordabalken 12 kap (Hyreslagen)** | 1970:994 | Kommersiella lokaler, hyresrätter i föreningen | Andrahandsuthyrning |
| **Miljöbalken** | 1998:808 | Egenkontroll: radon, legionella, ventilation (OVK) | Fastighetsförvaltning |
| **Skattelagstiftning** | Diverse | Kontrolluppgifter, momsplikt, F-skatt | Ekonomisk rapportering |

### 2. Föreningens stadgar

Stadgarna fungerar som föreningens **lokala lag** och har företräde framför systemets standardkonfiguration i Hemmet (via `BrfRules`-modellen). Det är kritiskt att stadgarna är uppdaterade för att spegla lagändringarna 2023-2024, särskilt kring:
- Medlemmars renoveringsansvar (ny lydelse)
- Andrahandsuthyrning (skärpta regler)
- Digitala stämmor (möjliggjort under pandemin, permanent sedan 2024)

---

## Del II — Nya regulatoriska krav 2026

### 3. K3-obligatorium (fr.o.m. räkenskapsåret 2026)

**Bakgrund:** Alla BRF:er måste redovisa enligt K3-regelverket. K2 fasas ut.

**Konsekvenser för systemet:**

| Krav | Nuläge i Hemmet | Åtgärd |
|------|-----------------|--------|
| Komponentavskrivningar | Ej stött — ingen komponentmodell | Utöka Building/Apartment med komponentregister (tak, fönster, stammar, hiss etc.) |
| Underhållsplan kopplad till komponenter | `BrfRules.maintenancePlanRequired/Years` finns men ingen datamodell | Skapa underhållsplanmodell med koppling till komponentregister |
| Avskrivningsberäkning per komponent | Saknas helt | Implementera avskrivningslogik (linjär/progressiv per komponent) |
| Årsredovisning enligt K3-format | `AnnualReport`-modell finns men utan K3-struktur | Utöka med K3-specifika fält: komponentnot, avskrivningstabell |

**Risknivå:** HÖG — K3-övergången kräver ny datamodell och kan påverka kassörens och revisorns arbetsflöde väsentligt.

### 4. EPBD — EU:s energiprestandakrav (senast maj 2026)

**Bakgrund:** Energy Performance of Buildings Directive ställer krav på energiprestanda och långsiktiga energiplaner.

**Konsekvenser för systemet:**

| Krav | Nuläge i Hemmet | Åtgärd |
|------|-----------------|--------|
| Energideklaration (giltig 10 år) | Inget stöd | Lägg till energideklarationsdata på Building-modellen |
| Energiklass per byggnad | Saknas | Fält för energiklass (A-G) och certifikatdatum |
| Långsiktig energiplan | Saknas | Koppling till underhållsplan med energiåtgärder |
| Rapportering av energiförbrukning | Saknas | Integrationspunkt för energidata (el, fjärrvärme, vatten) |

**Risknivå:** MEDEL — krav som rullar ut stegvis, men grunddata bör finnas i systemet.

### 5. Digital inlämning till Bolagsverket

**Bakgrund:** Årsredovisningar ska lämnas in digitalt senast 7 månader efter bokslut.

**Konsekvenser för systemet:**

| Krav | Nuläge i Hemmet | Åtgärd |
|------|-----------------|--------|
| iXBRL-format för årsredovisning | Ej stött | Integrationspunkt eller exportfunktion till iXBRL |
| Digital signering | Ej stött | Stöd för BankID-signering eller liknande |
| Automatisk deadline-påminnelse | `protocolDeadlineWeeks` finns men inte för Bolagsverket | Lägg till deadline-tracking för årsredovisning |

**Risknivå:** HÖG — direkt lagkrav med tidsfrister och sanktioner.

### 6. Momsplikt på parkering (oktober 2026)

**Bakgrund:** Parkering som hyrs ut separat (ej ingår i bostadsrätten) blir momspliktigt.

**Konsekvenser för systemet:**

| Krav | Nuläge i Hemmet | Åtgärd |
|------|-----------------|--------|
| Separera parkeringsavgifter | Ingen avgiftsmodell utöver `monthlyFee` | Utöka med separat parkeringsavtal/avgift |
| Momssats per avgiftstyp | Saknas | Lägg till momskonfiguration |
| Momsredovisning | Saknas | Integrationspunkt för momsdeklaration |

**Risknivå:** MEDEL — berör bara föreningar med separata parkeringsavtal.

---

## Del III — GDPR-analys

### 7. Den grundläggande konflikten

Bostadsrättslagen kräver transparens (offentlig medlemsförteckning). GDPR kräver dataminimering och skydd. Dessa står i direkt konflikt och systemet måste navigera båda simultant.

### 8. Medlemsförteckning vs GDPR

#### Lagkrav (BrfL 9 kap. 8-9 §§)

Medlemsförteckningen är en **offentlig handling**. Föreningen är skyldig att på begäran visa den. Den ska innehålla:
- Namn
- Postadress
- Vilken lägenhet medlemmen innehar

#### Vad som INTE ingår i den offentliga förteckningen

Följande uppgifter kräver **samtycke eller starkt berättigat intresse**:
- Personnummer
- E-postadress
- Telefonnummer
- Folkbokföringsadress (om den skiljer sig från lägenhetsadress)

#### Nuvarande status i Hemmet

**KRITISK BRIST:** `member.list` returnerar ALLA fält till alla med `member:view_registry`, inklusive e-post och telefon. Ingen fältnivåfiltrering baserad på roll.

**Åtgärd:** Implementera fältnivå-åtkomstkontroll:

| Datatyp | Medlemmar | Styrelse | Teknisk förvaltare | Ekonomisk förvaltare |
|---------|:---------:|:--------:|:------------------:|:-------------------:|
| Namn + lägenhet | JA (lagkrav) | JA | JA | JA |
| E-post / telefon | NEJ (kräver opt-in) | JA | JA (för avisering) | JA |
| Personnummer | STRIKT NEJ | JA (maskerat, fullständigt för kassör/ordförande) | NEJ | JA (för pant/avisering) |
| Folkbokföringsadress | NEJ | JA | NEJ | JA |

### 9. Personnummer — extra skyddsvärda

Personnummer har särskilt skydd enligt **Dataskyddslagen (2018:218) 3 kap. 10 §** utöver GDPR.

#### Nuvarande exponering i Hemmet

| Plats i koden | Exponering | Allvarlighet |
|---------------|-----------|:------------:|
| `MembershipApplication.personalId` | Klartext i DB, visas i ansöknings-UI för styrelse | KRITISK |
| `OrganizationRepresentative.personalId` | Klartext i DB och UI (`Personnr: {rep.personalId}`) | KRITISK |
| `MeetingProxy.externalPersonalId` | Klartext i DB och proxy-flik UI | KRITISK |
| `User`-modellen | Personnummer saknas helt — bra, men behövs vid medlemsprövning | OK |

#### Åtgärder

1. **Aldrig visa fullständigt personnummer i UI** — visa maskerat: `XXXXXX-XXXX` eller sista 4: `****-1234`
2. **Kryptera personnummer i databasen** — AES-256 med nyckelrotation
3. **Begränsa åtkomst** — bara ordförande och kassör bör kunna se fullständigt personnummer
4. **Logga all åtkomst** till personnummerdata

### 10. Externa utförare och Personuppgiftsbiträdesavtal (PUB)

#### Lagkrav (GDPR Art. 28)

Varje extern part som behandlar personuppgifter för föreningens räkning **måste** ha ett personuppgiftsbiträdesavtal (PUB/DPA).

#### Nuvarande status i Hemmet

- `IntegrationConfig`-modell finns i schemat med `provider`, `accessToken`, `refreshToken`
- Ingen implementerad integrationslogik
- Inget stöd för PUB-avtal i systemet
- Ingen loggning av extern åtkomst

#### Åtgärder

1. **PUB-avtalskrav vid integrationsaktivering** — systemet bör kräva att ett PUB-avtal registreras innan extern åtkomst aktiveras
2. **Loggning av extern datadelning** — varje API-anrop från externa system loggas
3. **Dataminimering per integration** — konfigurera vilka fält som delas per extern part
4. **Automatisk tokenrevokering** vid avtalets upphörande

### 11. Rätten att bli bortglömd vs Arkiveringskrav

#### Konflikten

| Lagkrav | Retention | Uppgifter |
|---------|-----------|-----------|
| GDPR Art. 17 (rätt till radering) | Vid begäran | Alla personuppgifter utan annan rättslig grund |
| Bokföringslagen 7 kap. 2 § | 7 år | Ekonomiska transaktioner, verifikationer |
| Bostadsrättslagen | Så länge relevant | Köpehandlingar, pantnoteringar, överlåtelser |
| Skattelagstiftning | 10 år | Kontrolluppgifter |

#### Nuvarande status i Hemmet

**KRITISK BRIST:** Ingen raderingslogik existerar.

- Ingen endpoint för användarradering eller anonymisering
- Medlemsansökningar (med personnummer) sparas för evigt
- Avslutade ägarskap sparas med full persondata
- Ombudsregistreringar (med externa personers personnummer) sparas för evigt
- Röstlängder och närvarohistorik sparas för evigt

#### Åtgärd: Gallringsrutin

| Data | Gallringstid | Åtgärd |
|------|-------------|--------|
| Avslagna ansökningar | 6 månader | Anonymisera personnummer, radera kontaktuppgifter |
| Avslutade medlemskap | 7 år (bokföringslagen) | Behåll namn + lägenhet + ekonomisk historik, radera personnummer/telefon/e-post |
| Externa ombud | 3 månader efter mötet | Anonymisera personnummer, radera adress/telefon |
| Inaktiva användare | 12 månader utan inloggning | Notifiera, sedan anonymisera |
| Mötesprotokoll | Permanent | Behåll men anonymisera avhoppade medlemmars personnummer |
| Utlägg/verifikationer | 7 år efter räkenskapsårets slut | Behåll belopp/beskrivning, anonymisera personkoppling |

### 12. Ändamålsglidning (Purpose Creep)

#### Nuvarande riskområden i Hemmet

1. **Meddelandesystemet** (`announcement`) — kan missbrukas för massutskick utanför förvaltningssyftet
2. **CSV-export** — medlemregistret kan exporteras utan begränsning eller loggning
3. **Möteslogg** — detaljerad röstningshistorik per person kan kartlägga medlemmars ställningstaganden

#### Åtgärder

1. **Logga alla massutskick** med avsändare, mottagarlista och innehåll
2. **Begränsa CSV-export** — kräv motivering, logga export, begränsa till ordförande/kassör
3. **Anonymisera individuella röster** i historiska mötesloggar efter protokolljustering

### 13. Åtkomstloggning — saknas helt

#### GDPR Art. 30 & Art. 33

Vid dataintrång måste föreningen kunna:
- Rapportera till IMY inom 72 timmar
- Redovisa vilken data som exponerats
- Identifiera vilka registrerade som berörs

#### Nuvarande status

**KRITISK BRIST:** Ingen åtkomstloggning existerar.

- `IntegrationLog` finns i schemat men är oanvänd
- Ingen loggning av vem som tittar på personuppgifter
- Vid dataintrång kan föreningen inte uppfylla rapporteringskravet

#### Åtgärd

Implementera `PersonalDataAccessLog`:
```
- userId (vem tittade)
- action (view_registry, view_application, view_ssn, export_csv, etc.)
- targetUserId (vems data)
- timestamp
- ipAddress
- fieldsAccessed (vilka fält)
```

### 14. Samtyckehantering

**BRIST:** Inget samtyckeshanteringssystem finns.

1. **Samtyckesmodell:** Lägg till `UserConsent` med `type`, `grantedAt`, `revokedAt`
2. **Opt-in för kontaktdelning:** Medlemmar väljer aktivt om andra medlemmar får se e-post/telefon
3. **Privacy notice vid ansökan:** Visa dataskyddsinformation vid medlemsansökan
4. **Rätt att återkalla samtycke:** Enkel knapp i inställningar

---

## Del IV — Teknisk säkerhet

### 15. Nuvarande exponeringar

| Brist | Detalj | GDPR-artikel |
|-------|--------|:------------:|
| Personnummer i klartext i DB | Ingen kryptering vid vila | Art. 32 |
| Lösenordshash (bcrypt) | Korrekt implementerat | Art. 32 OK |
| JWT-token innehåller roller | Roller exponerade i klient | Art. 25 |
| Ingen rate limiting på login | Brute force-risk | Art. 32 |
| IntegrationConfig tokens i klartext | OAuth-tokens okrypterade | Art. 32 |
| Ingen HTTPS-enforcement synlig | Beroende av deployment | Art. 32 |
| CSV-export utan begränsning | Bulkdata kan laddas ner | Art. 25 |
| `member.list` returnerar `passwordHash` | Ingen `.select()` begränsning | Art. 32 |

---

## Del V — Roller och deras legitima dataaccessbehov

### Styrelsemedlem (generellt)
- **Behov:** Namn, lägenhet, roll, kontaktuppgifter för styrelsearbete
- **Laglig grund:** Berättigat intresse (Art. 6.1f) + rättslig förpliktelse (BrfL)
- **Begränsning:** Personnummer bara vid specifikt behov

### Ordförande
- **Extra behov:** Firmateckning, medlemsprövning med personnummer
- **Laglig grund:** Rättslig förpliktelse + avtal
- **Begränsning:** Fullständigt personnummer bara vid signering/prövning

### Kassör
- **Extra behov:** Personnummer för pant/överlåtelse, bankuppgifter
- **Laglig grund:** Rättslig förpliktelse (bokföringslagen)
- **Begränsning:** Personnummer bara vid ekonomiska transaktioner

### Revisor
- **Extra behov:** Alla ekonomiska handlingar
- **Laglig grund:** Rättslig förpliktelse (revisionsplikt)
- **Begränsning:** Personnummer bör inte behövas

### Medlem
- **Behov:** Namn och lägenhet (lagkrav BrfL 9:8)
- **Laglig grund:** Bostadsrättslagen
- **Begränsning:** E-post/telefon kräver samtycke

### Extern förvaltare
- **Behov:** Kontaktuppgifter för avisering/felanmälan
- **Laglig grund:** Berättigat intresse + PUB-avtal
- **Begränsning:** Aldrig personnummer

---

## Del VI — Prioriterad checklista

### Omedelbart (före produktion)

- [ ] Fältnivå-åtkomstkontroll på `member.list` — filtrera bort telefon/e-post/passwordHash för icke-styrelse
- [ ] Maskera personnummer i all UI — visa aldrig fullständigt utan explicit åtgärd
- [ ] Privacy notice vid medlemsansökan
- [ ] Åtkomstloggning för personuppgifter
- [ ] Logga CSV-exporter

### Hög prioritet (inom 3 månader)

- [ ] Kryptera personnummer i databasen (AES-256 med nyckelrotation)
- [ ] Gallringsrutin för avslagna ansökningar och avslutade medlemskap
- [ ] Samtyckehantering (opt-in för kontaktdelning)
- [ ] Begränsa CSV-export till ordförande/kassör
- [ ] Rate limiting på login och ansökningsendpoints
- [ ] PUB-avtalskrav vid integrationsaktivering

### Medium prioritet (inom 6 månader)

- [ ] Anonymisering av individuella röster i historiska mötesloggar
- [ ] Registerförteckning (ROPA)
- [ ] Incidenthanteringsplan med kontaktuppgifter till IMY
- [ ] Automatisk gallring baserad på konfigurerbara tidsintervall
- [ ] Grundläggande K3-stöd (komponentregister, avskrivningsberäkning)
- [ ] Energideklarationsdata på Building-modellen

### Långsiktigt (inom 12 månader)

- [ ] iXBRL-export för digital inlämning till Bolagsverket
- [ ] BankID-integration för digital signering
- [ ] Underhållsplanmodell kopplad till komponentregister
- [ ] Momshantering för parkeringsavtal
- [ ] Energidata-integration (el, fjärrvärme, vatten)
- [ ] Dataskyddsombud (DPO) — utvärdera behov

---

## Del VII — Fullständig lagrumslista

| Lag | SFS | Relevans för BRF-system |
|-----|-----|------------------------|
| Bostadsrättslagen | 1991:614 | Medlemskap, förteckning, överlåtelse, pant, andrahand, renoveringsansvar |
| Lag om ekonomiska föreningar | 2018:672 | Styrelse, stämma, protokoll, revision, firmateckning |
| GDPR | EU 2016/679 | All personuppgiftsbehandling |
| Dataskyddslagen | 2018:218 | Personnummerskydd, svensk GDPR-komplettering |
| Bokföringslagen | 1999:1078 | Räkenskaper, verifikationer, 7 års arkivering |
| Årsredovisningslagen | 1995:1554 | Årsredovisning, K3-format |
| BFNAR 2012:1 (K3) | N/A | Redovisningsregler, komponentavskrivning (obligatoriskt 2026) |
| Jordabalken 12 kap | 1970:994 | Hyresrätter, kommersiella lokaler |
| Miljöbalken | 1998:808 | Egenkontroll: radon, legionella, OVK |
| Plan- och bygglagen | 2010:900 | Bygganmälan, OVK-krav |
| Lagen om energideklaration | 2006:985 | Energiprestanda, EPBD-implementation |
| EPBD (EU-direktiv) | EU 2024/1275 | Energikrav på byggnader (svensk lag senast maj 2026) |
| Skatteförfarandelagen | 2011:1244 | Kontrolluppgifter, momsredovisning |
| Mervärdesskattelagen | 2023:200 | Momsplikt på parkering (oktober 2026) |
| Lagen om distansavtal | 2005:59 | Digitala tjänster, e-handel (vid avgiftsbetalning online) |
| Kameraövervakningslagen | 2018:1200 | Om föreningen har kameraövervakning |
| Lag om elektronisk kommunikation | 2022:482 | Bredband, fiberanslutning i föreningen |
