# BRF-processer: Processanalys för små, medelstora och stora föreningar

## Inledning

En BRF:s processer skalas dramatiskt med storlek. En liten förening med 10 lägenheter klarar sig med informella möten och en kassör som sköter allt i Excel. En stor förening med 300+ lägenheter är en komplex organisation med professionella förvaltare, anställd personal och mångmiljonbudget.

Denna analys kartlägger **alla processer** en BRF har — inte bara de som finns i systemet idag — kategoriserade efter frekvens, komplexitet och vilka roller som är involverade.

---

## Del I — Föreningsstorlekar

### Definitioner

| Storlek | Lägenheter | Styrelse | Typisk organisation |
|---------|:---------:|:--------:|---------------------|
| **Liten** | 5-30 | 3-5 pers | Helt ideell, ingen förvaltare eller enkel ekonomisk förvaltning |
| **Medelstor** | 30-100 | 5-7 pers | Ekonomisk förvaltare, eventuell teknisk förvaltare, fastighetsskötare |
| **Stor** | 100-300+ | 7+ pers | Full förvaltning (ekonomisk + teknisk), anställd fastighetsskötare, projektledare vid behov |

### Skillnader i processbehov

| Process | Liten BRF | Medelstor BRF | Stor BRF |
|---------|-----------|---------------|----------|
| Styrelsemöten | 4-6/år, informella | 8-10/år, strukturerade | 10-12/år + arbetsutskott |
| Ekonomi | Kassör + Excel/Fortnox | Ekonomisk förvaltare | Full förvaltning + internkontroll |
| Underhåll | Ad hoc, "vi fixar själva" | Underhållsplan, extern fastighetsskötare | Komponentbaserad plan (K3), projektledning |
| Kommunikation | Trapphuslappar, SMS-grupp | E-post, enkel webbsida | Digital plattform, app, nyhetsbrev |
| Stämma | Vardagsrum, alla känner alla | Lokal, 30-60 deltagare | Stor lokal, röstlängd, ombud, teknik |
| Felanmälan | Ring ordförande | E-post till styrelsen | Ärendesystem med SLA |

---

## Del II — Processkataloger

### A. Governance — Styrning och beslut

#### A1. Föreningsstämma (årsmöte)

**Frekvens:** 1 gång/år (ordinarie), extra vid behov
**Lagkrav:** LEF 6 kap., BrfL

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Planera datum och lokal | Ordförande | Enkel | Boka lokal | Boka stor lokal + teknik | Skapa möte OK |
| Upprätta dagordning | Ordförande + sekreterare | Standard | Standard + motioner | Komplex med många val | Dagordningsmall OK |
| Skicka kallelse (2-6 v före) | Sekreterare | Brev i postfack | Brev + e-post | Brev + e-post + app + anslagstavla | **Saknas** — ingen utskicksfunktion |
| Ta emot motioner (deadline) | Sekreterare | Sällan | Några/år | Många, kräver system | Motionsflöde OK |
| Styrelsens yttrande på motioner | Styrelsen | Informellt | Protokollfört | Formellt med rekommendation | OK |
| Upprätta röstlängd | Ordförande/sekreterare | Manuellt | Digitalt | Digitalt med ombud | Röstlängd OK |
| Hantera ombud/fullmakter | Sekreterare | Sällan | Förekommer | Vanligt, kräver validering | Ombudsflöde OK |
| Genomföra stämman | Ordförande (mötesordförande) | 1 timme | 2 timmar | 3+ timmar | Mötesadmin + presentation OK |
| Röstning | Mötesordförande | Handuppräckning | Handuppräckning + sluten | Digital/sluten + ombud | Delvis — rösträkning grundläggande |
| Val av styrelse | Valberedning → stämma | Informellt | Formellt förslag | Presentation + motförslag | **Saknas** — inget valsystem |
| Val av revisor | Valberedning → stämma | Ofta samma | Formellt | Auktoriserad + förtroendevald | **Saknas** |
| Val av valberedning | Stämma | "Nån som vill?" | Förslag från golvet | Kan vara kontroversiellt | **Saknas** — ingen valberedningsroll |
| Protokollföring | Mötessekreterare | Enkel | Strukturerat | Detaljerat med bilagor | Möteslogg + protokollseditor OK |
| Protokolljustering | Justerare | Informellt | Inom 3 veckor | Formellt med signering | **Saknas** — `signedBy` finns men ingen UI |
| Protokollpublicering | Sekreterare | Anslagstavla | E-post + webb | Digital plattform | Dokumenthantering OK |

