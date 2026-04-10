# Hemmet — Gapanalys: Stadgar vs Plattform

## Analyserade stadgar

| Förening | Datum | Paragraf | Källa |
|---|---|---|---|
| BRF Becknabergha | 2016-11-17 | 58 §§ | Nya-Stadgar-Becknabergha-2016-11-17.pdf |
| BRF Kungsklippan i Stockholm | 2023-06-30 | 57 §§ | Stadgar-702001-2253_final.pdf |

---

## Gap per kategori

### 1. Föreningsstämma

#### 1.1 Kallelseregler (§16 Becknabergha)
**Status:** Saknas  
**Krav:** Kallelse tidigast 6 veckor, senast 2 veckor före stämma. Utfärdas genom utdelning + anslag/hemsida. Ska innehålla uppgift om vilka ärenden som behandlas.  
**Vad vi har:** Mötesstatus DRAFT → SCHEDULED men ingen kallelsehantering med tidsvalidering eller distributionslogg.  
**Behov:**
- Kallelsefunktion kopplad till möte med automatisk kontroll av tidsregler
- Distributionslogg (vem som fått kallelse, när, hur)
- Generera kallelsedokument med dagordning
- Varning om kallelse skickas för tidigt/sent

#### 1.2 Rösträtt — en röst per medlem (§17 Becknabergha)
**Status:** Delvis  
**Krav:** Varje medlem har en röst. Gemensamt ägande = en röst. Flera lägenheter = en röst.  
**Vad vi har:** VoterRegistry listar alla medlemmar separat.  
**Behov:**
- Validering i röstlängd: samägare av samma bostadsrätt ska bara ge en röst
- Medlem med flera lägenheter ska bara ha en röst
- Röstlängden bör visa "röstberättigade" (en per bostadsrätt) inte "alla medlemmar"

#### 1.3 Ombudsbegränsningar (§18 Becknabergha)
**Status:** Delvis  
**Krav:**
- Fullmakt skriftlig, underskriven, daterad, i original, gäller max 1 år
- Ombud får företräda högst 2 medlemmar
- Begränsad krets: annan medlem, make/maka/sambo, föräldrar, syskon, myndigt barn, närstående som sammanbor, god man
- Juridisk person: legal ställföreträdare med registreringsbevis max 3 månader gammalt

**Vad vi har:** MeetingProxy med MEMBER/EXTERNAL typ, men ingen validering av krets, antal eller giltighetstid.  
**Behov:**
- Max 2 fullmakter per ombud (validering)
- Fält för relation till medlemmen (make, syskon, etc.)
- Giltighetstid på fullmakt (max 1 år)
- Flagga/krav: fullmakt i original uppvisad
- För juridisk person: krav på registreringsbevis med datumvalidering (max 3 mån)

#### 1.4 Röstningsregler (§19 Becknabergha)
**Status:** Delvis  
**Krav:**
- Beslut = mer än hälften av avgivna röster
- Blankröst = inte avgiven röst (påverkar majoritet)
- Lika röstetal: ordförandens röst avgör (beslut) / lottning (val)
- Sluten omröstning: stämmoordförande eller stämma kan besluta; obligatorisk vid personval på begäran

**Vad vi har:** DecisionMethod med ACCLAMATION/ROLL_CALL/COUNTED. Inget stöd för blankröst-exkludering eller lottning.  
**Behov:**
- Blankröst som val i röstning (exkluderas vid majoritetsberäkning)
- Automatisk majoritetsberäkning (hälften av avgivna exkl blanka)
- Markering öppen/sluten omröstning
- Lottningsnotering vid lika röstetal

#### 1.5 Jävshantering (§20 Becknabergha)
**Status:** Saknas helt  
**Krav:** Medlem får inte rösta i fråga om talan mot sig själv, befrielse från skadeståndsansvar, eller där väsentligt intresse strider mot föreningens.  
**Behov:**
- Möjlighet att markera jävig medlem per dagordningspunkt/beslut
- Jävig medlem exkluderas från röstlängd för den punkten

