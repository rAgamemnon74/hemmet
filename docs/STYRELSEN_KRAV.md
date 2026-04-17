# Styrelseroller, ansvar och externa tjänster

## Grundprincip

Styrelsen är juridiskt ansvarig för all förvaltning men fungerar i praktiken som en **beställarorganisation**. Operativt arbete delegeras till externa leverantörer via upphandlade avtal. Systemet måste stödja både det interna styrelsearbetet och gränssnittet mot externa parter.

---

## Del I — Styrelseroller och deras ansvar

### 1. Ordförande (BOARD_CHAIRPERSON)

**Internt ansvar:**
- Leder styrelsemöten och föreningsstämmor
- Övergripande ansvar och föreningens ansikte utåt
- Firmatecknare (vanligtvis med kassör eller "i förening")
- Medlemsprövning vid överlåtelser
- Kallar till styrelsemöten
- Utslagsröst vid lika röstetal (om stadgarna medger)

**Delegerade externa tjänster:**

| Tjänst | Extern leverantör | Beskrivning |
|--------|-------------------|-------------|
| Extern ordförande | HSB, Riksbyggen, advokatbyrå | Professionell ordförande för neutralitet/expertis |
| Juridiskt stöd | Advokatbyrå, juristfirma | Tvister, bygglov, avtalsrätt, störningar |
| Medlemsprövning | Mäklare, kreditupplysning | Överlåtelseprocessen, kreditkontroll |
| Försäkringsrådgivning | Försäkringsmäklare | Fastighetsförsäkring, ansvarsförsäkring, styrelseförsäkring |

**Nuläge i Hemmet:** Se `docs/ORDFORANDE_ROLLEN.md`

**Systemintegrationsbehov:**
- Mäklarsystem (överlåtelseflöde)
- Kreditupplysning (UC/Bisnode) vid medlemsprövning
- Juridisk ärendehantering

---

### 2. Sekreterare (BOARD_SECRETARY)

**Internt ansvar:**
- Protokollföring vid möten
- Dokumenthantering och arkivering
- Föreningens korrespondens
- Informationsutskick till medlemmar
- Kallelse till stämmor (i samarbete med ordförande)
- Registerhantering (medlemsförteckning)

**Delegerade externa tjänster:**

| Tjänst | Extern leverantör | Beskrivning |
|--------|-------------------|-------------|
| Digital kommunikationsplattform | SaaS-leverantör (Hemmet) | Utskick, dokumentdelning, möteshantering |
| Digital signering | BankID-leverantör | Protokollsignering, avtalssignering |
| Arkivering | Dokumentarkivtjänst | Långtidslagring av ritningar, protokoll, avtal |
| Tryckeri/distribution | Trycktjänst | Fysisk kallelse till medlemmar utan digital tillgång |

**Nuläge i Hemmet:** Se `docs/SEKRETERAR_ROLLEN.md`

**Systemintegrationsbehov:**
- BankID för digital signering av protokoll
- E-post/SMS-utskick för kallelser och meddelanden
- Dokumentarkiv med versionering
- Mallhantering för protokoll, kallelser, meddelanden

---

### 3. Kassör (BOARD_TREASURER)

**Internt ansvar:**
- Föreningens ekonomi, likviditet och budget
- Attestera fakturor och utlägg
- Årsredovisning (tillsammans med styrelsen)
- Avgiftsberäkning och avisering
- Panthantering och överlåtelseavgifter
- Kontakt med bank och revisor
- Firmatecknare

**Delegerade externa tjänster:**

| Tjänst | Extern leverantör | Beskrivning |
|--------|-------------------|-------------|
| Ekonomisk förvaltning | HSB, Riksbyggen, SBC, Nabo, Fastum | Bokföring, bokslut, avisering, medlemsförteckning — **vanligaste delegeringen** |
| Revision | Auktoriserad revisor (BoRevision, EY, etc.) | Granskning av räkenskaper, revisionsberättelse |
| Bank- och lånehantering | Bank (SEB, Nordea, Handelsbanken etc.) | Lån, ränteplaceringar, likviditetsplanering |
| Inkasso | Inkassobolag | Obetalda avgifter |
| Skatterådgivning | Skattekonsult | Momshantering (parkering), kontrolluppgifter |

**Nuläge i Hemmet:** Se `docs/KASSOR_ROLLEN.md`

