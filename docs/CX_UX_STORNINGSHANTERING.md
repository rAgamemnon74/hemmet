# CX/UX-analys: Störningshantering — alla perspektiv

## Aktörer

En störning involverar upp till 9 aktörer. Varje aktör har olika behov, rädslor och rättigheter.

| Aktör | Relation | Systemroll idag |
|-------|----------|:---------------:|
| **Anmälaren** | Boende som störs | Kan anmäla |
| **Den som stör** | Boende som orsakar störningen | Syns inte i systemet |
| **Lägenhetsägaren** | Bostadsrättsinnehavare (kan vara annan person vid andrahand) | Syns inte |
| **Styrelsen** | Ansvarig att hantera | Kan ändra status |
| **Fastighetsansvarig** | Kan delegeras undersökning | Samma som styrelse |
| **Ordförande** | Undertecknar varningar, eskalerar | Samma som styrelse |
| **Extern förvaltare/störningsjour** | Delegerad första kontakt (stora BRF:er) | Inte i systemet |
| **Polisen** | Akuta situationer | Inte i systemet |
| **Hyresnämnden** | Sista instans vid förverkande | Inte i systemet |

---

## Kontaktvägar: Vem kontaktar vem?

### Anmälarens kontaktväg per situation

Anmälaren behöver inte veta vem som hanterar — systemet ska visa rätt väg.

| Situation | Första kontakt | Via systemet? | Varför |
|-----------|:-------------:|:-------------:|--------|
| Buller en enskild gång | Grannen direkt (knacka på) | Nej | Informellt löser det sig oftast |
| Upprepat buller | Styrelsen | **Ja — anmälan** | Behöver dokumenteras, mönster |
| Rök/lukt | Styrelsen | **Ja — anmälan** | Kan vara hälsorisk |
| Hot eller våld | **Polisen 112** | Nej — ring först | Akut fara, styrelsen hanterar ALDRIG våld |
| Pågående fest kl 03 | Polisen 114 + styrelsen efteråt | **Ja — anmälan i efterhand** | Polisen agerar direkt, styrelsen dokumenterar |
| Misstanke om brott | Polisen | Nej | Inte styrelsens uppgift att utreda brott |
| Skadegörelse gemensamma utrymmen | Fastighetsansvarig + styrelsen | **Ja — felanmälan + störning** | Åtgärd + dokumentation |
| Andrahandshyresgäst stör upprepat | Styrelsen → ägaren | **Ja — anmälan** | Föreningen kontaktar ägaren, inte hyresgästen |

### Intern routing: Vem hanterar inom föreningen?

| BRF-storlek | Första hanterare | Eskalering | Extern delegation |
|-------------|:----------------:|:----------:|:-----------------:|
| Liten (5-30 lgh) | Ordförande direkt | Hela styrelsen | Sällan |
| Medelstor (30-100) | Ordförande delegerar till ledamot/fastighetsansvarig | Ordförande → styrelsen | Vid behov |
| Stor (100+) | Extern störningsjour / förvaltare | Förvaltare → ordförande → styrelsen | Standard |

### Systemets routing-logik

```
Anmälan inkommer
    ↓
Automatiskt:
    1. Koppla till targetApartmentId → resolve ägare via ApartmentOwnership
    2. Kolla SubletApplication aktiv? → flagga isSubletSituation
    3. Kolla BrfRules/föreningsstorlek → bestäm routing:
        → Liten BRF: notifiera ordförande direkt
        → Medel/stor: notifiera tilldelad handläggare (assignedToId)
        → Om ingen handläggare: notifiera ordförande som fallback
    4. Kvittens till anmälare: "Din anmälan har mottagits"
    5. Logga anmälan i ActivityLog + PersonalDataAccessLog
```

---

## Länkning: Störning → Lägenhet → Ägare

### Nuvarande modell

```
DisturbanceCase
    → targetApartmentId (vilken lägenhet som stör)
    → reportedById (vem som anmäler)
```

### Komplett modell (föreslagen)