#### A2. Styrelsemöten

**Frekvens:** 6-12 gånger/år
**Lagkrav:** LEF 7 kap.

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Kalla till möte | Ordförande | SMS/ring | E-post | System + kalender | **Saknas** — ingen kallelsefunktion |
| Upprätta dagordning | Ordförande + sekreterare | Muntlig | E-post | System med mall | Dagordningsmall OK |
| Närvarokontroll | Ordförande | Räkna huvuden | Formellt | System + QR | OK — ATTENDANCE + QR |
| Beslutförhet | Ordförande | Vet alla | Kontrolleras | System validerar | QUORUM_CHECK finns, logik **saknas** |
| Protokollföring | Sekreterare | Minnesanteckningar | Strukturerat | Detaljerat | Möteslogg + protokoll OK |
| Beslutsfattande | Styrelsen | Konsensus | Omröstning | Formell med jävscheck | Beslut OK, jävscheck **saknas** |
| Uppföljning av beslut | Ordförande | Informellt | Uppgiftslista | Ärendesystem | Task-system OK |
| Protokolljustering + signering | Justerare + sekreterare | Nästa möte | Inom 3 veckor | Digitalt med signering | **Saknas** — signering ej implementerad |

#### A3. Beslutshantering

**Frekvens:** Löpande (per möte: 3-15 beslut)

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Registrera beslut | Sekreterare | I protokollet | Separat beslutslogg | System med referensnr | Beslutslogg OK |
| Verkställa beslut | Ansvarig ledamot | Informellt | Uppgiftstilldelning | Projektplan | Task OK, koppling beslut→uppgift OK |
| Uppföljning | Ordförande | Nästa möte | Ärendelista | Dashboard + rapportering | **Delvis** — tasks men ingen dashboard |
| Jävshantering | Ordförande | Sällan aktuellt | Bör kontrolleras | Obligatoriskt | **Saknas** helt |

---

### B. Ekonomi

#### B1. Löpande ekonomi

**Frekvens:** Dagligen till månadsvis
**Lagkrav:** Bokföringslagen

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Avgiftsavisering | Kassör / förvaltare | Manuellt / autogiro | Förvaltare sköter | Förvaltare + system | **Saknas** |
| Betalningsbevakning | Kassör | Kontoutdrag | Förvaltarrapport | Automatisk bevak | **Saknas** |
| Inkassohantering | Kassör / förvaltare | Sällan | Förekommer | Rutin | **Saknas** |
| Fakturamottagning | Kassör | Få/mån | 10-30/mån | 50+/mån | **Saknas** — bara utlägg |
| Attestering | Kassör + ordförande | Informell | Firmateckning | Digitalt attestflöde | Utlägg-attest OK, faktura **saknas** |
| Bokföring | Kassör / förvaltare | Fortnox/Excel | Förvaltare | Förvaltare | **Saknas** — ingen integration |
| Bankavstämning | Kassör | Manuellt | Förvaltare | Förvaltare + internkontroll | **Saknas** |
| Momsredovisning | Kassör / förvaltare | Sällan | Vid parkering | Kvartalsvis (parkering + lokaler) | **Saknas** |

#### B2. Årsredovisning och bokslut

**Frekvens:** 1 gång/år
**Lagkrav:** ÅRL, K3 (obligatoriskt fr.o.m. 2026)

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Bokslutsarbete | Kassör / förvaltare | Förvaltare gör | Förvaltare gör | Förvaltare + kassör granskar | **Saknas** |
| Förvaltningsberättelse | Ordförande + styrelsen | Enkel text | Strukturerad | Detaljerad med nyckeltal | AnnualReport fritext OK |
| K3 komponentavskrivning | Kassör / förvaltare | Nytt 2026 | Nytt 2026, kräver register | Komplext, projektleds | **Saknas** — ingen komponentmodell |
| Revision | Revisor | Förtroendevald | Förtroendevald + evt auktoriserad | Auktoriserad krävs | Revisionsflöde OK |
| Stämmogodkännande | Stämma | Punkt på dagordningen | Formell presentation | Detaljerad genomgång | Dagordningspunkt finns |
| Digital inlämning (Bolagsverket) | Kassör / förvaltare | Manuellt | Via förvaltare | Via förvaltare / system | **Saknas** — ingen iXBRL-export |