**Systemintegrationsbehov:**
- Ekonomisystem (Fortnox, Visma, BRF-specifika system)
- Bankintegration (autogiro, betalfiler, kontoutdrag)
- Aviseringssystem (månadsavgifter, el, vatten, parkering)
- iXBRL-export för Bolagsverket
- K3-redovisningsstöd

---

### 4. Fastighetsansvarig / Teknisk ledamot (BOARD_PROPERTY_MGR)

**Internt ansvar:**
- Fastighetens fysiska skick
- Underhållsplan (nu K3-kopplad med komponentavskrivning)
- Myndighetskrav (OVK, hiss, brand, radon, energideklaration)
- Felanmälningar och reparationer
- Upphandling av entreprenader
- Trädgård och utemiljö

**Delegerade externa tjänster:**

| Tjänst | Extern leverantör | Beskrivning |
|--------|-------------------|-------------|
| Teknisk förvaltning | Fastighetsbyrån, Driftia, lokalt bolag | Drift: värme, vatten, ventilation, el |
| Fastighetsskötsel | Fastighetsskötare/vaktmästare | Fysiskt underhåll: lampor, gräs, snö, sopor |
| Projektledning (entreprenad) | Byggprojektledare | Stambyte, takbyte, fönsterbyte — upphandling och kontroll |
| OVK-besiktning | Auktoriserad OVK-kontrollant | Obligatorisk ventilationskontroll |
| Hissbesiktning | Hisstekniker (KONE, Schindler, Otis) | Lagstadgad hissbesiktning |
| Brandskydd (SBA) | Brandskyddskonsult | Systematiskt brandskyddsarbete |
| Energideklaration | Energiexpert | Obligatorisk energideklaration (10 år), EPBD-krav |
| Radonmätning | Radonkonsult | Obligatorisk egenkontroll |
| Skadedjursbekämpning | Anticimex, Nomor | Avtal för skadedjur |
| Städning | Städfirma | Trappstädning, fönsterputs |
| Trädgård | Trädgårdsfirma | Grönytor, trädfällning |

**Nuläge i Hemmet:**
- `DamageReport`-modell finns för felanmälningar
- `BuildingComponent`-modell med livscykel, gapanalys och statusbedömning
- `Inspection`-modell med 9 inspektionstyper och förfallobevakning (OVK, hiss, brand, energi m.fl.)
- `Contractor`-register med kontaktuppgifter, F-skatt och PUB-avtal
- `Contract`-modul med kategorier, statusar, ramavtal, avrop och förfallopåminnelser
- 13-stegs upphandlingsflöde med offerthantering och mandatspårning
- Ingen integration med extern teknisk förvaltare

**Systemintegrationsbehov:**
- Felanmälningssystem (in/ut mot teknisk förvaltare)
- IoT-integration (värmesystem, vattenläckagevakter, energimätare)

---

### 5. Miljöansvarig (BOARD_ENVIRONMENT)

**Internt ansvar:**
- Sophantering och källsortering
- Miljöpolicy och hållbarhet
- Kemikaliehantering (gemensamma utrymmen)
- Cykelrum, förråd och gemensamma ytor

**Delegerade externa tjänster:**

| Tjänst | Extern leverantör | Beskrivning |
|--------|-------------------|-------------|
| Avfallshantering | Stockholm Vatten, SÖRAB, lokalt bolag | Sophämtning, grovsopor, farligt avfall |
| Energirådgivning | Energikonsult | Solceller, bergvärme, energieffektivisering |
| Miljöcertifiering | Certifieringsorgan | Miljöbyggnad, Svanen (vid ombyggnad) |

**Nuläge i Hemmet:** Minimal rollspecifik funktionalitet. Delar `report:manage` med ordförande.

---

### 6. Aktivitetsansvarig (BOARD_EVENTS)

**Internt ansvar:**
- Sociala aktiviteter (grillkvällar, städdagar, julglögg)
- Bokning av gemensamma lokaler
- Trivselåtgärder

**Delegerade externa tjänster:**

| Tjänst | Extern leverantör | Beskrivning |
|--------|-------------------|-------------|
| Cateringfirmor | Catering | Vid föreningsarrangemang |
| Bokningssystem | SaaS-leverantör | Tvättstuga, bastu, gästlägenhet |

**Nuläge i Hemmet:** Ingen rollspecifik funktionalitet implementerad. `BookableResource`/`Booking`-modell finns men med minimal UI.