```
DisturbanceCase
    → targetApartmentId → Apartment
        → ApartmentOwnership (active: true) → userId → Ägaren
        → SubletApplication (status: ACTIVE) → applicantId → Hyresvärden
                                              → tenantName → Hyresgästen
    → reportedById → User → Anmälaren
    → reportedByApartmentId → Vilken lägenhet anmälaren bor i
    → assignedToId → Handläggare (styrelsemedlem/förvaltare)
```

Systemet bör automatiskt resolva:
- **Vem äger den störande lägenheten** — den som får tillsägelser
- **Är det andrahand** — extra information till styrelsen
- **Vem anmäler** — för mönsteranalys (se nedan)
- **Var bor anmälaren** — validerar att störningen är relevant (grannlägenhet, inte andra sidan huset)

---

## Anmälarmissbruk och mönsteranalys

### Varför logga anmälaren?

Anonymitet skyddar anmälaren — men systemet MÅSTE internt veta vem som anmäler. Anledningar:

| Syfte | Beskrivning |
|-------|-------------|
| **Missbruk/trakasseri** | En boende som systematiskt anmäler samma granne utan grund — kan vara trakasseri |
| **Mönsterigenkänning** | Flera anmälare mot samma lägenhet = starkt underlag. En anmälare mot alla = misstänkt |
| **Jävskontroll** | Styrelsemedlem anmäler sin granne som hen har konflikt med |
| **GDPR-krav** | Registerförteckning kräver spårbarhet av vem som initierar behandling |
| **Vittnesmål** | Om ärendet når Hyresnämnden behöver anmälaren kunna styrka sin berättelse |

### Mönster systemet bör bevaka

| Mönster | Indikerar | Systemåtgärd |
|---------|-----------|-------------|
| **5+ anmälningar från samma person på 6 månader** | Potentiellt missbruk eller reellt problem | Flagga för styrelsen: "Frekvent anmälare — granska mönstret" |
| **3+ anmälningar mot samma lägenhet från olika anmälare** | Starkt underlag — verkligt problem | Automatisk eskalering: "Flera oberoende anmälningar" |
| **1 anmälare → flera olika lägenheter** | Potentiellt missbruk/överkänslighet | Flagga: "Anmälaren har anmält X olika lägenheter" |
| **Anmälare = styrelsemedlem → grannen** | Potentiell intressekonflikt | Jävsvarning vid styrelsens behandling |
| **Anmälan direkt efter avslag** (andrahand, renovering etc.) | Potentiell hämndaktion | Flagga: "Anmälan inkommen kort efter avslag på annat ärende" |

### Datamodell: Anmälarspårning

```
DisturbanceCase {
  // Befintliga fält...
  
  reportedById          String    // Alltid sparat — aldrig anonymt internt
  reportedByApartmentId String?   // Anmälarens lägenhet
  anonymousReport       Boolean   // true = styrelsen ser anmälaren, den anklagade ser INTE
}
```

**Princip:** Anonymitet gäller gentemot den anklagade, ALDRIG gentemot styrelsen. Styrelsen måste alltid kunna se vem som anmäler — annars kan de inte bedöma trovärdighet eller upptäcka missbruk.

### Styrelsens vy: Anmälarprofil

Vid varje ärende bör styrelsen se:
```
Anmälare: [Namn] (lgh 1001)
    Totalt antal anmälningar: 7
    Senaste 6 mån: 3 anmälningar
    Anmält lägenheter: 2001 (4 ggr), 3001 (2 ggr), 2002 (1 gång)
    ⚠ Frekvent anmälare — granska mönstret
```

---

## Perspektiv 1: Anmälaren

### Resa

```
Störning uppstår (buller kl 23, rök, hotfullt beteende)
    ↓
Första instinkt: prata med grannen själv?
    → Obehagligt, risker för konflikt
    → Kanske redan försökt utan resultat
    ↓
Anmäla till styrelsen
    → Vill: att någon lyssnar, att det händer något, att det slutar
    → Räds: repressalier, att bli sedd som "besvärlig", att inget händer
    ↓
Väntar på respons
    → Hör ingenting (idag)
    → Kollar manuellt om status ändrats
    ↓
Antingen löst... eller ger upp
```

### Behov som systemet inte tillgodoser