#### 1.6 Dagordningsmall-avvikelser (§15 Becknabergha)
**Status:** Nästan rätt, små avvikelser  
**Becknaberghas ordning skiljer sig:**
- Punkt 2: "Godkännande av dagordningen" (före val av ordförande)
- Punkt 3: "Val av stämmoordförande"
- Punkt 4: "Anmälan av stämmoordförandens val av protokollförare" (ordföranden väljer, inte stämman)
- Punkt 14: "Val av antal ledamöter och suppleanter" (separat punkt)

**Behov:**
- Dagordningsmallar bör vara konfigurerbara per förening, inte hårdkodade
- Alternativt: möjlighet att välja mellan standardmallar (HSB, Riksbyggen, etc.)

---

### 2. Medlemskap

#### 2.1 Överlåtelsekrav (§2 Becknabergha)
**Status:** Delvis  
**Krav:** Medlemsansökan ska åtföljas av styrkt kopia av överlåtelsehandling (underskriven av köpare+säljare, med lägenhet och pris).  
**Vad vi har:** MembershipApplication med transferFrom/transferPrice men inget krav på bifogat dokument.  
**Behov:**
- Obligatoriskt dokumentuppladdning vid ansökan (överlåtelsehandling)
- Validering att dokumentet finns innan styrelsen kan godkänna

#### 2.2 Bosättningskrav (§5 Becknabergha)
**Status:** Saknas  
**Krav:** Förvärvaren ska bosätta sig i lägenheten; annars kan medlemskap vägras.  
**Behov:**
- Fält i MembershipApplication: "Avser att bosätta sig i lägenheten" (ja/nej)
- Styrelsens kontroll vid granskning

#### 2.3 Diskrimineringsförbud (§4 Becknabergha)
**Status:** Saknas  
**Krav:** Medlemskap får inte vägras pga kön, etnicitet, religion, funktionshinder, etc.  
**Behov:**
- Checklista/påminnelse vid avslag: "Har du säkerställt att avslaget inte grundas på diskriminerande skäl?"
- Eventuellt obligatorisk avbockning

#### 2.4 Andelsägande — samborelation (§6 Becknabergha)
**Status:** Delvis  
**Krav:** Andelsägande bara tillåtet för makar, registrerade partners, sambor (sambolagen).  
**Vad vi har:** ApartmentOwnership tillåter fritt samägande utan relationsvalidering.  
**Behov:**
- Fält för relation mellan samägare
- Varning om samägare inte uppfyller stadgekravet (konfigurerbart per förening)

---

### 3. Avgifter och ekonomi

#### 3.1 Överlåtelse- och pantsättningsavgift (§9 Becknabergha)
**Status:** Saknas helt  
**Krav:**
- Överlåtelseavgift max 2,5% av prisbasbelopp (betalas av förvärvare)
- Pantsättningsavgift max 1% av prisbasbelopp (betalas av pantsättare)
- Andrahandsavgift max 10%/år av prisbasbelopp

**Behov:**
- Avgiftsberäkning kopplad till prisbasbelopp (uppdateras årligen)
- Avgiftshantering vid överlåtelse
- Pantsättningsregister

#### 3.2 Årsavgift — balkong/uteplats-tillägg (§8 Becknabergha)
**Status:** Delvis  
**Krav:** Balkong: +max 2% av prisbasbelopp. Uteplats/altan: +max 1%.  
**Vad vi har:** Apartment.balcony/patio finns, men ingen koppling till avgiftsberäkning.  
**Behov:**
- Avgiftsberäkningsmodul baserad på andelstal + tillägg

#### 3.3 Underhållsfond (§54 Becknabergha)
**Status:** Saknas  
**Krav:** Fond för yttre underhåll, årlig avsättning minst 0,3% av taxeringsvärde.  
**Behov:**
- Underhållsplanering med fondberäkning
- Koppling till Building.taxationValue

---

### 4. Styrelsearbete

