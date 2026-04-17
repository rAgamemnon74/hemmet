# Valberedningsrollen i Hemmet — status och kvarvarande luckor

## Rollens natur — en föreningsroll, inte en styrelseroll

Valberedningen är **inte** en del av styrelsen. Den är en **föreningsroll** — vald av stämman, oberoende av styrelsen, med uppdrag att förbereda val av styrelseledamöter, suppleanter och revisorer till nästa stämma.

Rollerna tillhör en egen kategori i systemet, skild från både styrelseroller och revisorsroller:

| Aspekt | Styrelseroll | Föreningsroll (valberedning) |
|--------|:------------:|:----------------------------:|
| Vald av | Stämman | Stämman |
| Ansvarar inför | Stämman | Stämman |
| Del av styrelsen | JA | NEJ |
| Tillgång till styrelsedata | Full | Begränsad |
| Mandatperiod | Stadgebestämd | Till nästa stämma |
| Oberoendekrav | Nej | JA — ska inte styras av styrelsen |

---

## Implementerad funktionalitet

### Roller och permissions

`NOMINATING_COMMITTEE` och `NOMINATING_COMMITTEE_CHAIR` finns i Role-enumet. Fyra dedikerade permissions finns i `src/lib/permissions.ts`:

| Permission | Beskrivning |
|-----------|-------------|
| `nomination:view` | Se valberedningens förslag (alla medlemmar inför stämma) |
| `nomination:submit` | Lämna nomineringsförslag som medlem |
| `nomination:manage` | Hantera nomineringar (valberedningen) |
| `nomination:finalize` | Låsa och presentera slutligt förslag (sammankallande) |

### Datamodell

Tre modeller i `prisma/schema.prisma`:

**NominationPeriod** — representerar en valberedningsperiod kopplad till ett räkenskapsår:
- `status`: PLANNING, OPEN, CLOSED, PRESENTED
- `fiscalYear`, `openAt`, `closeAt` för tidshantering

**Nomination** — enskild nominering hanterad av valberedningen:
- `position`: CHAIRPERSON, BOARD_MEMBER, BOARD_SUBSTITUTE, AUDITOR, AUDITOR_SUBSTITUTE
- `status`: CONTACTED, ACCEPTED, DECLINED, WITHDRAWN, ELECTED, NOT_ELECTED
- `motivation` och `competenceAreas` för att dokumentera valberedningens bedömning

**MemberNomination** — förslag från medlemmar under öppen nomineringsperiod.

### BrfRules-konfiguration

Följande valberedningsregler finns i BrfRules-modellen:

| Regel | Default | Beskrivning |
|-------|---------|-------------|
| `nominatingCommitteeSize` | 3 | Antal ledamöter i valberedningen |
| `nominationPeriodWeeks` | 8 | Hur länge nomineringsperioden är öppen |
| `nominationDeadlineBeforeMeeting` | 4 | Veckor före stämma som förslaget ska vara klart |
| `allowSelfNomination` | true | Kan medlemmar nominera sig själva |
| `allowMemberNomination` | true | Kan medlemmar nominera andra |

### Dagordningsintegration

Fyra specialTypes i AgendaItemType kopplar valberedningens arbete till stämmans dagordning:

| Dagordningspunkt | specialType |
|-----------------|:-----------:|
| Val av styrelseledamöter | `BOARD_ELECTION` |
| Val av styrelsesuppleanter | `SUBSTITUTE_ELECTION` |
| Val av revisor | `AUDITOR_ELECTION` |
| Val av valberedning | `ELECT_NOMINATING_COMMITTEE` |

### API och UI

- **tRPC-router:** `src/server/trpc/routers/nomination.ts` med full CRUD för nomineringsperioder, nomineringar och medlemsförslag.
- **Medlemssida:** `src/app/(dashboard)/medlem/nomineringar/` där medlemmar kan se öppna nomineringsperioder och lämna förslag.

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

## Arbetsflöde

### Fas 1: Valberedningen tillsätts (vid stämman)

```
Stämma → Dagordningspunkt "Val av valberedning" (ELECT_NOMINATING_COMMITTEE)
       → Kandidater föreslås och röstas om
       → Beslut: X, Y, Z valda, X som sammankallande
```

### Fas 2: Nomineringsperiod (mellan stämmor)

```
Valberedning → Skapar NominationPeriod (status: PLANNING)
            → Öppnar nomineringsperiod (status: OPEN)
            → Medlemmar lämnar förslag via /medlem/nomineringar
            → Valberedningen kontaktar kandidater (status: CONTACTED)
            → Kandidater accepterar/avböjer (status: ACCEPTED/DECLINED)
            → Valberedningen stänger perioden (status: CLOSED)
```

### Fas 3: Presentation (inför stämman)

```
Valberedning → Sammankallande låser förslaget (nomination:finalize)
            → Förslaget publiceras (status: PRESENTED)
            → Förslaget syns för alla medlemmar
```

### Fas 4: Val vid stämman

```
Stämma → Dagordningspunkt BOARD_ELECTION / SUBSTITUTE_ELECTION / AUDITOR_ELECTION
       → Valberedningens förslag presenteras
       → Motförslag kan registreras
       → Omröstning (acklamation eller sluten)
       → Valda kandidater markeras ELECTED / NOT_ELECTED
```

---

## Koppling till befintliga BrfRules

Följande befintliga regler påverkar valberedningens arbete:

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

## Kvarvarande luckor

| Prio | Funktion | Beskrivning |
|------|----------|-------------|
| 1 | **Automatisk rolltilldelning** | Vid stämmobeslut bör systemet automatiskt tilldela nya roller och ta bort gamla. Idag måste detta göras manuellt. |
| 2 | **Oberoendebegränsningar** | Valberedningen saknar idag tekniska begränsningar mot känslig styrelsedata. Permissions bör begränsa åtkomst till protokoll, ekonomi och utlägg. |
| 3 | **Kommunikationsmallar** | Mallar för att kontakta kandidater (inbjudan, påminnelse, bekräftelse) saknas. Valberedningen behöver ett standardiserat sätt att nå ut. |
| 4 | **Innehavarspårning** | Systemet visar inte vilka poster som är lediga eller vilka som sitter idag. Valberedningen behöver en överblick av nuvarande styrelsesammansättning och mandatperioder. |
