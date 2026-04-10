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
- `BrfRules.maintenancePlanRequired/Years` finns men ingen underhållsplanmodell
- Ingen integration med teknisk förvaltare
- Ingen koppling till OVK, hiss, energideklaration

**Systemintegrationsbehov:**
- Felanmälningssystem (in/ut mot teknisk förvaltare)
- Underhållsplan med komponentregister (K3-krav)
- Besiktningskalender (OVK, hiss, brand, energi)
- Entreprenadhantering (offertförfrågan, kontrakt, uppföljning)
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

**Nuläge i Hemmet:** Ingen rollspecifik funktionalitet implementerad. Inget bokningssystem.

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

**Nuläge i Hemmet:** `audit:view` permission. Kan se men inte utföra revision. `Audit`-modell finns men revisionsflödet är primitivt.

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
| Medlemsregister | Delvis | Saknar fältnivåfiltrering (GDPR) |
| Motioner | OK | Fullt flöde med styrelsens yttrande |
| Årsredovisning | Grundläggande | Saknar K3-stöd |
| Felanmälan | Grundläggande | Ingen integration med teknisk förvaltare |
| Roller och behörigheter | OK | 12 roller, 35+ permissions |

### Vad som saknas för ett komplett styrelseverktyg

| Funktion | Berör roll | Prioritet |
|----------|-----------|:---------:|
| **Ekonomisystemintegration** (Fortnox/Visma/SIE) | Kassör | HÖG |
| **Digital signering** (BankID) | Sekreterare, Ordförande | HÖG |
| **Underhållsplan** med komponentregister | Fastighetsansvarig | HÖG (K3-krav) |
| **Aviseringshantering** (månadsavgifter) | Kassör | HÖG |
| **Kallelseverktyg** (e-post/SMS) | Sekreterare | HÖG |
| **Överlåtelseflöde** (mäklare → ansökan → prövning) | Ordförande | MEDEL |
| **Besiktningskalender** (OVK, hiss, brand) | Fastighetsansvarig | MEDEL |
| **Bokningssystem** (tvättstuga, bastu, gästrum) | Aktivitetsansvarig | MEDEL |
| **Budgetverktyg** med uppföljning | Kassör | MEDEL |
| **Energiuppföljning** (EPBD-krav) | Fastighetsansvarig, Miljöansvarig | MEDEL |
| **Entreprenadhantering** | Fastighetsansvarig | LÅG |
| **IoT-integration** (värmesystem, vattenläcka) | Fastighetsansvarig | LÅG |

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
- [ ] Jävsdeklaration vid beslutsfattande — "Jag intygar att jag inte är jävig i detta ärende"
- [ ] Loggning av vem som deltog/avstod vid varje beslut
- [ ] Jävsregister per styrelsemedlem (kopplingar till företag/närstående)
- [ ] Automatisk varning om en leverantör delar organisationsnummer/namn med styrelsemedlem

**Nuläge i Hemmet:** Inget jävsstöd. Beslut loggar inte vem som deltog/avstod. Inget leverantörsregister att korsreferera mot.

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
- [ ] Strukturerad medlemsprövning med obligatoriska fält (ekonomisk bedömning, kreditupplysning)
- [ ] Standardiserade avslagsmallar med juridiskt korrekta motiveringar
- [ ] Beslutsspår: vilka grunder prövades, vilka underlag fanns, vem beslutade
- [ ] Varning vid avslag utan dokumenterad ekonomisk grund

**Nuläge i Hemmet:** `MembershipApplication` med godkänn/avslå finns men ingen strukturerad prövningsmall. Inga standardiserade avslagsorsaker. Inget krav på motivering.

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
- [ ] Tillståndsansökan för ombyggnad med godkännandeflöde
- [ ] Dokumentation av villkor och besiktningskrav
- [ ] Automatisk påminnelse om uppföljning efter godkänd renovering
- [ ] Ärendehistorik kopplad till lägenhet (inte bara person)

**Nuläge i Hemmet:** Inget renoveringsstöd. Ingen tillståndsprocess. Ingen koppling mellan lägenhet och ärenden.

---

### 4. Bristande kontroll vid andrahandsuthyrning

**Scenario:** Styrelsen godkänner uthyrning slentrianmässigt utan bakgrundskontroll eller tidsbegränsning. Lägenheten används för brottslig verksamhet, eller hyresgästen vägrar flytta.