#### 4.1 Beslutförhet (§27 Becknabergha)
**Status:** Saknas  
**Krav:** Beslutför när >hälften av alla ledamöter närvarande. Inte fulltalig: röster för > 1/3 av hela antalet.  
**Vad vi har:** Närvaroregistrering men ingen automatisk beslutförhetskontroll.  
**Behov:**
- Beräkna beslutförhet baserat på antal registrerade ledamöter vs närvarande
- Varning om mötet inte är beslutfört
- Validering vid beslut

#### 4.2 Protokolltillgänglighet (§26 Becknabergha)
**Status:** Delvis  
**Krav:** Styrelsens protokoll tillgängliga ENDAST för ledamöter, suppleanter och revisorer. Ska föras i nummerföljd.  
**Vad vi har:** Protokoll kopplat till möte, åtkomstkontroll via roller.  
**Behov:**
- Automatisk numrering av protokoll
- Explicit åtkomstkontroll (inte bara "meeting:view" utan specifik protokollåtkomst)

#### 4.3 Stämmoprotokoll — tidskrav (§23 Becknabergha)
**Status:** Saknas  
**Krav:** Protokollet ska senast inom 3 veckor hållas tillgängligt. Röstlängden ska ingå/bifogas.  
**Behov:**
- Påminnelse/varning om protokoll inte publicerats inom 3 veckor
- Automatisk bilägning av röstlängd till protokoll

---

### 5. Boendefrågor

#### 5.1 Andrahandsuthyrning (§47 Becknabergha)
**Status:** Saknas helt  
**Krav:** Skriftligt samtycke av styrelsen. Ansökan med skäl, tid, person.  
**Behov:**
- Ansökningsmodell: SubletApplication (lägenhet, anledning, period, andrahandshyresgäst)
- Godkännandeflöde (styrelsen)
- Register över pågående andrahandsuthyrningar
- Avgiftsberäkning (max 10%/år av prisbasbelopp)

#### 5.2 Tillstånd för lägenhetsförändring (§43 Becknabergha)
**Status:** Saknas  
**Krav:** Tillstånd krävs för bärande konstruktion, ledningsändringar, väsentliga förändringar.  
**Behov:**
- Ansökningsmodell: RenovationPermit
- Kategorier: bärande konstruktion, ledningar, övrigt
- Godkännandeflöde
- Krav på fackmannamässigt utförande (notering)

#### 5.3 Ordningsregler (§45, §56 Becknabergha)
**Status:** Delvis  
**Krav:** Föreningen kan utfärda ordningsregler. Medlem ska rätta sig efter dem.  
**Vad vi har:** BrfSettings.ordningsreglerUrl (länk till dokument)  
**Behov:** Eventuellt digital ordningsregelhantering, men URL-länk räcker troligen.

---

### 6. Övrigt

#### 6.1 Valberedning (§22 Becknabergha)
**Status:** Saknas  
**Krav:** Valberedning väljs på stämma, lämnar förslag till personval och arvoden.  
**Behov:**
- Valberednings-roll (NOMINATION_COMMITTEE)
- Möjlighet att dokumentera valberedningens förslag inför stämma

#### 6.2 Stadgeändring — kvalificerad majoritet (§57 Becknabergha)
**Status:** Saknas  
**Krav:** Stadgeändring kräver antingen alla röstberättigade ense, eller beslut på två stämmor (första >50%, andra ≥2/3).  
**Behov:**
- Markering av beslut som "stadgeändring" → automatisk majoritetskontroll
- Stöd för att koppla beslut över två stämmor

#### 6.3 Firmateckning (§29 Becknabergha)
**Status:** Delvis  
**Krav:** Minst två ledamöter tillsammans.  
**Vad vi har:** BrfSettings.signatoryRule (text)  
**Behov:** Eventuellt digital signeringsvalidering, men textfält räcker troligen.

---

## Sammanfattning per prioritet

### Hög prioritet (juridiskt kritiska)
1. Ombudsvalidering (max 2, krets, giltighetstid)
2. Rösträttsvalidering (en per medlem, samägande)
3. Kallelseregler med tidsvalidering
4. Beslutförhetskontroll vid styrelsemöten
5. Andrahandsuthyrningshantering