#### B3. Budget och avgifter

**Frekvens:** 1 gång/år (budget), vid behov (avgiftsjustering)

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Budgetprocess | Kassör + styrelse | "Samma som förra året" | Förvaltare föreslår | Detaljerad per kategori | **Saknas** |
| Avgiftskalkyl | Kassör / förvaltare | Baserat på kostnader | Baserat på budget + lån | Modellering, prognoser | **Saknas** |
| Avgiftsbeslut | Stämma/styrelse | Stämma | Stämma (ofta delegation) | Stämma, ibland delegation | Beslut kan registreras |
| Avgiftsavisering | Kassör / förvaltare | Manuellt / autogiro | Förvaltare | Förvaltare + system | **Saknas** |

---

### C. Fastighetsförvaltning

#### C1. Löpande underhåll

**Frekvens:** Dagligen till veckovis

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Felanmälan | Boende → fastighetansvarig | Ring/SMS | E-post | Ärendesystem | Felanmälan OK |
| Prioritering och tilldelning | Fastighetsansvarig | Direkt åtgärd | Bedömning + tilldelning | SLA-baserat med prioritet | Prioritet finns, SLA **saknas** |
| Åtgärd | Fastighetsansvarig / extern | Gör själv | Fastighetsskötare | Entreprenör | Statusflöde OK, entreprenörkoppling **saknas** |
| Uppföljning | Fastighetsansvarig | Informellt | Stäng ärende | Nöjdhetskontroll | Resolution + kommentarer OK |
| Akutåtgärder (vattenläcka etc.) | Fastighetsansvarig / jour | Ringa rörmokare | Jourberedskap | Avtalad jour 24/7 | **Saknas** — ingen jourhantering |

#### C2. Planerat underhåll

**Frekvens:** Årlig planering, genomförande löpande

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Underhållsplan | Fastighetsansvarig | Sällan/aldrig | 10-årsplan | 30-årsplan, K3-kopplad | **Saknas** — ingen modell |
| Statusbedömning | Fastighetsansvarig / besiktningsman | "Vi ser vad som behövs" | Periodic besiktning | Systematisk per komponent | **Saknas** |
| Åtgärdsplanering | Styrelsen | Ad hoc | Årlig genomgång | Kvartalsuppföljning | **Saknas** |
| Upphandling | Fastighetsansvarig | Fråga grannen | 2-3 offerter | Formell upphandling | **Saknas** |
| Genomförande | Entreprenör | Liten insats | Projektform | Projektledare + styrgrupp | **Saknas** |
| Slutbesiktning | Fastighetsansvarig | Ögonmått | Besiktningsprotokoll | Formell slutbesiktning + garanti | **Saknas** |

#### C3. Lagstadgade besiktningar

**Frekvens:** Var 3-10 år beroende på typ

| Besiktning | Lagkrav | Intervall | Liten | Medel | Stor | Status i Hemmet |
|-----------|---------|-----------|:-----:|:-----:|:----:|:---------------:|
| OVK (ventilation) | PBL | 3-6 år | Anmärkning → fix | Avtal med kontrollant | Avtalat, kalender | **Saknas** |
| Hissbesiktning | AFS | Årlig | N/A (sällan hiss) | Om hiss finns | Flertal hissar | **Saknas** |
| Brandskydd (SBA) | LSO | Löpande | Brandvarnare | Utrymningsplan + kontroll | Brandlarm, sprinkler, rutiner | **Saknas** |
| Energideklaration | Lag 2006:985 | 10 år | Via förvaltare | Via förvaltare | Egen energiansvarig | Fält finns, logik **saknas** |
| Radon | Miljöbalken | Vid behov | Om kommun kräver | Mätning vid misstanke | Regelbunden mätning | **Saknas** |
| Lekplats | SS-EN 1176 | Årlig | Om lekplats finns | Säkerhetsbesiktning | Avtal med besiktningsfirma | **Saknas** |

---

### D. Medlemshantering

#### D1. Överlåtelse (köp/sälj av bostadsrätt)