| Behov | Status idag | Åtgärd |
|-------|:----------:|--------|
| **Anonymitetsval** | Saknas — namn visas för styrelse | Alternativ: anonym anmälan (styrelsen ser, den anklagade ser inte vem) |
| **Kvittens/bekräftelse** | Bara redirect till sidan, ingen toast | Toast + notifiering: "Din anmälan har mottagits" |
| **Statusuppdateringar** | Saknas — ingen notis vid ändring | Notifiera vid varje statussteg |
| **Tidslinje** | Saknas i UI | Visa tidslinje: anmäld → noterad → åtgärd → löst |
| **Möjlighet att komplettera** | Saknas — kan inte lägga till info | Kommentarsfunktion på ärendet |
| **Dokumentation av mönster** | Saknas — varje anmälan står ensam | Koppla tidigare anmälningar om samma störning |
| **Akut-knapp** | Saknas | Tydligt: "Vid akut fara — ring 112. Denna anmälan är för icke-akuta störningar." |

---

## Perspektiv 2: Den som stör

### Resa

```
Vet kanske inte om att de stör
    ↓
Får höra det av:
    → Grannen direkt (bästa fallet)
    → Brev från styrelsen (formellt, skrämmande)
    → Aldrig (värsta fallet — ärendet eskaleras utan deras vetskap)
    ↓
Behöver:
    → Veta VAD som störde (specifikt, inte vagt)
    → Veta NÄR (datum/tid)
    → Få chans att förklara (kanske har medicinska skäl, barn, etc.)
    → Veta vilka regler som gäller
    → Tid att korrigera
    ↓
Antingen korrigerar... eller det eskalerar
```

### Behov som systemet inte tillgodoser

| Behov | Status idag | Åtgärd |
|-------|:----------:|--------|
| **Bli informerad** | Inte alls — den anklagade finns inte i systemet | Notifiering till lägenhetsägare (inte nödvändigtvis den som stör, om andrahand) |
| **Höras** | Saknas — ingen möjlighet att svara | Svarsformulär eller kommentarsfunktion |
| **Se anklagelsen** | Saknas | Visa (anonymiserad) beskrivning: "Anmälan om buller den 15 mars kl 23:00" |
| **Regler** | Saknas i kontexten | Länk till föreningens ordningsregler vid notifiering |
| **Rättslig process** | Saknas — ingen formell varning i systemet | Formell varningsbrev-mall med laglig grund (BrfL 7:9) |

**GDPR-aspekt:** Den anklagade har rätt att veta att uppgifter om dem behandlas (GDPR Art. 14). Men anmälarens identitet behöver inte avslöjas om det finns anledning att skydda den (berättigat intresse).

---

## Perspektiv 3: Ansvarskedjan vid andrahand

### Grundprincip

Föreningen har **ingen direkt relation** med andrahandshyresgästen. All kommunikation går via lägenhetsägaren (medlemmen). Hyresgästen (RESIDENT) har inga rättigheter i störningsprocessen gentemot föreningen.

### Ansvarskedjan

```
Störning uppstår
    ↓
Vem stör? → Andrahandshyresgäst
    ↓
Föreningen har INGEN avtalsrelation med hyresgästen
    → Kan inte kontakta hyresgästen direkt
    → Kan inte varna hyresgästen
    → Kan inte säga upp hyresgästen
    ↓
Systemet identifierar:
    → targetApartmentId → ApartmentOwnership → ägare (medlemmen)
    → Aktiv SubletApplication? → JA → andrahandssituation
    ↓
ÄGAREN informeras av föreningen:
    "Din lägenhet (2001) har anmälts för störning.
     Lägenheten är uthyrd i andrahand.
     Som bostadsrättsinnehavare är du ansvarig för
     din hyresgästs beteende (BrfL 7 kap. 9 §)."
    ↓
Ägarens ansvar:
    → Kontakta sin hyresgäst
    → Säkerställa att störningen upphör
    → Eventuellt säga upp andrahandskontraktet
    → Rapportera tillbaka till styrelsen
    ↓
Om ägaren INTE agerar (eller störningen fortsätter):
    → Eskalering riktas mot ÄGAREN, inte hyresgästen
    → Tillsägelse → varning → styrelsebeslut → förverkande
    → Det är ägarens bostadsrätt som förverkas
    ↓
Konsekvens vid förverkande:
    → Ägaren förlorar bostadsrätten
    → Andrahandskontraktet faller automatiskt
    → Hyresgästen måste flytta
```

