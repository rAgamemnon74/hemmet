# Analys: Valberedningsrollen i Hemmet

## Rollens natur — en föreningsroll, inte en styrelseroll

Valberedningen är **inte** en del av styrelsen. Den är en **föreningsroll** — vald av stämman, oberoende av styrelsen, med uppdrag att förbereda val av styrelseledamöter, suppleanter och revisorer till nästa stämma.

Detta gör valberedningen till en ny rolltyp i systemet. Nuvarande roller är antingen:
- **Styrelseroller** (BOARD_*) — valda av stämman, sitter i styrelsen
- **Revisorsroll** (AUDITOR) — vald av stämman, granskar styrelsen
- **Medlemsroller** (MEMBER, RESIDENT) — grundroller

Valberedningen är varken styrelse, revisor eller vanlig medlem. Den behöver en **egen rollkategori** med egna permissions och eget arbetsflöde.

---

## Nuläge i Hemmet

### Vad som finns

| Element | Status | Detalj |
|---------|:------:|--------|
| Roll i enum | Saknas | Ingen `NOMINATING_COMMITTEE` i Role-enum |
| Agenda-punkt | Finns | "Val av valberedning" i ANNUAL_MEETING_TEMPLATE (rad 43), men utan `specialType` |
| Nomineringsmodell | Saknas | Ingen datamodell för nomineringar eller kandidater |
| Nomineringsflöde | Saknas | Ingen UI, inget API, inget arbetsflöde |
| BrfRules-konfiguration | Delvis | `secretBallotOnDemand`, `tieBreakerLotteryForElection` finns men är oanvända |
| Valresultat | Saknas | Ingen koppling mellan stämmobeslut och automatisk rolltilldelning |
| Permissions | Saknas | Inga nomineringsspecifika permissions |
| Testanvändare | Saknas | Ingen valberedningsanvändare i seed-data |

### Vad som inte finns

- Ingen roll, ingen permission, inget API, ingen UI, ingen datamodell
- Dagordningspunkten "Val av valberedning" är ren text utan funktionalitet
- Dagordningspunkterna "Val av styrelseledamöter", "Val av styrelsesuppleanter", "Val av revisor" är också ren text
- Inget sätt att registrera kandidater, ta emot nomineringar eller presentera förslag

---

## Valberedningens uppdrag enligt lag och stadgar

### LEF 6 kap. 5 § (Lag om ekonomiska föreningar)

Stadgarna ska ange hur styrelseledamöter och revisorer utses. Valberedningen är det normala instrumentet.

### Typiskt uppdrag

1. **Ta emot nomineringar** — från medlemmar och via egen research
2. **Kontakta kandidater** — förhöra sig om intresse och kompetens
3. **Bedöma kompetens** — matcha kandidater mot behov (ekonomi, teknik, juridik etc.)
4. **Presentera förslag** — skriftligt förslag till stämman med motivering per kandidat
5. **Presentera vid stämman** — muntlig presentation och svar på frågor
6. **Oberoende** — ska inte styras av sittande styrelse

### Roller att föreslå

| Position | Antal (typiskt) | BrfRules-koppling |
|----------|:--------------:|-------------------|
| Ordförande | 1 | — |
| Styrelseledamöter | 2-6 | `minBoardMembers`, `maxBoardMembers` |
| Styrelsesuppleanter | 0-3 | `maxBoardSubstitutes` |
| Revisor | 1-2 | `minAuditors`, `maxAuditors` |
| Revisorssuppleant | 0-2 | `maxAuditorSubstitutes` |

---

## Föreslagen rolltyp: Föreningsroller

Valberedningen bör införas som en ny **föreningsrollkategori** som skiljer sig från styrelseroller:

```
// Nuvarande
ADMIN, BOARD_*, AUDITOR, MEMBER, RESIDENT

// Nytt — föreningsroller
NOMINATING_COMMITTEE         // Valberedningsledamot
NOMINATING_COMMITTEE_CHAIR   // Valberedningens sammankallande
```