### Medium prioritet (funktionellt viktiga)
6. Överlåtelseavgifter och pantsättning
7. Jävshantering
8. Underhållsplanering/fond
9. Lägenhetsförändringstillstånd
10. Protokollnumrering och tidskrav

### Lägre prioritet (nice-to-have)
11. Konfigurerbara dagordningsmallar
12. Valberedningsmodul
13. Bosättningskrav-fält
14. Diskrimineringschecklista vid avslag
15. Stadgeändrings-stöd (kvalificerad majoritet)

---

## Analys 2: BRF Kungsklippan i Stockholm (702001-2253)

Sveriges största BRF. Registrerad hos Bolagsverket 2023-06-30. 57 paragrafer.

### Nya gap identifierade (inte funna i Becknabergha)

#### N1. §2 Medlemskap — ägarandel max 105% (Kungsklippan-specifikt)
**Krav:** Den som förvärvat en andel i bostadsrätt, förvärvet innebär make/sambo, samtliga andelsinnehav uppgår till mest 105%.
**Jämförelse:** Becknabergha har 100% (via sambolagen). Kungsklippan tillåter upp till 105% — troligen avrundningsmarginal.
**Behov:** Konfigurerbar max-ägandegräns per förening (inte hårdkodad 100%).

#### N2. §7 Insats — attraktivt och tryggt boende
**Krav:** Föreningens ändamål inkluderar "attraktivt och tryggt boende med god servicenivå".
**Kommentar:** Informativt, ingen plattformsförändring krävs.

#### N3. §13 Motioner — tidsregler
**Krav:** Motioner ska anmälas senast den 15 januari eller inom den senare tidpunkt styrelsen beslutar. Svar på motioner med ekonomisk konsekvens ska beredas. Styrelsen kan ställa krav på viss form.
**Jämförelse:** Becknabergha: 1 februari.
**Behov:** Konfigurerbar motionsdeadline per förening/stämma.

#### N4. §14 Extra stämma — 1/10 av röstberättigade
**Krav:** Extra stämma ska även hållas om revisor eller minst 1/10 av samtliga röstberättigade begär det.
**Stöds:** Informativt — ingen plattformsvalidering krävs men bra att dokumentera.

#### N5. §15 Dagordning — annan ordning än Becknabergha
**Kungsklippans ordning:**
1. Öppnande
2. Val av stämmoordförande
3. Anmälan av stämmoordförandens val av protokollförare
4. Godkännande av dagordning
5. Val av en justerare tillika rösträknare
6. Fråga om stämman blivit stadgeenligt utlyst
7. Fastställande av röstlängd
8. Föredragning av styrelsens årsredovisning
9. Föredragning av revisorernas berättelse
10. Beslut om fastställande av resultat- och balansräkning
11. Beslut om resultatdisposition
12. Beslut om ansvarsfrihet för styrelsen
13. Beslut om arvoden åt styrelsen och revisorer samt valb. för nästkommande verksamhetsår
14. Beslut om antal ledamöter och suppleanter
15. Val av styrelseledamöter och suppleanter
16. Val av revisorer och revisorssuppleant
17. Val av valberedning
18. Av styrelsen till stämman hänskjutna frågor samt av föreningsmedlem anmält ärende
19. Avslutande

**Jämförelse med Becknabergha:** Nästan identisk men med några skillnader:
- Kungsklippan: punkt 5 = "en justerare" (inte två)
- Becknabergha: punkt 2 = godkännande av dagordning FÖRE val av ordförande
**Bekräftar behovet:** Konfigurerbara dagordningsmallar.

#### N6. §16 Kallelse — utökade krav
**Krav:**
- Kallelse tidigast 6 veckor, senast 2 veckor (samma som Becknabergha)
- Kallelsen ska skickas med post till varje medlem vars postadress är känd för föreningen
- Ska innehålla tid och plats
- Specifika regler för vilka handlingar som ska bifogas/tillgängliggöras