---

### 7. Suppleant (BOARD_SUBSTITUTE)

**Internt ansvar:**
- Ersätter ordinarie ledamot vid frånvaro
- Deltar på möten (med eller utan rösträtt beroende på stadgar)
- Insatt i pågående ärenden

**Nuläge i Hemmet:** Begränsade permissions (8 st). Kan se möten och delta men inte skapa eller godkänna.

---

### 8. Revisor (AUDITOR)

**Internt ansvar:**
- Granska styrelsens förvaltning och räkenskaper
- Revisionsberättelse till stämman
- Oberoende av styrelsen

**Delegerade externa tjänster:**

| Tjänst | Extern leverantör | Beskrivning |
|--------|-------------------|-------------|
| Auktoriserad revision | Revisionsbolag (BoRevision, PwC, Grant Thornton) | Extern revisor krävs ofta av stadgarna |
| Förvaltningstillsyn | Förbundsrevisor (HSB, Riksbyggen) | Moderorganisationens revision |

**Nuläge i Hemmet:** `audit:view` permission. `AUDITOR_SUBSTITUTE`-roll med egna permissions. `Audit`-modell finns men revisionsflödet är primitivt.

---

## Del II — Ekosystemet: Systemintegration

### Integrationsmatris

| Styrelseroll | Systembehov (internt) | Extern part (integration) | Prioritet |
|-------------|----------------------|--------------------------|:---------:|
| **Kassör** | Attestflöden, aviseringar | Ekonomisystem (Fortnox/Visma), bank | HÖG |
| **Fastighetsansvarig** | Felanmälan, underhållsplan | Teknisk förvaltare (API/e-post) | HÖG |
| **Sekreterare** | Dokumentdelning, signering | BankID, e-post/SMS-tjänst | HÖG |
| **Ordförande** | Medlemsprövning, överlåtelser | Mäklarsystem, kreditupplysning | MEDEL |
| **Alla** | Möten, beslut, uppgifter | Kalender (Google/Outlook), notifikationer | MEDEL |
| **Miljöansvarig** | Energiuppföljning | Energimätare, IoT-sensorer | LÅG |
| **Aktivitetsansvarig** | Bokningssystem | Externt bokningssystem | LÅG |

### Vanligaste ekonomiska förvaltarna (svenska marknaden)

| Förvaltare | Storlek | Typisk integration |
|------------|---------|-------------------|
| HSB | Störst, kooperativ | Eget system, SIE-export |
| Riksbyggen | Stor, kooperativ | Eget system, SIE-export |
| SBC | Stor, privat | API (begränsat), SIE |
| Nabo (f.d. Rikshem) | Medel | Modernare API |
| Fastum | Medel | SIE, manuell |
| Lokala förvaltare | Små | Fortnox/Visma, SIE-export |

### Vanligaste tekniska förvaltarna

| Typ | Exempel | Integration |
|-----|---------|-------------|
| Stor kedja | Newsec, Coor, Driftia | Egna system, API-potential |
| Lokal firma | Fastighetsbyrån, enskilda | E-post, telefon |
| Fastighetsskötare | Enskild firma/anställd | Felanmälningssystem, app |

---

## Del III — Gap-analys: Hemmet vs verkligheten

### Vad Hemmet stödjer idag

| Funktion | Status | Kommentar |
|----------|:------:|-----------|
| Styrelsemöten med dagordning | OK | Fullt mötesflöde med admin/presentation |
| Beslut och beslutslogg | OK | Acklamation, votering, namnupprop |
| Utläggshantering | OK | Attestflöde: submit → approve → paid |
| Medlemsregister med GDPR | OK | Fältnivåfiltrering per roll, personnummermaskering, åtkomstloggning, samtycke via UserConsent |
| Motioner | OK | Fullt flöde med styrelsens yttrande |
| Årsredovisning | Grundläggande | Saknar K3-stöd |
| Felanmälan | Grundläggande | Ingen integration med teknisk förvaltare |
| Roller och behörigheter | OK | 15 roller, 44 permissions |
| Underhållsplan | OK | BuildingComponent med livscykel, gapanalys, 9 inspektionstyper med förfallobevakning |
| Kontrakthantering/Avtal | OK | Kategorier, statusar, ramavtal, avrop, förfallopåminnelser |
| Upphandling | OK | 13-stegs upphandlingsflöde med offerthantering och mandatspårning |
| Entreprenörer/leverantörer | OK | Register med kontaktuppgifter, F-skatt, PUB-avtal |
| Överlåtelseprocess | OK | TransferCase med 8 statusar, avgiftsberäkning, pantnotering, medlemsprövning |
| Störningshantering | OK | DisturbanceCase med eskaleringsmodell och tidslinje |
| Andrahandsuthyrning | OK | SubletApplication med tidsbegränsning och styrelsebeslut |
| Renoveringsansökan | OK | RenovationApplication med teknisk och styrelsebedömning |
| Valberedning | OK | NominationPeriod, Nomination, MemberNomination — fullt flöde |
| Jävsdeklaration | OK | DecisionRecusal med deltagarlista per beslut |
| Dashboard | OK | Behörighetsbaserad, rolloberoende |