**Frekvens:** 2-20 gånger/år beroende på storlek

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Mäklare kontaktar styrelse | Ordförande | Informellt | E-post | Via förvaltare | **Saknas** — inget överlåtelseflöde |
| Överlåtelsehandling | Kassör / förvaltare | Manuellt | Förvaltare | Förvaltare | **Saknas** |
| Medlemsprövning | Ordförande + styrelse | Kreditkontroll | Kreditkontroll + beslut | Formellt beslut med motivering | Ansökningsflöde OK, kreditkontroll **saknas** |
| Pantnotering | Kassör / förvaltare | Manuellt | Förvaltare | Förvaltare | **Saknas** |
| Avgiftsberäkning (överlåtelseavgift) | Kassör | Manuellt | Baserat på BrfRules | Automatiskt | BrfRules finns, beräkning **saknas** |
| Ägarregistrering | Sekreterare / förvaltare | Manuellt | Förvaltare | Förvaltare + system | ApartmentOwnership OK |

#### D2. Andrahandsuthyrning

**Frekvens:** 2-10 gånger/år

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Ansökan | Medlem → styrelse | Informellt | E-post med mall | Systemformulär | **Saknas** — inget andrahandsflöde |
| Bedömning av skäl | Styrelsen | Flexibelt | Enligt stadgar | Formellt med dokumentation | **Saknas** |
| Beslut + villkor | Styrelsen | Muntligt | Skriftligt | Skriftligt med mall | **Saknas** |
| Tidsbegränsning + förlängning | Sekreterare | Glöms bort | Kalender | Automatisk påminnelse | **Saknas** |
| Avgiftsuttag | Kassör | Sällan | Vid godkännande | Automatiskt | BrfRules har procentsats, flöde **saknas** |

#### D3. Medlemsregister

**Frekvens:** Löpande

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Registerhållning | Sekreterare / förvaltare | Manuellt | Förvaltare | Förvaltare + system | Medlemsregister OK |
| Kontaktuppgifter | Medlemmar | Informellt | Via förvaltare | Självservice | **Delvis** — ingen självbetjäning |
| GDPR-hantering | Styrelsen | Okunnigt | Grundläggande | Formellt med policy | **Saknas** — se BRF_SYSTEM_LAGRUM.md |
| Gallring | Styrelsen / förvaltare | Aldrig | Sällan | Rutinmässigt | **Saknas** |

---

### E. Kommunikation

#### E1. Intern kommunikation

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Styrelseinformation → medlemmar | Ordförande / sekreterare | Trapphuslappar | E-post | Digital plattform + app | Meddelanden OK |
| Kallelse till stämma | Sekreterare | Brev i postfack | Brev + e-post | Brev + e-post + digital + anslagstavla | **Saknas** — ingen utskicksfunktion |
| Nyhetsbrev / uppdateringar | Sekreterare | Sällan | Kvartalsvis | Månadsvis | Meddelanden OK (utan e-post) |
| Akutmeddelanden | Ordförande | Knacka dörr | SMS-grupp | Push-notis + SMS | **Saknas** |
| Trivselinformation | Aktivitetsansvarig | Lapp i trappen | E-post | App + anslagstavla | Meddelanden OK |

#### E2. Extern kommunikation

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Myndigheter (Bolagsverket, Skatteverket) | Kassör / förvaltare | Manuellt | Via förvaltare | Via förvaltare | **Saknas** |
| Bank och långivare | Kassör / ordförande | Direkt kontakt | Strukturerat | Formellt med avtal | **Saknas** |
| Försäkringsbolag | Ordförande / fastighetsansvarig | Vid skada | Årlig genomgång | Avtalat | **Saknas** |
| Mäklare | Ordförande | Vid överlåtelse | Rutinärende | Löpande kontakt | **Saknas** |
| Leverantörer | Fastighetsansvarig | Direkt | Via avtal | Upphandlingsprocess | **Saknas** |

---

### F. Boende och trivsel

#### F1. Felanmälan och service

Se C1 (Löpande underhåll).

#### F2. Renoveringsansökningar

**Frekvens:** 5-50/år beroende på storlek

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Ansökan från medlem | Medlem → styrelse | Muntligt | E-post/blankett | Systemformulär | **Saknas** |
| Bedömning (bärande/VVS/el) | Fastighetsansvarig | "Kolla med grannen" | Fastighetsansvarig bedömer | Teknisk förvaltare yttrar sig | **Saknas** |
| Beslut + villkor | Styrelsen | Informellt | Protokollfört | Formellt med krav | **Saknas** |
| Besiktning före/efter | Fastighetsansvarig | Sällan | Vid behov | Obligatoriskt | **Saknas** |
| Dokumentation | Sekreterare | Aldrig | I protokoll | Ärendearkiv per lägenhet | **Saknas** |