### Tre scenarier

| Scenario | Vem stör | Vem kontaktas | Vem riskerar |
|----------|---------|:-------------:|:------------:|
| Ägare bor själv | Ägaren | Ägaren | Ägaren |
| Andrahand — hyresgäst stör | Hyresgästen | **Ägaren** | **Ägaren** |
| Andrahand — ägare stör (t.ex. renoverar nattetid) | Ägaren | Ägaren | Ägaren |

### Systemstöd som krävs

| Steg | Systemlogik |
|------|-------------|
| 1. Identifiera andrahand | `targetApartmentId` → kolla `SubletApplication` med status ACTIVE |
| 2. Hitta ägare | `ApartmentOwnership` med `active: true` → `userId` |
| 3. Flagga i ärende | `isSubletSituation: true` + visa ägare + hyresgästens namn |
| 4. Informera ägare | Notifiering till ägaren med explicit ansvarstext |
| 5. Tidsgräns | Ägaren får X veckor att hantera hyresgästen |
| 6. Eskalering | Om ingen åtgärd → varning till ägaren, inte hyresgästen |

### Behov som systemet inte tillgodoser

| Behov | Status idag | Åtgärd |
|-------|:----------:|--------|
| **Automatisk andrahandsdetektering** | Saknas — `isSubletSituation` finns men sätts inte automatiskt | Vid ärendeskapande: kolla om aktiv SubletApplication finns för targetApartment |
| **Koppla till rätt ägare** | targetApartmentId finns men ingen resolution till ägare | Resolve ägare via ApartmentOwnership och visa i ärendet |
| **Explicit ansvarstext till ägare** | Saknas — generisk notifiering | Mall: "Du är ansvarig för din hyresgästs beteende enligt BrfL 7:9" |
| **Skilja ägare-stör vs hyresgäst-stör** | Ingen åtskillnad | Fält: "Vem orsakar störningen? (ägare/hyresgäst/okänt)" |
| **Spåra ägarens respons** | Saknas | Fält: ägaren har vidtagit åtgärd (datum, beskrivning) |
| **Koppling till andrahandsavtal** | Saknas | Länk till SubletApplication — styrelsen kan se avtalstid, hyresgästuppgifter |

---

## Perspektiv 4: Styrelsens hantering

### Laglig process (BrfL 7 kap. 9 § + 18 §)

Styrelsen måste följa en **progressiv eskaleringsmodell**. Att hoppa över steg gör beslutet sårbart vid överklagande.

```
Steg 1: ANMÄLAN INKOMMER
    → Styrelsen bekräftar mottagande
    → Utredning: vad hände, hur allvarligt, vittnesmål?
    ↓
Steg 2: MUNTLIG TILLSÄGELSE
    → Informellt samtal med den som stör
    → Dokumenteras i systemet (datum, vem, vad sades)
    ↓
Steg 3: SKRIFTLIG TILLSÄGELSE (Första varningen)
    → Formellt brev med:
      - Beskrivning av störningen
      - Hänvisning till ordningsregler/stadgar
      - Begäran att störningen upphör
      - Tidsram för korrigering
    → Skickas till LÄGENHETSÄGAREN (inte hyresgästen)
    ↓
Steg 4: SKRIFTLIG VARNING (Andra varningen)
    → Om störningen fortsätter efter tillsägelse
    → Formellt brev med:
      - Hänvisning till BrfL 7:9 och 7:18
      - Uttrycklig varning om att bostadsrätten kan förverkas
      - Ny tidsram
    ↓
Steg 5: STYRELSEBESLUT
    → Styrelsen beslutar formellt om åtgärd
    → Protokollförs med beslutsunderlag
    → Jäv: om styrelsemedlem är berörd
    ↓
Steg 6: UPPSÄGNING / FÖRVERKANDE
    → Formell uppsägning av bostadsrätten (BrfL 7:18)
    → Hyresnämnden prövar
    → Hela dokumentationskedjan är bevis
```

### Vad styrelsen behöver från systemet