### Varför en ny kategori?

| Aspekt | Styrelseroll | Föreningsroll (valberedning) |
|--------|:------------:|:----------------------------:|
| Vald av | Stämman | Stämman |
| Ansvarar inför | Stämman | Stämman |
| Del av styrelsen | JA | NEJ |
| Tillgång till styrelsedata | Full | Begränsad |
| Mandatperiod | Stadgebestämd | Till nästa stämma |
| Oberoendekrav | Nej | JA — ska inte styras av styrelsen |

---

## Föreslagen datamodell

### NominationPeriod (valberedningsperiod)

```
NominationPeriod {
  id
  annualMeetingId       // Vilket årsmöte detta gäller
  committeeMembers[]    // Valberedningens ledamöter (userId[])
  chairpersonId         // Sammankallande (userId)
  opensAt               // När nomineringsperioden öppnar
  closesAt              // Sista dag för nomineringar
  presentedAt           // När förslaget presenterades
  status                // PLANNING, OPEN, CLOSED, PRESENTED
  createdAt
  updatedAt
}
```

### Nomination (nominering)

```
Nomination {
  id
  nominationPeriodId    // Koppling till period
  position              // CHAIRPERSON, BOARD_MEMBER, BOARD_SUBSTITUTE, AUDITOR, AUDITOR_SUBSTITUTE
  candidateId           // userId (befintlig medlem)
  candidateName         // Namn (om extern/ej medlem)
  nominatedById         // Vem som nominerade (userId, nullable = valberedningen själv)
  source                // COMMITTEE, MEMBER_NOMINATION, SELF_NOMINATION
  status                // PROPOSED, ACCEPTED, DECLINED, WITHDRAWN, ELECTED, NOT_ELECTED
  motivation            // Valberedningens motivering
  competenceAreas       // Kompetensområden: ekonomi, teknik, juridik, kommunikation etc.
  acceptedAt            // När kandidaten accepterade
  declinedReason        // Anledning om avböjd
  createdAt
  updatedAt
}
```

### MemberNomination (medlemsförslag till valberedningen)

```
MemberNomination {
  id
  nominationPeriodId
  submittedById         // Medlemmen som föreslår
  candidateId           // Vem som föreslås (userId, nullable)
  candidateName         // Fritext om personen ej är medlem
  position              // Vilken post
  motivation            // Varför denna kandidat
  createdAt
}
```

---

## Föreslagen permissions

```
// Valberedningsspecifika
nomination:view          // Se valberedningens förslag (alla medlemmar inför stämma)
nomination:submit        // Lämna nomineringsförslag som medlem
nomination:manage        // Hantera nomineringar (valberedningen)
nomination:finalize      // Låsa och presentera slutligt förslag (sammankallande)

// Befintliga som bör utökas
annual:view              // Redan finns — valberedningens förslag visas här
member:view_registry     // Valberedningen behöver se medlemslista för att kontakta kandidater
```

### Rollmatris

| Permission | NOMINATING_COMMITTEE | NOMINATING_COMMITTEE_CHAIR | MEMBER | BOARD_* |
|-----------|:---:|:---:|:---:|:---:|
| nomination:view | Y | Y | Y (efter presentation) | Y |
| nomination:submit | — | — | Y | Y |
| nomination:manage | Y | Y | — | — |
| nomination:finalize | — | Y | — | — |
| member:view_registry | Y (begränsat) | Y (begränsat) | — | Y |
| annual:view | Y | Y | Y | Y |

**Kritiskt:** Valberedningen bör se namn, lägenhet och kontaktuppgifter men **INTE** personnummer, ekonomisk data eller styrelseprotokoll.

---

## Föreslagt arbetsflöde

### Fas 1: Valberedningen tillsätts (vid stämman)