**Rättslig grund:** BrfL 7 kap. 10-11 § (andrahand), JB 12 kap. (hyreslagen)

**Konsekvenser:**
- Besittningsskydd om kontraktet skrivs fel (hyresgästen kan inte avhysas)
- Ansvar för störningar och otrygghet gentemot andra medlemmar
- Hyresnämnden kan ge hyresgästen rätt att bo kvar

**Vad Hemmet bör stödja:**
- [ ] Andrahandsansökan med obligatoriska fält (skäl, tidsperiod, hyresgästuppgifter)
- [ ] Automatisk tidsbegränsning med påminnelse vid utgång
- [ ] Standardavtalsmall som undviker besittningsskydd
- [ ] Logg över godkända/avslagna ansökningar med motivering

**Nuläge i Hemmet:** `BrfRules` har andrahandsparametrar (`subletFeeMaxPercent`) men inget flöde för andrahandsansökan.

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

**Vad Hemmet bör stödja:** Se `docs/BRF_SYSTEM_LAGRUM.md` för fullständig GDPR-analys.

---

### 7. Bristande underhåll och förfallna byggnader

**Scenario:** Styrelsen skjuter upp nödvändigt underhåll (stammar, tak, fasad) för att hålla nere avgifterna. Vattenskada uppstår och drabbar flera lägenheter.

**Rättslig grund:** BrfL 7 kap. 4 § (föreningens underhållsansvar), LEF 8 kap. 4 § (skadestånd)

**Konsekvenser:**
- Skadeståndskrav från drabbade medlemmar
- Försäkringsbolag kan neka ersättning vid uppenbart eftersatt underhåll
- Dramatiskt högre reparationskostnader jämfört med planerat underhåll

**Vad Hemmet bör stödja:**
- [ ] Underhållsplan med komponentregister och statusbedömning
- [ ] Automatisk varning när planerat underhåll förfaller
- [ ] Koppling mellan underhållsplan och budget/avsättning
- [ ] Besiktningsprotokoll kopplade till komponenter

**Nuläge i Hemmet:** `BrfRules.maintenancePlanRequired/Years` finns men ingen underhållsplanmodell.

---

### 8. Felaktig hantering av störningar

**Scenario:** Granne klagarbrev på störningar (buller, rök, hotfullt beteende). Styrelsen gör ingenting. Alternativt: styrelsen agerar för hårt utan att följa rätt process.

**Rättslig grund:** BrfL 7 kap. 9 § (störningar), 7 kap. 18 § (förverkande)

**Konsekvenser:**
- Passivitet: skadestånd mot klagande medlem för ohållbar boendemiljö
- Överreaktion: ogiltigt förverkande, skadestånd mot den utpekade

**Vad Hemmet bör stödja:**
- [ ] Störningsärendehantering med tidslinje (anmälan → tillsägelse → varning → förverkande)
- [ ] Dokumentation av varje steg för rättslig hållbarhet
- [ ] Mallar för tillsägelsebrev och varningsbrev
- [ ] Koppling till lägenhet med ärendehistorik

**Nuläge i Hemmet:** `DamageReport` finns men hanterar felanmälan, inte störningar. Inget störningsärendeflöde.

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
| **Jävsdeklaration vid beslut** | Jäv och korruption (#1) | HÖG | Saknas |
| **Strukturerad medlemsprövning** | Felaktiga avslag (#2) | HÖG | Delvis |
| **Beslutsspår med deltagarlista** | Alla rättsliga tvister | HÖG | Delvis |
| **Andrahandsflöde med tidsbegränsning** | Besittningsskydd (#4) | HÖG | Saknas |
| **Underhållsplan med varningar** | Eftersatt underhåll (#7) | HÖG | Saknas |
| **Kallelsetidsvalidering** | Ogiltiga stämmobeslut (#9) | MEDEL | Implementerad |
| **GDPR-åtkomstkontroll** | Dataskyddsincidenter (#6) | HÖG | Saknas |
| **Störningsärendehantering** | Felaktig störningshantering (#8) | MEDEL | Saknas |
| **Ekonomisk transparens** | Vilseledande information (#5) | MEDEL | Grundläggande |
| **Försäkringspåminnelse** | Personligt ansvar (#10) | LÅG | Saknas |
| **Renoveringsansökan** | Otillåtna ombyggnationer (#3) | MEDEL | Saknas |