| Behov | Status idag | Åtgärd |
|-------|:----------:|--------|
| **Steg-för-steg-guide** | Statusknappar utan förklaring | Wizard: "Steg 2 av 6 — Skriftlig tillsägelse. Ladda ner brevmall." |
| **Brevmallar** | Saknas helt | Mallar: tillsägelsebrev, varningsbrev, uppsägning (med lagliga formuleringar) |
| **Tidsgränser per steg** | Saknas | Konfigurerbart: "X veckor mellan tillsägelse och varning" |
| **Koppling till styrelsebeslut** | Saknas — beslut frikopplade | Koppla Decision → DisturbanceCase |
| **Dokumentationspaket för Hyresnämnden** | Saknas | Exportera: alla steg, datum, brev, vittnesmål som PDF |
| **Jävskontroll** | Inte integrerad | Varna om styrelsemedlem bor i berörd lägenhet |

---

## Perspektiv 5: Delegering

### Vem gör vad?

| Steg | Ansvarig | Delegeras ofta till | Systemstöd |
|------|----------|--------------------:|:----------:|
| Mottaga anmälan | Styrelsen | Automatiskt (system) | OK |
| Utreda | Ordförande | Fastighetsansvarig | Saknas — ingen tilldelning |
| Muntlig tillsägelse | Ordförande | Valfri ledamot | Saknas — ingen registrering |
| Skriftlig tillsägelse | Ordförande | Sekreterare (skriver brevet) | Saknas — inga brevmallar |
| Styrelsebeslut | Styrelsen | — | OK (via mötessystem) |
| Kontakt med polis | Ordförande | — | Saknas |
| Kontakt med Hyresnämnden | Ordförande | Jurist (extern) | Saknas |

---

## Perspektiv 6: Polisen

### När polisen involveras

| Situation | Polis? | Styrelsens roll |
|-----------|:------:|-----------------|
| Buller efter 22:00 | Polisen kan agera vid pågående störning | Styrelsen dokumenterar, agerar formellt efteråt |
| Hot eller våld | **Ja — omedelbart** | Styrelsen hanterar aldrig våld själv |
| Misstanke om brott (droger, stöld) | Ja | Styrelsen kan anmäla, inte utreda |
| Upprepat buller dagtid | Nej — inte polisens sak | Styrelsens eskalering |
| Röklukt | Nej | Styrelsens ordningsregler |

### Systemstöd

- **Akutbanner** överst på störningsanmälan: "Vid akut fara — ring 112. Denna anmälan är för icke-akuta störningar."
- **Fält för polisanmälan**: ärendenummer om anmälan gjorts
- **Koppling till dokumentation**: polisanmälan stärker underlag vid eskalering till Hyresnämnden

---

## Perspektiv 7: Hyresnämnden

Sista instans. Prövar om bostadsrätten ska förverkas.

### Vad Hyresnämnden kräver

1. **Dokumenterad störning** — vad, när, hur ofta
2. **Bevis på att boende informerats** — tillsägelse + varning med datum
3. **Bevis på att tid givits** — rimlig tid att korrigera (normalt 1-3 mån)
4. **Proportionalitet** — åtgärden står i proportion till störningen
5. **Styrelsebeslutet** — protokoll med beslut om förverkande

### Systemstöd som krävs

- **Komplett tidslinje** med datum, dokument och ansvariga per steg
- **Exportera ärendeakt** som PDF: alla steg, brev, beslut, polisanmälan
- **Automatisk kontroll**: "Har alla steg genomförts? Har rimlig tid givits?"

---

## Vad systemet saknar — sammanfattning

### Anmälarens perspektiv
1. Anonymitetsval vid anmälan
2. Akutbanner ("Ring 112 vid fara")
3. Kommentarsfunktion på ärendet
4. Statusnotifieringar
5. Tidslinje-vy

### Den anklagades perspektiv
6. Notifiering till lägenhetsägare
7. Möjlighet att yttra sig / svara
8. Visa ordningsregler i kontext
9. GDPR-korrekt informering (Art. 14)

### Styrelsens perspektiv
10. Brevmallar (tillsägelse, varning, uppsägning)
11. Steg-för-steg-guide med tidsgränser
12. Koppling störningsärende → styrelsebeslut (Decision)
13. Koppling till lägenhetsägare + andrahandsstatus
14. Delegering/tilldelning till specifik ledamot
15. Exportera ärendeakt för Hyresnämnden