### Vad som saknas för ett komplett styrelseverktyg

| Funktion | Berör roll | Prioritet |
|----------|-----------|:---------:|
| **Ekonomisystemintegration** (Fortnox/Visma/SIE) | Kassör | HÖG |
| **Digital signering** (BankID) | Sekreterare, Ordförande | HÖG |
| **Aviseringshantering** (månadsavgifter) | Kassör | HÖG |
| **Kallelseverktyg** (digital distribution av kallelse/agenda) | Sekreterare | HÖG |
| **Budget/ekonomisk planering** med uppföljning | Kassör | MEDEL |
| **Bokningssystem** (tvättstuga, bastu, gästrum) — UI | Aktivitetsansvarig | MEDEL |
| **Energiuppföljning/IoT** (EPBD-krav, värmesystem) | Fastighetsansvarig, Miljöansvarig | LÅG |

---

## Del IV — Extern leverantörshantering i systemet

### Krav på systemstöd

1. **Leverantörsregister** — namn, kontakt, avtal, PUB-avtal (GDPR)
2. **Avtalsdatabas** — avtalstid, uppsägningstid, automatisk påminnelse
3. **Behörighetsnivåer per leverantör** — vilka data de får se (dataminimering)
4. **Åtkomstloggning** — spårning av extern åtkomst till systemet
5. **Automatisk tokenrevokering** — vid avtalsslut eller leverantörsbyte

### Leverantörskategorier

| Kategori | Typiska leverantörer | Dataåtkomst | PUB-avtal krävs |
|----------|---------------------|-------------|:---------------:|
| Ekonomisk förvaltare | HSB, Riksbyggen, SBC | Medlemsregister, ekonomi, personnummer | JA |
| Teknisk förvaltare | Newsec, Driftia | Kontaktuppgifter, felanmälningar | JA |
| Fastighetsskötare | Enskild firma | Kontaktuppgifter (begränsat) | JA |
| Revisor | BoRevision, PwC | Ekonomi, styrelseprotokoll | JA |
| Jurist | Advokatbyrå | Ärendespecifikt | Beror på uppdrag |
| IT-leverantör (Hemmet) | Systemleverantör | All data (personuppgiftsbiträde) | JA |
| Mäklare | Vid överlåtelse | Begränsat till aktuell transaktion | NEJ (eget ändamål) |
| Entreprenör | Byggprojekt | Ingen persondata normalt | NEJ |
| Försäkringsbolag | Länsförsäkringar etc. | Vid skada: lägenhet + kontaktuppgifter | Beror på fall |

---

## Del V — Juridiska fallgropar: BRF-styrelser i legalt trubbel (2000-talet)

### Övergripande kontext

Under 2000-talet har juridiken kring BRF:er stramats åt markant. Lekmannastyrelser har i flera uppmärksammade fall fått lära sig att personligt ansvar inte bara är teoretiskt. LEF (2018:672) och skärpt praxis har gjort att styrelsens aktsamhetsplikt tas på allvar av domstolarna.

---

### 1. Jäv och korruption vid upphandlingar

**Den vanligaste källan till legalt trubbel.**

**Scenario:** Styrelseledamot äger en byggfirma eller har nära släkting som driver en målarfirma. Föreningen anlitar firman utan att ledamoten anmält jäv eller lämnat mötet vid beslut.

**Rättslig grund:** LEF 7 kap. 23 § (jäv), BrB 10 kap. 5 § (trolöshet mot huvudman)