**Nytt jämfört med Becknabergha:**
- Kallelse ska skickas per post (inte bara utdelning)
- Ordinarie stämma: årsredovisning, revisionsberättelse ska hållas tillgängliga
- Stämman ska behandla frågor om juridisk person eller annan fastighet
- Om ombud uppgivit annan postadress ska kallelse skickas dit

**Behov:** Distributionsmetod (post/e-post/utdelning) per medlem konfigurerbart.

#### N7. §18 Ombud — snävare krets, en (1) medlem
**Krav:** Ombud får företräda högst en (1) medlem (Becknabergha: två).
Samma krets: medlem, make/maka/sambo, föräldrar, syskon, myndigt barn, närstående, god man.
**Bekräftar behovet:** Max-antal ombud per person måste vara konfigurerbart.

#### N8. §24 Styrelse — minst tre, högst nio + fyra suppleanter
**Krav:** Minst 3, högst 9 ledamöter + högst 4 suppleanter. (Becknabergha: 3-7 + 3 suppl.)
Ledamot kan utses 1 eller 2 år. Suppleant ska inte vara ledamot som är till närmast stämmans val.
En ledamot eller suppleant kan vara icke-medlem (familjehushåll bosatt i huset). Stämma kan dock välja en (1) ledamot som inte uppfyller kravet.
En ledamot utses till sammankallade i valberedningen.
**Behov:** Konfigurerbart min/max för styrelseledamöter och suppleanter.

#### N9. §27 Beslutförhet — samma regel men tydligare
**Krav:** Styrelsen är beslutför om antalet närvarande ledamöter överstiger hälften. Suppleanter tjänstgör i den ordning ordförande bestämmer eller enligt arbetsordning.
**Kommentar:** Samma princip som Becknabergha. Bekräftar behovet av beslutförhetskontroll.

#### N10. §33 Revisor — krav på auktoriserad
**Krav:** Minst en revisor ska vara auktoriserad revisor eller auktoriserad revisionsbyrå.
**Jämförelse:** Becknabergha: behöver INTE vara auktoriserad.
**Behov:** Konfigurerbart krav på revisorskompetens per förening.

#### N11. §37a Ersättning för intraffad skada
**Krav:** Ersättningsskyldighet genom bostadsrättshavarens/familjens/gästers försumlighet, även personskada.
**Kommentar:** Koppling till försäkring — informativt.

#### N12. §54 Framtida underhåll — underhållsplan obligatorisk
**Krav:** Styrelsen ska upprätta och årligen följa upp en underhållsplan för genomförande av underhållsåtgärder.
**Jämförelse:** Becknabergha: fond med 0,3% av taxeringsvärde ELLER underhållsplan.
Kungsklippan: underhållsplan OBLIGATORISK.
**Bekräftar behovet:** Underhållsplanering bör byggas.

#### N13. §55 Besiktning
**Krav:** Styrelsen ska varje år besiktiga föreningens egendom. Revisorerna kallas till sådan besiktning.
**Saknas helt:** Ingen besiktningshantering i plattformen.
**Behov:** Besiktningslogg kopplad till byggnad/fastighet, med kallelse till revisorer.

---

### Jämförelsetabell: Becknabergha vs Kungsklippan