### Övrigt
16. Polisanmälan-fält (ärendenummer)
17. Vittnesmål-stöd (andra grannar)
18. Mönsteridentifiering (upprepade anmälningar → automatisk eskalering)
19. Jävskontroll (styrelsemedlem bor i berörd lägenhet)

---

## Föreslagen DisturbanceCase-utökning

```
DisturbanceCase {
  // Befintliga fält...
  
  // Nytt: anonymitet och parter
  anonymousReport      Boolean @default(false)  // Anmälaren vill vara anonym
  targetOwnerId        String?                  // Lägenhetsägare (via ApartmentOwnership)
  isSubletSituation    Boolean @default(false)  // Andrahandshyresgäst stör
  
  // Nytt: polisanmälan
  policeReportNumber   String?                  // Om polisanmälan gjorts
  policeReportDate     DateTime?
  
  // Nytt: formella steg
  verbalWarningAt      DateTime?                // Muntlig tillsägelse
  verbalWarningBy      String?
  verbalWarningNotes   String?  @db.Text
  
  // Nytt: kopplingar
  decisionId           String?                  // Styrelsebeslut
  assignedToId         String?                  // Delegerad handläggare
  
  // Nytt: den anklagades svar
  respondentNotifiedAt DateTime?                // När den anklagade informerades
  respondentResponse   String?  @db.Text        // Eventuellt svar
  respondentRespondedAt DateTime?
}
```

---

## Föreslagen eskaleringsmodell i systemet

```
REPORTED (anmälan inkommer)
    → Automatisk kvittens till anmälare
    → Styrelsen notifieras
    ↓
ACKNOWLEDGED (styrelsen noterar)
    → Utredning inleds
    → Tilldelad handläggare (delegering)
    ↓
VERBAL_WARNING (muntlig tillsägelse)
    → Registrera: datum, av vem, vad sades
    → Informera lägenhetsägare
    → Lägenhetsägare kan yttra sig
    → Tidsgräns: 2-4 veckor
    ↓
FIRST_WARNING (skriftlig tillsägelse)
    → Generera brev från mall
    → Skicka till lägenhetsägare
    → Registrera: datum, brev skickat
    → Tidsgräns: 4-8 veckor
    ↓
SECOND_WARNING (formell varning)
    → Generera varningsbrev med laglig grund (BrfL 7:9, 7:18)
    → Uttrycklig varning om förverkande
    → Tidsgräns: 4-8 veckor
    ↓
BOARD_REVIEW (styrelsebeslut)
    → Ärendet på dagordningen
    → Koppling till Decision
    → Protokollförs
    ↓
RESOLVED (löst)           eller       ESCALATED (eskalerat)
    → Störningen upphörde                → Hyresnämnden
    → Anmälare notifieras               → Exportera ärendeakt
    → Ärende stängs                     → Juristkontakt

CLOSED (stängt — slutgiltig status)
```

---

## Prioriterad UX-förbättringslista

| Prio | Förbättring | Perspektiv | Komplexitet |
|------|------------|-----------|:-----------:|
| 1 | **Akutbanner** + polisanmälan-fält | Anmälare, Polis | Låg |
| 2 | **Tidslinje-vy** på ärendedetalj | Anmälare, Styrelse | Medel |
| 3 | **Anonymitetsval** vid anmälan | Anmälare | Låg |
| 4 | **Notifiering till anmälare** vid statusändring | Anmälare | Låg |
| 5 | **Delegering/tilldelning** till handläggare | Styrelse | Låg |
| 6 | **Informera lägenhetsägare** med ordningsregler + yttranderätt | Den anklagade | Medel |
| 7 | **Brevmallar** (tillsägelse, varning, uppsägning) | Styrelse | Medel |
| 8 | **Koppling till styrelsebeslut** (Decision) | Styrelse | Låg |
| 9 | **Exportera ärendeakt** som PDF | Hyresnämnden | Medel |
| 10 | **Jävskontroll** — styrelsemedlem i berörd lägenhet | Styrelse | Medel |