```
Stämma → Dagordningspunkt "Val av valberedning"
       → Kandidater föreslås och röstas om
       → Beslut: X, Y, Z valda, X som sammankallande
       → System: NominationPeriod skapas, roller tilldelas
```

**Systemstöd:**
- Ny `specialType: "ELECT_NOMINATING_COMMITTEE"` på dagordningspunkten
- I mötesadmin: välj ledamöter och sammankallande (liknande ELECT_ADJUSTERS)
- Vid beslut: automatisk rolltilldelning av NOMINATING_COMMITTEE/CHAIR

### Fas 2: Nomineringsperiod (mellan stämmor)

```
Valberedning → Öppnar nomineringsperiod
            → Medlemmar kan lämna förslag via systemet
            → Valberedningen kontaktar kandidater
            → Kandidater accepterar/avböjer
            → Valberedningen sammanställer förslag
```

**Systemstöd:**
- Nomineringssida för medlemmar: `/medlem/nomineringar`
- Valberedningens arbetsyta: `/valberedning` (eller liknande)
- Formulär för medlemsförslag med position och motivering
- Kandidathantering: status per kandidat (kontaktad, accepterat, avböjt)
- Kompetensmatris: vilka kompetenser styrelsen behöver vs vad kandidaterna har

### Fas 3: Presentation (inför stämman)

```
Valberedning → Låser förslaget
            → Förslaget publiceras till alla medlemmar (ingår i kallelse)
            → Presenteras vid stämman
```

**Systemstöd:**
- Sammankallande låser förslaget (`nomination:finalize`)
- Förslaget syns under årsmötessidan och i kallelsen
- Presentationsvy i mötesadmin/presentation under relevanta dagordningspunkter

### Fas 4: Val vid stämman

```
Stämma → Dagordningspunkt "Val av styrelseledamöter"
       → Valberedningens förslag presenteras
       → Motförslag från medlemmar kan lämnas
       → Omröstning (acklamation eller sluten)
       → Beslut: roller tilldelas automatiskt
```

**Systemstöd:**
- Dagordningspunkterna "Val av styrelseledamöter", "Val av styrelsesuppleanter", "Val av revisor" får `specialType: "BOARD_ELECTION"`, `"SUBSTITUTE_ELECTION"`, `"AUDITOR_ELECTION"`
- Valberedningens förslag visas automatiskt
- Motförslag kan registreras
- Vid beslut: automatisk rolltilldelning + borttagning av gamla roller

---

## Koppling till BrfRules

### Befintliga regler som påverkar valberedningen

| Regel | Värde (default) | Relevans |
|-------|----------------|----------|
| `minBoardMembers` | 3 | Valberedningen måste föreslå minst så många |
| `maxBoardMembers` | 7 | Max antal att föreslå |
| `maxBoardSubstitutes` | 3 | Max suppleanter |
| `allowExternalBoardMembers` | 1 | Får föreslå externa ledamöter |
| `minAuditors` | 1 | Minst en revisor |
| `maxAuditors` | 2 | Max revisorer |
| `maxAuditorSubstitutes` | 2 | Max revisorssuppleanter |
| `requireAuthorizedAuditor` | false | Krav på auktoriserad revisor |
| `secretBallotOnDemand` | true | Sluten omröstning vid personval om någon begär |
| `tieBreakerLotteryForElection` | true | Lottning vid lika röstetal vid val |

### Nya regler att lägga till

```
BrfRules {
  // Valberedning
  nominatingCommitteeSize       Int     @default(3)    // Antal ledamöter
  nominationPeriodWeeks         Int     @default(8)    // Hur länge nomineringsperioden är öppen
  nominationDeadlineBeforeMeeting Int   @default(4)    // Veckor före stämma som förslag ska vara klart
  allowSelfNomination           Boolean @default(true) // Kan medlemmar nominera sig själva
  allowMemberNomination         Boolean @default(true) // Kan medlemmar nominera andra
}
```

---

## Agenda-integration

### Nuvarande dagordning (årsmöte) — relevanta punkter