#### F3. Bokning av gemensamma utrymmen

**Frekvens:** Dagligen till veckovis

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Tvättstuga | Alla boende | Bokningstavla | Digitalt | App | **Saknas** |
| Bastu/gym | Alla boende | Nyckel | Digitalt | App med regler | **Saknas** |
| Gästlägenhet | Styrelse/boende | Ring ordförande | Bokningskalender | System med betalning | **Saknas** |
| Festlokal | Styrelse/boende | Fråga | Bokningskalender | System med deposition | **Saknas** |

#### F4. Störningshantering

**Frekvens:** 1-20/år beroende på storlek

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Anmälan | Boende → styrelse | Prata med grannen | E-post till styrelse | System | **Saknas** |
| Första tillsägelse | Ordförande | Muntligt | Skriftligt | Mall + dokumentation | **Saknas** |
| Formell varning | Styrelsen | Sällan | Brev | Juridisk mall | **Saknas** |
| Eventuellt förverkande | Styrelsen + jurist | Aldrig | Extremfall | Hyresnämnden | **Saknas** |

---

### G. Revision och kontroll

#### G1. Löpande revision

**Frekvens:** Kvartalsvis till årligen

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Kvartalsgenomgång | Revisor | Sällan | Årlig | Kvartalsvis | **Saknas** — bara årlig |
| Stickprovskontroll | Revisor | Aldrig | Ibland | Rutinmässigt | **Saknas** |
| Frågor till styrelsen | Revisor | Muntligt | E-post | Via system | **Saknas** |

#### G2. Årsrevision

Se B2 (Årsredovisning och bokslut) — revisionsflödet.

---

### H. Juridik och compliance

#### H1. Stadgeändringar

**Frekvens:** Vart 5-10 år

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Förslag till ändring | Styrelse/medlem | Sällan | Vid behov | Periodisk översyn | **Saknas** |
| Juridisk granskning | Styrelse / jurist | Informellt | Jurist granskar | Formell process | **Saknas** |
| Stämmobeslut (2 stämmor) | Stämma | Samma kväll, 2 st | Två separata stämmor | Detaljerad hantering | **Saknas** |
| Registrering hos Bolagsverket | Styrelse | Manuellt | Via jurist | Via jurist | **Saknas** |

#### H2. Försäkringshantering

**Frekvens:** Årligen + vid skada

| Delprocess | Ansvarig | Liten | Medel | Stor | Status i Hemmet |
|-----------|----------|:-----:|:-----:|:----:|:---------------:|
| Teckna/förnya försäkring | Ordförande | "Samma som förra året" | Årlig genomgång | Upphandling, mäklarhjälp | Försäkringsinfo i settings |
| Skadeanmälan | Ordförande / fastighetsansvarig | Ring försäkringsbolaget | Dokumenterad anmälan | Formell process | **Saknas** — ingen koppling felanmälan → försäkring |
| Styrelseansvarsförsäkring | Ordförande | Ofta glömd | Bör finnas | Obligatoriskt | **Saknas** — ingen bevakning |

---

## Del III — Processöversikt per storlek

### Liten BRF (5-30 lgh) — "Grannsamverkan"

**Karaktär:** Informellt, alla känner alla, en person gör ofta allt.

**Kritiska processer:**
1. Årsmöte (lagkrav)
2. Ekonomi (avgifter, bokslut)
3. Felanmälan (akut)
4. Överlåtelser (vid flytt)

**Systemvärde:** Minimera administration, säkerställa att lagkrav uppfylls (protokoll, kallelse, årsredovisning). Systemet ersätter Excel och pärmar.

### Medelstor BRF (30-100 lgh) — "Föreningslivet"

**Karaktär:** Strukturerat styrelsearbete, ekonomisk förvaltare, behov av kommunikation.

**Kritiska processer (utöver liten):**
1. Underhållsplanering
2. Motioner (fler aktiva medlemmar)
3. Andrahandsuthyrning
4. Leverantörshantering
5. Kommunikation (e-post/webb)

**Systemvärde:** Koordinering mellan styrelse och förvaltare. Transparent information till medlemmar. Beslutsspårbarhet.

### Stor BRF (100-300+ lgh) — "Organisationen"

**Karaktär:** Professionell drift, stor budget, anställd personal, komplex stämma.