**Konsekvenser:**
- Skadeståndsskyldighet mot föreningen om tjänsten köpts till överpris
- I grova fall (kickback-upplägg): fängelsestraff för trolöshet mot huvudman
- Beslut kan angripas och ogiltigförklaras av enskild medlem

**Vad Hemmet bör stödja:**
- [x] Jävsdeklaration vid beslutsfattande — DecisionRecusal-modell
- [x] Loggning av vem som deltog/avstod vid varje beslut — participantIds + ActivityLog
- [x] Jävsregister per styrelsemedlem — ConflictOfInterest-modell
- [ ] Automatisk varning om en leverantör delar organisationsnummer/namn med styrelsemedlem

**Nuläge i Hemmet:** `DecisionRecusal`-modell med jävsdeklaration vid beslut. `participantIds` loggar vem som deltog/avstod. `ConflictOfInterest`-modell finns. `Contractor`-register med organisationsnummer möjliggör framtida korsreferens. Automatisk varning vid namnmatchning saknas ännu.

---

### 2. Felaktigt nekade medlemskap

**Scenario:** Styrelsen nekar medlemskap på grund av ålder, familjekonstellation, etnicitet eller "magkänsla" istället för sakliga ekonomiska grunder.

**Rättslig grund:** BrfL 2 kap. 3 § (saklig prövning), Diskrimineringslagen (2008:567)

**Konsekvenser:**
- Hyresnämnden river upp beslutet
- Föreningen tvingas betala skadestånd till köparen för förlorad värdeökning och extrakostnader
- Diskrimineringsersättning vid DO-anmälan
- Mäklaren kan kräva ersättning för utebliven affär

**Vad Hemmet bör stödja:**
- [x] Strukturerad medlemsprövning med obligatoriska fält — TransferCase med 8 statusar, avgiftsberäkning, kreditkontroll-checklista
- [ ] Standardiserade avslagsmallar med juridiskt korrekta motiveringar
- [x] Beslutsspår: vilka grunder prövades, vilka underlag fanns, vem beslutade — ActivityLog
- [ ] Varning vid avslag utan dokumenterad ekonomisk grund

**Nuläge i Hemmet:** `TransferCase` med fullt överlåtelseflöde (8 statusar), avgiftsberäkning, pantnotering och medlemsprövning. `MembershipApplication` finns parallellt. Standardiserade avslagsmallar saknas.

---

### 3. Passivitet vid otillåtna ombyggnationer

**Styrelser hamnar i trubbel för vad de INTE gjorde.**

**Scenario:** Medlem river bärande vägg, bygger om ventilationen eller installerar vattenburet golv utan tillstånd. Styrelsen vet om det men vill inte "bråka med grannen."

**Rättslig grund:** BrfL 7 kap. 7 § (bostadsrättshavarens ansvar), 7 kap. 18 § (förverkande)

**Konsekvenser:**
- Om huset får sättningar eller brandskyddet förstörs: styrelsen personligt skadeståndsskyldig
- Andra medlemmar kan stämma styrelsen för vårdslöst tillsynsansvar
- Försäkringsbolaget kan vägra ersättning om styrelsen känt till bristen

**Vad Hemmet bör stödja:**
- [x] Tillståndsansökan för ombyggnad med godkännandeflöde — RenovationApplication
- [x] Dokumentation av villkor och besiktningskrav — teknisk bedömning + styrelsebedömning
- [ ] Automatisk påminnelse om uppföljning efter godkänd renovering
- [x] Ärendehistorik kopplad till lägenhet

**Nuläge i Hemmet:** `RenovationApplication`-modell med teknisk och styrelsebedömning. Koppling till lägenhet. Automatisk uppföljningspåminnelse saknas.

---

### 4. Bristande kontroll vid andrahandsuthyrning

**Scenario:** Styrelsen godkänner uthyrning slentrianmässigt utan bakgrundskontroll eller tidsbegränsning. Lägenheten används för brottslig verksamhet, eller hyresgästen vägrar flytta.

**Rättslig grund:** BrfL 7 kap. 10-11 § (andrahand), JB 12 kap. (hyreslagen)

**Konsekvenser:**
- Besittningsskydd om kontraktet skrivs fel (hyresgästen kan inte avhysas)
- Ansvar för störningar och otrygghet gentemot andra medlemmar
- Hyresnämnden kan ge hyresgästen rätt att bo kvar