| Regel | Becknabergha | Kungsklippan | Plattformsbehov |
|---|---|---|---|
| **Styrelseledamöter** | 3-7 + 3 suppl | 3-9 + 4 suppl | Konfigurerbart |
| **Ombud max** | 2 medlemmar | 1 medlem | Konfigurerbart per förening |
| **Ombudskrets** | Identisk | Identisk | Implementera |
| **Motionsdeadline** | 1 feb | 15 jan | Konfigurerbart |
| **Justerare** | 2 st | 1 st | Konfigurerbart antal |
| **Revisor krav** | Behöver ej vara aukt. | Minst en auktoriserad | Konfigurerbart |
| **Kallelsetid** | 2-6 veckor | 2-6 veckor | Samma |
| **Kallelsemetod** | Utdelning + anslag | Post + anslag | Konfigurerbart |
| **Dagordning** | Dagordning före ordförande | Ordförande före dagordning | Mallar per förening |
| **Samägande** | Makar/sambo (sambolagen) | Max 105% | Konfigurerbar gräns |
| **Underhåll** | Fond 0,3% av tax.värde | Obligatorisk underhållsplan | Underhållsmodul |
| **Besiktning** | Ej specificerat | Årlig, revisorer kallas | Besiktningslogg |
| **Andrahand** | Styrelsens skriftliga samtycke | Styrelsens skriftliga tillstånd + Hyresnämnden | Ansökningsflöde |
| **Stadgeändring** | Alla ense, eller 2 stämmor (50%+67%) | Identiskt | Samma |

---

## Uppdaterad prioritering (efter 2 föreningar)

### Hög prioritet — bekräftade av BÅDA föreningar
1. **Ombudsvalidering** — max antal konfigurerbart (1 eller 2), krets, giltighetstid
2. **Rösträttsvalidering** — en per medlem oavsett lägenheter/samägande
3. **Kallelseregler** — tidsvalidering (2-6v), distributionslogg
4. **Beslutförhetskontroll** — automatisk vid styrelsemöten
5. **Andrahandsuthyrning** — ansökningsflöde med styrelsegodkännande
6. **Konfigurerbara dagordningsmallar** — ordningen varierar mellan föreningar

### Medium prioritet — identifierade i en eller båda
7. Jävshantering (båda)
8. Underhållsplanering (Kungsklippan: obligatorisk, Becknabergha: fond)
9. Överlåtelse-/pantsättningsavgifter (båda, samma tak)
10. Lägenhetsförändringstillstånd (båda)
11. Besiktningslogg (Kungsklippan)
12. Protokollnumrering och tidskrav 3v (båda)

### Lägre prioritet
13. Konfigurerbar max-ägandegräns (100% vs 105%)
14. Konfigurerbart min/max styrelseledamöter
15. Krav på auktoriserad revisor (konfigurerbart)
16. Valberedningsmodul (båda)
17. Bosättningskrav-fält
18. Diskrimineringschecklista vid avslag

### Ny insikt: Konfigurationsdriven plattform
Analysen av två föreningar visar att **många regler varierar** mellan föreningar. Plattformen behöver ett **föreningsinställningar-lager** där regler konfigureras:

```
Förslag: BrfRules-modell eller utökat BrfSettings
- maxProxiesPerPerson: number (1 eller 2)
- motionDeadlineMonth: number
- motionDeadlineDay: number  
- adjustersCount: number (1 eller 2)
- minBoardMembers: number
- maxBoardMembers: number
- maxSubstitutes: number
- requireAuthorizedAuditor: boolean
- maxOwnershipPercent: number (100 eller 105)
- maintenanceFundRule: 'PERCENTAGE' | 'PLAN'
- maintenanceFundPercent: number (0.3)
- noticePeriodMinWeeks: number (2)
- noticePeriodMaxWeeks: number (6)
- protocolDeadlineWeeks: number (3)
- calendarYear: boolean
- allowSublet: boolean
- subletRequiresApproval: boolean
```

---

## Noteringar för framtida analyser

Två föreningar analyserade. Rekommenderade ytterligare stadgar:

- **HSB-förening** — HSB normalstadgar (2011/2023) används av tusentals föreningar
- **Riksbyggen-förening** — liknande standardstadgar
- **SBC-förening** — annan standardmodell
- **Liten förening** (<20 lgh) — ofta enklare stadgar
- **Förening med lokaler** — kommersiella hyresgäster, andra regler
- **Nyproduktion** — byggherrestadgar med övergångsbestämmelser

Mönster hittills:
- Grundstrukturen är densamma (bostadsrättslagen styr)
- Detaljerna varierar: antal, tidsfrister, krav
- Plattformen måste vara **regelkonfigurerbar**, inte hårdkodad