**Kritiska processer (utöver medelstor):**
1. K3-komponentredovisning
2. Formell upphandling
3. Projektledning (stambyte etc.)
4. Digital stämma med teknikstöd
5. Momsredovisning (parkering/lokaler)
6. Internkontroll och revisionsplanering
7. Störningshantering (formell process)
8. Bokningssystem (tvättstuga/lokal)

**Systemvärde:** Skalbar administration, professionell förvaltning, juridisk säkerhet, intern kontroll.

---

## Del IV — Prioriteringsmatris: Vad Hemmet bör bygga härnäst

### Baserat på processanalys och BRF-storlek

| Process | Liten | Medel | Stor | Finns idag | Prioritet |
|---------|:-----:|:-----:|:----:|:----------:|:---------:|
| **Styrelsemöten** | Y | Y | Y | OK | — |
| **Årsmöte med röstlängd** | Y | Y | Y | OK | — |
| **Beslutshantering** | Y | Y | Y | OK | — |
| **Utläggsattest** | Y | Y | Y | OK | — |
| **Felanmälan** | Y | Y | Y | OK | — |
| **Motioner** | - | Y | Y | OK | — |
| **Årsredovisning + revision** | Y | Y | Y | OK | — |
| **Kallelseutskick** (e-post/SMS) | Y | Y | Y | Saknas | **1** |
| **Protokollsignering** | Y | Y | Y | Saknas | **2** |
| **Jävsdeklaration vid beslut** | - | Y | Y | Saknas | **3** |
| **Underhållsplan** | - | Y | Y | Saknas | **4** |
| **Andrahandsflöde** | - | Y | Y | Saknas | **5** |
| **Renoveringsansökan** | - | Y | Y | Saknas | **6** |
| **Valberedning + val** | - | Y | Y | Saknas | **7** |
| **Överlåtelseflöde** | Y | Y | Y | Delvis | **8** |
| **Besiktningskalender** | - | Y | Y | Saknas | **9** |
| **Störningshantering** | - | - | Y | Saknas | **10** |
| **Bokningssystem** | - | Y | Y | Saknas | **11** |
| **Budgetverktyg** | - | Y | Y | Saknas | **12** |
| **Ekonomisystemintegration** | - | Y | Y | Saknas | **13** |
| **K3-komponentredovisning** | - | - | Y | Saknas | **14** |
| **Digital signering (BankID)** | - | Y | Y | Saknas | **15** |

---

## Del V — Processkarta per roll

### Vilka processer varje roll äger eller deltar i

| Process | Ordförande | Sekreterare | Kassör | Fastighetsansv. | Miljöansv. | Aktivitetsansv. | Revisor | Valberedning | Medlem | Boende |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Styrelsemöte | Leder | Protokoll | Deltar | Deltar | Deltar | Deltar | - | - | - | - |
| Årsmöte | Leder | Protokoll | Presenterar | Presenterar | - | - | Presenterar | Presenterar | Röstar | - |
| Beslut | Beslutar | Dokumenterar | Beslutar | Beslutar | Beslutar | Beslutar | - | - | - | - |
| Ekonomi | Firmatecknar | - | Äger | - | - | - | Granskar | - | - | - |
| Budget | Godkänner | - | Äger | Underlag | - | - | - | - | - | - |
| Underhåll | Beslutar | - | Budget | Äger | - | - | - | - | - | - |
| Felanmälan | - | - | - | Äger | - | - | - | - | Anmäler | Anmäler |
| Överlåtelse | Beslutar | Registrerar | Avgift + pant | - | - | - | - | - | Ansöker | - |
| Andrahand | Beslutar | Dokumenterar | Avgift | - | - | - | - | - | Ansöker | - |
| Motioner | Yttrar sig | Registrerar | - | - | - | - | - | - | Skriver | - |
| Revision | Granskas | Underlag | Underlag | - | - | - | Äger | - | - | - |
| Val | Valberedningens förslag | Registrerar | - | - | - | - | Valberedningens förslag | Äger | Röstar | - |
| Kommunikation | Godkänner | Äger | - | - | - | Äger (socialt) | - | - | Mottar | Mottar |
| Störningar | Beslutar | Dokumenterar | - | - | - | - | - | - | Anmäler | Anmäler |
| Renovering | Beslutar | Dokumenterar | - | Bedömer | - | - | - | - | Ansöker | - |
| Bokning | - | - | - | - | - | Äger | - | - | Bokar | Bokar |