```
§15  Val av styrelseledamöter          → Bör visa valberedningens förslag
§16  Val av styrelsesuppleanter        → Bör visa valberedningens förslag
§17  Val av revisor                    → Bör visa valberedningens förslag
§18  Val av valberedning               → Tillsätta nästa valberedning
```

### Föreslagna specialTypes

| Dagordningspunkt | Nuvarande specialType | Föreslagen specialType |
|-----------------|:--------------------:|:----------------------:|
| Val av styrelseledamöter | Ingen | `BOARD_ELECTION` |
| Val av styrelsesuppleanter | Ingen | `SUBSTITUTE_ELECTION` |
| Val av revisor | Ingen | `AUDITOR_ELECTION` |
| Val av valberedning | Ingen | `ELECT_NOMINATING_COMMITTEE` |

---

## Oberoendekrav och integritet

### Valberedningen ska vara oberoende

Systemet bör aktivt stödja oberoendet:

1. **Separerat datautrymme** — valberedningen ser INTE styrelseprotokoll, interna kommentarer, ekonomi eller utläggsdetaljer
2. **Egen kommunikationskanal** — valberedningen kan kommunicera med medlemmar utan att gå via styrelsen
3. **Skyddat nomineringsregister** — styrelsen kan inte se vilka nomineringar som inkommit förrän valberedningen publicerar sitt förslag
4. **Loggning** — all åtkomst till medlemsdata av valberedningen loggas (GDPR)

### Dataminimering

Valberedningen behöver:
- Namn, lägenhet, kontaktuppgifter (e-post/telefon) — för att kontakta kandidater
- Nuvarande styrelsesammansättning — för att veta vilka poster som är lediga
- Medlemslängd — för att identifiera potentiella kandidater

Valberedningen behöver INTE:
- Personnummer
- Ekonomisk data
- Styrelsens interna diskussioner
- Utlägg eller attestflöden
- Felanmälningar

---

## Jämförelse med andra föreningsroller

| Aspekt | Valberedare | Revisor | Styrelseledamot | Medlem |
|--------|:-----------:|:-------:|:---------------:|:------:|
| Vald av stämman | Y | Y | Y | — |
| Del av styrelsen | NEJ | NEJ | JA | NEJ |
| Oberoende krav | JA | JA | NEJ | — |
| Mandatperiod | Till nästa stämma | Stadgebestämd | Stadgebestämd | Permanent |
| Se medlemsregister | Begränsat | Begränsat | Fullt | Lagstadgat minimum |
| Se styrelseprotokoll | NEJ | JA | JA | NEJ |
| Se ekonomi | NEJ | JA | JA | NEJ |
| Specifikt arbetsflöde | Nomineringar | Revision | Förvaltning | — |

---

## Prioriterad åtgärdslista

| Prio | Funktion | Varför |
|------|----------|--------|
| 1 | **Roll + permissions i systemet** | Grundförutsättning — lägg till NOMINATING_COMMITTEE/CHAIR i enum och permissions |
| 2 | **Datamodell** (NominationPeriod, Nomination, MemberNomination) | Kärnan i arbetsflödet |
| 3 | **Dagordnings-specialTypes** för val-punkter | Koppla valberedningens förslag till stämmans dagordning |
| 4 | **BrfRules-konfiguration** | Antal ledamöter, nomineringsperiod, deadlines |
| 5 | **Nomineringssida för medlemmar** | Medlemmar ska kunna föreslå kandidater |
| 6 | **Valberedningens arbetsyta** | Kandidathantering, kompetensmatris, förslagsdokument |
| 7 | **Stämmo-integration** | Visa förslag i mötesadmin/presentation, registrera valresultat |
| 8 | **Automatisk rolltilldelning** | Vid stämmobeslut: tilldela nya roller, ta bort gamla |
| 9 | **Oberoendebegränsningar** | Separera valberedningens data från styrelsens |