**Vad Hemmet bör stödja:**
- [x] Andrahandsansökan med obligatoriska fält (skäl, tidsperiod, hyresgästuppgifter) — SubletApplication
- [x] Automatisk tidsbegränsning med påminnelse vid utgång
- [ ] Standardavtalsmall som undviker besittningsskydd
- [x] Logg över godkända/avslagna ansökningar med motivering

**Nuläge i Hemmet:** `SubletApplication`-modell med status, tidsperiod och styrelsebeslut. `BrfRules.subletFeeMaxPercent` styr avgift. Standardavtalsmall saknas.

---

### 5. Ekonomiskt vilseledande — "oäkta brf" och dolda avgiftshöjningar

**Scenario:** Styrelsen döljer att föreningen är på väg att bli en "oäkta förening" (skattemässigt) eller missar att informera om kommande extrema avgiftshöjningar vid ränteomförhandlingar eller höjd tomträttsavgäld.

**Rättslig grund:** BrfL 9 kap. 14 § (årsredovisning), ÅRL 2 kap. 3 § (rättvisande bild)

**Konsekvenser:**
- Köpare stämmer styrelseledamöter personligen för vilseledande information i årsredovisning
- Mäklare kan hållas medansvarig men styrelsen bär primärt informationsansvar
- Personligt skadestånd till drabbade köpare

**Vad Hemmet bör stödja:**
- [ ] Automatisk bevakning av föreningens skattestatus (äkta/oäkta)
- [ ] Varningsindikatorer för kommande avgiftshöjningar baserat på lån och räntor
- [ ] Transparent ekonomisk information tillgänglig för alla medlemmar
- [ ] Historik över avgiftsförändringar

**Nuläge i Hemmet:** Ingen ekonomisk analys eller prognosfunktion. Ingen bevakning av skattestatus. Begränsad ekonomisk transparens.

---

### 6. GDPR-incidenter och "skampålar"

**Scenario:** Styrelsen publicerar namn på medlemmar som ligger efter med avgiften på anslagstavla eller i nyhetsbrev. Eller delar personnummer via osäker kanal.

**Rättslig grund:** GDPR Art. 5-6 (ändamål och rättslig grund), Dataskyddslagen 3 kap. 10 § (personnummer)

**Konsekvenser:**
- Sanktionsavgift från IMY (Integritetsskyddsmyndigheten)
- Skadestånd till drabbad medlem
- Enorma interna konflikter och förtroendekris

**Vanligt missförstånd:** "Det spelar ingen roll — personnumren finns ju på Ratsit/Merinfo ändå." Detta är juridiskt fel. Att data publicerats av andra aktörer ger inte BRF:en rätt att behandla den utan egen rättslig grund. Sverige har en unik historik av öppen persondata (skolregister med personnummer, telefonkataloger, SPAR-registret, skattelängder) som skapat en kulturell förväntning om öppenhet — men GDPR gäller fullt ut för privaträttsliga föreningar oavsett denna tradition.

**Vad Hemmet bör stödja:** Se `docs/BRF_SYSTEM_LAGRUM.md` (Del 0) för fullständig historisk kontext och GDPR-analys.

---

### 7. Bristande underhåll och förfallna byggnader

**Scenario:** Styrelsen skjuter upp nödvändigt underhåll (stammar, tak, fasad) för att hålla nere avgifterna. Vattenskada uppstår och drabbar flera lägenheter.

**Rättslig grund:** BrfL 7 kap. 4 § (föreningens underhållsansvar), LEF 8 kap. 4 § (skadestånd)

**Konsekvenser:**
- Skadeståndskrav från drabbade medlemmar
- Försäkringsbolag kan neka ersättning vid uppenbart eftersatt underhåll
- Dramatiskt högre reparationskostnader jämfört med planerat underhåll

**Vad Hemmet bör stödja:**
- [x] Underhållsplan med komponentregister och statusbedömning — BuildingComponent med livscykel och gapanalys
- [x] Automatisk varning när planerat underhåll förfaller — Inspection med förfallobevakning (9 typer)
- [ ] Koppling mellan underhållsplan och budget/avsättning
- [x] Besiktningsprotokoll kopplade till komponenter — Inspection-modell

**Nuläge i Hemmet:** `BuildingComponent`-modell med livscykel, gapanalys och statusbedömning. `Inspection`-modell med 9 inspektionstyper och förfallobevakning. Koppling till budget/ekonomisk planering saknas.

---

### 8. Felaktig hantering av störningar

**Scenario:** Granne klagarbrev på störningar (buller, rök, hotfullt beteende). Styrelsen gör ingenting. Alternativt: styrelsen agerar för hårt utan att följa rätt process.

**Rättslig grund:** BrfL 7 kap. 9 § (störningar), 7 kap. 18 § (förverkande)

**Konsekvenser:**
- Passivitet: skadestånd mot klagande medlem för ohållbar boendemiljö
- Överreaktion: ogiltigt förverkande, skadestånd mot den utpekade

**Vad Hemmet bör stödja:**
- [x] Störningsärendehantering med tidslinje (anmälan → tillsägelse → varning → förverkande) — DisturbanceCase med eskaleringsmodell
- [x] Dokumentation av varje steg för rättslig hållbarhet
- [ ] Mallar för tillsägelsebrev och varningsbrev
- [x] Koppling till lägenhet med ärendehistorik

**Nuläge i Hemmet:** `DisturbanceCase`-modell med 8-stegs eskaleringsmodell och tidslinje. Koppling till lägenhet. Brevmallar saknas.

---

### 9. Stämmofel och ogiltiga beslut

**Scenario:** Styrelsen kallar till stämma med för kort varsel, dagordningen saknar punkt som behandlas ändå, eller rösträkningen är felaktig.

**Rättslig grund:** LEF 6 kap. (föreningsstämma), LEF 6 kap. 47-48 § (klander av stämmobeslut)

**Konsekvenser:**
- Enskild medlem kan klandra stämmobeslutet i tingsrätten inom 3 månader
- Beslutet ogiltigförklaras och måste tas om
- Kostnader för ny stämma och eventuellt skadestånd

**Vad Hemmet bör stödja:**
- [ ] Automatisk validering av kallelsetider mot BrfRules
- [ ] Verifiering att alla behandlade punkter fanns i dagordningen
- [ ] Automatisk rösträkning med spårbarhet
- [ ] Dokumentation av röstlängd och närvaroförteckning

**Nuläge i Hemmet:** Kallelsetidsvalidering finns (noticePeriodMinWeeks/MaxWeeks) med override-möjlighet. Röstlängd och närvaroregistrering finns. Rösträkning delvis implementerad. Dagordningsvalidering saknas.

---

### 10. Bristande försäkringsskydd

**Scenario:** Styrelsen har inte tecknat styrelseansvarsförsäkring. En medlem stämmer för vårdslöst beslut. Ledamöterna betalar ur egen ficka.

**Rättslig grund:** LEF 8 kap. 4 § (styrelsens skadeståndsskyldighet)

**Konsekvenser:**
- Personligt betalningsansvar för alla ledamöter som deltog i beslutet
- Kan inte gömma sig bakom att "vi var ideella"

**Vad Hemmet bör stödja:**
- [ ] Påminnelse om att teckna/förnya styrelseansvarsförsäkring
- [ ] Försäkringsinformation i föreningsinställningar
- [ ] Varning vid skapande av ny styrelseperiod om försäkring saknas

**Nuläge i Hemmet:** `BrfSettings.insuranceCompany/Policy` finns men ingen bevakning av förnyelse eller typ av försäkring.

---

## Del VI — Systemets skyddsfunktioner: Sammanfattning

### Vad systemet kan göra för att skydda styrelsen

Styrelser består av lekmän. Systemet bör vara deras **säkerhetsnät** — inte bara ett administrationsverktyg.

| Skyddsfunktion | Skyddar mot | Prioritet | Nuläge |
|---------------|------------|:---------:|:------:|
| **Jävsdeklaration vid beslut** | Jäv och korruption (#1) | HÖG | IMPLEMENTERAD — DecisionRecusal + participantIds |
| **Strukturerad medlemsprövning** | Felaktiga avslag (#2) | HÖG | IMPLEMENTERAD — TransferCase med kreditkontroll-checklist |
| **Beslutsspår med deltagarlista** | Alla rättsliga tvister | HÖG | IMPLEMENTERAD — ActivityLog + participantIds per beslut |
| **Andrahandsflöde med tidsbegränsning** | Besittningsskydd (#4) | HÖG | IMPLEMENTERAD — SubletApplication med status + period |
| **Underhållsplan med varningar** | Eftersatt underhåll (#7) | HÖG | IMPLEMENTERAD — BuildingComponent + Inspection med deadline |
| **Kallelsetidsvalidering** | Ogiltiga stämmobeslut (#9) | MEDEL | IMPLEMENTERAD |
| **GDPR-åtkomstkontroll** | Dataskyddsincidenter (#6) | HÖG | IMPLEMENTERAD — fältnivåfiltrering, personnummermaskering, åtkomstloggning |
| **Störningsärendehantering** | Felaktig störningshantering (#8) | MEDEL | IMPLEMENTERAD — DisturbanceCase med 8-stegs tidslinje |
| **Ekonomisk transparens** | Vilseledande information (#5) | MEDEL | IMPLEMENTERAD — Kassör-dashboard, överlåtelseprocess |
| **Försäkringspåminnelse** | Personligt ansvar (#10) | LÅG | Saknas — BrfSettings har data men ingen bevakning |
| **Renoveringsansökan** | Otillåtna ombyggnationer (#3) | MEDEL | IMPLEMENTERAD — RenovationApplication med teknisk bedömning |
| **Kontrakthantering** | Avtalsrisker, förfallna avtal | HÖG | IMPLEMENTERAD — Contract med kategorier, ramavtal, förfallopåminnelser |
| **Upphandlingsflöde** | Jäv, överpris (#1) | HÖG | IMPLEMENTERAD — 13-stegs flöde med offert och mandatspårning |
| **Leverantörsregister** | GDPR/PUB-avtal, leverantörskontroll | MEDEL | IMPLEMENTERAD — Contractor med F-skatt, PUB-avtal |
| **Valberedning** | Felaktig valberedningsprocess | MEDEL | IMPLEMENTERAD — NominationPeriod, Nomination, MemberNomination |

---

## Del VII — Styrelsens konstituering: Stämma vs intern organisering

### Grundprincipen

Hela styrelsen är **solidariskt ansvarig** (LEF 8 kap. 4 §) oavsett vem som har vilken roll. Rollfördelningen är en intern organisationsfråga — inte ett juridiskt ansvarsskifte.

### Två modeller

| Modell | Stämman väljer | Styrelsen väljer | Konsekvens vid avgång |
|--------|:-------------:|:----------------:|----------------------|
| **Stämman utser roller** | Ordförande + ledamöter namngivna per roll | Eventuellt sekreterare/kassör | Extra stämma krävs om stämmovald roll avgår |
| **Styrelsen konstituerar sig** | Ledamöter (utan rollspecificering) | Alla roller internt | Styrelsen omfördelar — ingen extra stämma |

### Stadgevarianter i verkligheten

- **HSB normalstadgar:** Stämman väljer ordförande. Styrelsen konstituerar övriga roller.
- **Riksbyggen:** Styrelsen konstituerar sig helt själv.
- **Många fristående:** Stämman väljer ordförande, ibland kassör. Resten internt.
- **Vissa äldre stadgar:** Alla roller specificerade i stämmobeslut.

### Konsekvens vid avgång

```
Stämman valde Anna som ordförande
    → Anna avgår efter 3 månader
    → Styrelsen KAN INTE utse ny ordförande (stämmobeslut)
    → Extra stämma måste kallas
    → 2-6 veckors kallelsetid (BrfRules)
    → Under tiden: vice ordförande eller äldste ledamot leder

Styrelsen konstituerade Anna som ordförande
    → Anna avgår efter 3 månader
    → Suppleant Eva inträder
    → Styrelsen omfördelar roller vid nästa möte
    → Ingen extra stämma behövs
```

### Konstituerande möte

Direkt efter stämman (eller vid behov) håller styrelsen ett **konstituerande sammanträde** där roller fördelas. Detta är ett vanligt styrelsemöte men med en specifik dagordning:

1. Mötets öppnande
2. Val av ordförande (om inte stämman valt)
3. Val av vice ordförande
4. Val av sekreterare
5. Val av kassör
6. Fördelning av övriga ansvarsområden
7. Firmateckningsordning
8. Mötets avslutande

### Systemstöd (BrfRules-konfiguration)

```
BrfRules {
  chairElectedByAssembly    Boolean @default(false)  // true = stämman väljer ordförande
  boardSelfConstitutes      Boolean @default(true)   // true = styrelsen fördelar roller
}
```

**Varning i systemet vid avgång:** Om `chairElectedByAssembly = true` och ordföranden avgår:
> "Ordföranden valdes av stämman. Extra stämma krävs för att välja ny ordförande."
