# E-postintegration — designanalys

## Problemformulering

Styrelsens e-post är den mest kaotiska delen av föreningsarbetet. Verkligheten i en typisk BRF:

- **Delad Gmail/Outlook** som vidarebefordras till ordförandens privata mail
- Ingen vet vem som svarat på vad — trådar försvinner i personliga inkorgar
- Vid styrelsebyte går historiken förlorad
- E-post från entreprenörer, myndigheter och medlemmar är helt frikopplad från ärenden i Hemmet
- Kassören får fakturor per e-post som manuellt ska kopplas till utgifter
- Fastighetsansvarig mejlar entreprenörer om besiktningar och offerter utan spårbarhet

**Grundproblemet:** e-post är styrelsearbetets primära kommunikationskanal men lever helt utanför ärendesystemet.

---

## Designprinciper

### 1. Rollen äger posten, inte personen
E-posthistorik tillhör ordföranderollen, kassörsrollen, förvaltarrollen — inte Anna, Erik eller Mohammed. Vid styrelsebyte följer allt med automatiskt.

### 2. Tratt, inte e-postklient
Hemmet ersätter inte Gmail. Det är en **strukturerad brygga** mellan ostrukturerad e-post och strukturerade ärenden. E-post kommer in → blir ärende eller kopplas till befintligt → svar går ut med kontext.

### 3. Opt-in per förening
E-postintegration kräver aktiv konfiguration. Föreningar som inte vill/kan pekar inte om sin e-post.

### 4. Allt loggas
E-post som passerar systemet loggas i ActivityLog. GDPR gäller — gallring av persondata i e-post följer samma regler som övriga ärenden.

### 5. Fungerar utan integration
All funktionalitet i Hemmet ska fungera utan e-postintegration. E-post är en *förlängning* av ärendesystemet, inte ett beroende.

---

## Tre rollbaserade inkorgar

| Inkorg | Typisk adress | Ägande roller | Typiska avsändare |
|--------|--------------|---------------|-------------------|
| **Styrelsen** | styrelsen@brfexempel.se | Ordförande, sekreterare, alla styrelseledamöter | Medlemmar, myndigheter, HSB/Riksbyggen, juridik |
| **Förvaltning** | forvaltning@brfexempel.se | Fastighetsansvarig, ordförande | Entreprenörer, besiktningsfirmor, kommunen |
| **Ekonomi** | ekonomi@brfexempel.se | Kassör, ordförande | Leverantörer (fakturor), bank, försäkringsbolag, revisorer |

### Synlighetsregler

- **Styrelsemedlem:** ser Styrelsen-inkorgen
- **Fastighetsansvarig:** ser Förvaltning + Styrelsen
- **Kassör:** ser Ekonomi + Styrelsen
- **Ordförande/Admin:** ser alla tre
- **Övriga roller:** ser ingenting — e-post är ett styrelseinstrument

### Rollbyte

När en person lämnar en styrelseroll (t.ex. kassör avgår):
- Personen förlorar åtkomst till Ekonomi-inkorgen
- Ny kassör ser hela historiken
- Pågående trådar behåller sin koppling till ärenden
- ActivityLog visar vem som svarade när (historisk korrekthet bevaras)

---

## Ärendekoppling — kärnan i integrationen

### Flöde: Inkommande e-post → Ärende

```
E-post anländer till förvaltning@brfexempel.se
    ↓
Hemmet tar emot via webhook (Postmark/Resend)
    ↓
Visas i Förvaltnings-inkorgen med:
  - Avsändare, ämne, brödtext, bilagor
  - Smart förslag: "Liknar felanmälan" / "Offert från känd entreprenör"
    ↓
Styrelsemedlem väljer åtgärd:
  ┌─ [Skapa ärende] → Ny felanmälan/offert/etc. med e-post som första post
  ├─ [Koppla till ärende] → Välj befintligt ärende → e-post läggs i tidslinje
  ├─ [Svara] → Svar skickas från förvaltning@brfexempel.se med ärendekontext
  └─ [Arkivera] → Markeras som hanterad utan ärende
```

### Flöde: Ärende → Utgående e-post

```
Styrelsemedlem öppnar ärende (t.ex. pågående besiktning)
    ↓
Ser tidigare e-posttråd i ärendets tidslinje
    ↓
Skriver svar direkt i ärendet
    ↓
Svaret skickas som e-post från förvaltning@brfexempel.se
    ↓
Reply-to sätts till unikt ärendebaserat alias:
  forvaltning+ärende_abc123@brfexempel.se
    ↓
Mottagarens svar matchar automatiskt tillbaka till rätt ärende
```

### Matchning: E-post → Befintligt ärende

Automatisk koppling i prioritetsordning:

1. **Reply-to alias** — `inkorg+ärendeId@domän.se` → exakt match
2. **In-Reply-To/References header** — svar i samma tråd som redan kopplats
3. **Känd avsändare** — entreprenör/leverantör kopplad till pågående ärende
4. **Manuell** — styrelsemedlem väljer ärende eller skapar nytt

### Ärendetyper som kan skapas från e-post

| Ärendekategori | Typisk trigger | Inkorg |
|---|---|---|
| **DamageReport** (Felanmälan) | Medlem mailar om läcka | Styrelsen/Förvaltning |
| **RenovationApplication** (Renovering) | Medlem frågar om tillstånd | Styrelsen |
| **SubletApplication** (Andrahand) | Medlem vill hyra ut | Styrelsen |
| **Expense** (Utgift/Faktura) | Leverantör skickar faktura som PDF | Ekonomi |
| **Inspection** (Besiktning) | Besiktningsfirma skickar rapport | Förvaltning |
| **DisturbanceCase** (Störning) | Medlem rapporterar störning | Styrelsen |
| **Suggestion** (Förslag) | Medlem har idé | Styrelsen |
| **Task** (Uppgift) | Internt: "kan vi fixa X?" | Alla |
| **TransferCase** (Överlåtelse) | Mäklare kontaktar föreningen | Styrelsen/Ekonomi |
| **Motion** (Motion) | Medlem skickar in motion per mail | Styrelsen |

---

## Datamodell

### Nya modeller

```prisma
// ============================================================
// E-POSTINTEGRATION
// ============================================================

model EmailMailbox {
  id            String    @id @default(cuid())
  name          String    // "Styrelsen", "Förvaltning", "Ekonomi"
  slug          String    @unique // "styrelsen", "forvaltning", "ekonomi"
  emailAddress  String    @unique // "styrelsen@brfexempel.se"
  provider      String    // "resend", "postmark"
  webhookSecret String?   // Verifiering av inkommande webhooks
  enabled       Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  messages EmailMessage[]
  accessRules EmailMailboxAccess[]
}

model EmailMailboxAccess {
  id         String @id @default(cuid())
  mailboxId  String
  role       Role   // Vilken roll som har åtkomst

  mailbox EmailMailbox @relation(fields: [mailboxId], references: [id], onDelete: Cascade)

  @@unique([mailboxId, role])
}

model EmailMessage {
  id            String    @id @default(cuid())
  mailboxId     String
  direction     String    // "inbound" | "outbound"
  
  // E-postdata
  fromAddress   String
  fromName      String?
  toAddresses   String    // JSON array av mottagare
  ccAddresses   String?   // JSON array
  subject       String
  bodyText      String?   @db.Text
  bodyHtml      String?   @db.Text
  
  // Trådning
  messageId     String    @unique // RFC 2822 Message-ID
  inReplyTo     String?   // Föregående meddelande
  references    String?   @db.Text // Hela referenskedjan
  threadId      String?   // Internt tråd-ID (grupperar konversationen)
  
  // Ärendekoppling
  entityType    String?   // "DamageReport", "Expense", etc.
  entityId      String?   // ID på kopplat ärende
  
  // Status
  status        EmailMessageStatus @default(UNREAD)
  archivedAt    DateTime?
  
  // Metadata
  rawPayload    Json?     // Fullständig webhook-payload för felsökning
  sentById      String?   // Vem i styrelsen som skickade (för outbound)
  receivedAt    DateTime  // Tidpunkt e-posten mottogs/skickades
  createdAt     DateTime  @default(now())

  mailbox  EmailMailbox @relation(fields: [mailboxId], references: [id], onDelete: Cascade)
  sentBy   User?        @relation("EmailsSent", fields: [sentById], references: [id])
  files    EmailAttachment[]

  @@index([mailboxId, status])
  @@index([entityType, entityId])
  @@index([threadId])
  @@index([fromAddress])
}

enum EmailMessageStatus {
  UNREAD
  READ
  LINKED      // Kopplad till ärende
  ARCHIVED
  SPAM
}

model EmailAttachment {
  id          String @id @default(cuid())
  messageId   String
  fileName    String
  mimeType    String
  fileSize    Int
  storagePath String // Sökväg i dokumentarkivet
  documentId  String? // Koppling till Document-modellen om sparad

  message EmailMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId])
}
```

### Relation till befintliga modeller

```
EmailMessage.entityType + entityId  ←→  DamageReport, Expense, Inspection, ...
EmailMessage.sentById               ←→  User (styrelsemedlem som svarade)
EmailAttachment.documentId          ←→  Document (om bilaga sparas i arkivet)
EmailMailboxAccess.role              ←→  Role (RBAC)
```

Samma polymorfiska mönster som `Attachment` och `ActivityLog` — inga foreign key-begränsningar, flexibel koppling via `entityType + entityId`.

---

## Teknisk arkitektur

### E-postleverantör

**Rekommendation: Resend** (redan konfigurerad i `.env.example`)

- Stödjer både sändning och mottagning (inbound webhooks)
- Enkel DNS-setup (MX + SPF + DKIM)
- Webhook för inkommande e-post med full metadata
- Prisvärd för BRF-volymer (låg trafik, ~50–200 mail/mån)

**Alternativ:** Postmark (starkare leveransgaranti, dyrare)

### Inkommande e-post (webhook)

```
Avsändare → MX-pekning → Resend → Webhook POST → /api/email/inbound
```

**Webhook-endpoint:** `/api/email/inbound`

Verifiering:
1. Kontrollera webhook-signatur (Resend HMAC)
2. Matcha mottagaradress → rätt `EmailMailbox`
3. Parsea e-postinnehåll (from, to, cc, subject, body, bilagor)
4. Spara bilagor till dokumentarkivet
5. Tråda via In-Reply-To/References → hitta `threadId`
6. Auto-matcha till ärende om möjligt
7. Skapa `EmailMessage` med status `UNREAD`
8. Notifiera behöriga roller via `notifyRole()`

### Utgående e-post

```
Styrelsemedlem → Hemmet UI → Resend API → Mottagare
```

Sändning:
1. Styrelsemedlem skriver svar i ärendets tidslinje eller i inkorgen
2. API-anrop till Resend med:
   - From: `inkorgensadress` (t.ex. `forvaltning@brfexempel.se`)
   - Reply-To: `inkorg+ärendeId@brfexempel.se` (för automatisk trådning)
   - In-Reply-To: föregående meddelandets Message-ID
   - References: hela trådkedjan
3. Spara som `EmailMessage` med `direction: "outbound"`
4. Logga i ActivityLog

### Plus-adressering för automatisk ärendekoppling

Nyckelmekanismen för att koppla svar till rätt ärende:

```
forvaltning+dmg_abc123@brfexempel.se  → DamageReport abc123
ekonomi+exp_def456@brfexempel.se      → Expense def456
styrelsen+sub_ghi789@brfexempel.se    → SubletApplication ghi789
```

Formatet: `{inkorg}+{ärendetypPrefix}_{entityId}@{domän}`

Prefix-tabell:

| Prefix | Ärendetyp |
|--------|-----------|
| `dmg` | DamageReport |
| `exp` | Expense |
| `ren` | RenovationApplication |
| `sub` | SubletApplication |
| `dst` | DisturbanceCase |
| `ins` | Inspection |
| `trf` | TransferCase |
| `mot` | Motion |
| `sug` | Suggestion |
| `tsk` | Task |

---

## Användargränssnitt

### Inkorgsvyn (`/styrelse/epost`)

```
┌─────────────────────────────────────────────────────────────┐
│  📧 E-post                                                  │
│                                                              │
│  [Styrelsen (3)]  [Förvaltning (1)]  [Ekonomi (0)]          │
│                                                              │
│  ┌─ Olästa ──────────────────────────────────────────────┐  │
│  │ ● Andersson VVS <info@anderssonvvs.se>         14:32  │  │
│  │   Re: Offert stamrenovering byggnad A                  │  │
│  │   Bifogad: offert_2026_stamrenovering.pdf              │  │
│  │   [Koppla till ärende ▼]  [Svara]  [Arkivera]         │  │
│  │                                                        │  │
│  │ ● Eva Johansson <eva.j@gmail.com>              09:15  │  │
│  │   Fråga om renovering av badrum                        │  │
│  │   [Skapa ärende ▼]  [Svara]  [Arkivera]               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ Kopplade ─────────────────────────────────────────────┐ │
│  │   Securitas AB <avtal@securitas.se>            igår    │ │
│  │   Nytt larmavtal — signering krävs                     │ │
│  │   → Kopplad till: Uppgift #347 "Förnya larmavtal"     │ │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### "Skapa ärende"-dialogen

När en styrelsemedlem klickar "Skapa ärende" på ett inkommande e-postmeddelande:

```
┌─ Skapa ärende från e-post ─────────────────────────────┐
│                                                         │
│  Från: eva.j@gmail.com                                  │
│  Ämne: Fråga om renovering av badrum                    │
│                                                         │
│  Välj ärendetyp:                                        │
│  ○ Felanmälan (DamageReport)                           │
│  ● Renoveringsansökan (RenovationApplication)          │
│  ○ Förslag (Suggestion)                                │
│  ○ Uppgift (Task)                                      │
│  ○ Övrig korrespondens                                  │
│                                                         │
│  Titel: [Renovering badrum — Eva Johansson           ]  │
│  (Förslag baserat på ämnesrad)                          │
│                                                         │
│  ☑ Bifoga e-postinnehåll som beskrivning               │
│  ☑ Spara e-postbilagor som ärendebilagor               │
│                                                         │
│  [Avbryt]  [Skapa ärende]                              │
└─────────────────────────────────────────────────────────┘
```

### E-post i ärendetiidslinje

I varje ärende som har kopplad e-post visas meddelandena i tidslinjen:

```
Felanmälan #142 — Läcka i källargång B
─────────────────────────────────────────
  📧 09:15 Inkommande e-post från boende@gmail.com
     "Hej, det läcker från taket i källargång B..."
     
  💬 10:30 Kommentar av Erik (fastighetsansvarig)
     "Kontaktat VVS-jour, de kommer imorgon."
     
  📧 10:45 Utgående e-post till boende@gmail.com
     "Tack för din anmälan. VVS-tekniker kommer..."
     
  📧 14:20 Inkommande e-post från boende@gmail.com
     "Tack! Vilken tid ungefär?"
     
  📧 14:35 Utgående e-post till boende@gmail.com
     "Mellan 08:00–10:00 imorgon."
     
  ✅ 2026-04-14 Status ändrad → Löst
```

### Svarsfunktion i ärendet

```
┌─ Svara på e-post ──────────────────────────────────────┐
│  Till: boende@gmail.com                                 │
│  Från: forvaltning@brfexempel.se                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Hej,                                             │   │
│  │                                                   │   │
│  │ VVS-teknikern kommer mellan 08:00–10:00 imorgon. │   │
│  │ Ring portkoden 1234 för att komma in.             │   │
│  │                                                   │   │
│  │ Med vänliga hälsningar,                           │   │
│  │ Styrelsen, BRF Exempelgården                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Bifoga fil]  [Förhandsgranska]  [Skicka]             │
└─────────────────────────────────────────────────────────┘
```

---

## Per roll: funktionella behov

### Ordförande / Styrelseledamot

**Primärt:** Medlemskommunikation, myndigheter, juridik

| Funktion | Beskrivning |
|----------|-------------|
| Inkorg Styrelsen | Se alla inkommande, oläst-markering |
| Skapa ärende | Motion, förslag, störning, andrahand från e-post |
| Svara i namn av styrelsen | Avsändare = `styrelsen@brfexempel.se` |
| Delegera | Vidarebefordra internt till annan roll/person |
| Statusspårning | "Inväntar svar" / "Besvarad" / "Eskalerad" |
| Möteskoppling | Koppla e-post till mötesdagordning |

### Fastighetsansvarig

**Primärt:** Entreprenörer, besiktningar, offerter, felanmälningar

| Funktion | Beskrivning |
|----------|-------------|
| Inkorg Förvaltning | Entreprenörsmail, besiktningsrapporter |
| Offerthantering | Inkommande offert → koppla till besiktning/komponent |
| Felanmälan från mail | Boende mailar om problem → skapa DamageReport |
| Entreprenörskontakt | Skicka/svara med ärendekontext |
| Bilagor → Dokumentarkiv | Besiktningsrapporter, certifikat → sparas permanent |
| Uppföljning | "Vi väntar svar från Andersson VVS sedan 5 dagar" |

### Kassör

**Primärt:** Fakturor, bank, försäkring, revisorer

| Funktion | Beskrivning |
|----------|-------------|
| Inkorg Ekonomi | Fakturor, kontoutdrag, försäkringsärenden |
| Faktura från e-post | PDF-bilaga → skapa Expense med belopp, leverantör |
| Revisorskommunikation | Frågor/svar inför revision — sparas med kontext |
| Försäkringsärenden | Skadeanmälan till försäkringsbolag, uppföljning |
| Bankärenden | Lånediskussioner, räntejusteringar |
| Kvartalsrapport | Exportera sammanfattning av ekonomi-korrespondens |

---

## Smart funktionalitet

### Auto-kategorisering (fas 2+)

Regelbaserad analys av inkommande e-post:

| Signal | Föreslagen åtgärd |
|--------|-------------------|
| PDF-bilaga med "faktura" i filnamn | → Expense (Faktura) |
| Avsändare = känd entreprenör | → Koppla till pågående Inspection/DamageReport |
| Nyckelord: "läcka", "trasig", "fel" | → DamageReport |
| Nyckelord: "renovera", "badrum", "kök" | → RenovationApplication |
| Nyckelord: "hyra ut", "andrahand" | → SubletApplication |
| Nyckelord: "offert", "pris" | → Koppla till Inspection/Task |
| Avsändare = medlem (känd e-post) | Visa medlemsinfo och lägenhet |

Förslag visas som "chips" — aldrig automatisk ärendeskapning. Styrelsemedlemmen bekräftar alltid.

### Påminnelser och uppföljning

- **Obesvarade mail:** notifiering efter konfigurerbart antal dagar (standard: 3 arbetsdagar)
- **Väntande svar:** ärenden med status "inväntar svar" visar senaste utgående mail + dagar sedan
- **Sammanfattning:** veckovis sammanfattning av ohanterade mail per inkorg

### Kontaktbok (implicit)

Varje e-postadress som kontaktar föreningen bygger gradvis upp en kontaktbok:

```
info@anderssonvvs.se → Andersson VVS
  Senast: 2026-04-10
  Kopplad till: 3 ärenden (2 besiktningar, 1 felanmälan)
  Roll: Entreprenör (VVS)
```

Kopplas till `Contractor`-modellen om den finns, annars som fristående kontakt.

---

## DNS och e-postkonfiguration

### Minimal setup för föreningen

Föreningen behöver peka e-post till Hemmet. Tre alternativ:

**Alt 1: Egen domän med MX-pekning (rekommenderat)**
```
MX   brfexempel.se → inbound.resend.com (prio 10)
TXT  brfexempel.se → v=spf1 include:resend.com -all
CNAME resend._domainkey.brfexempel.se → (DKIM-nyckel från Resend)
```
Fullständig kontroll. Styrelsen@, förvaltning@, ekonomi@ — allt hanteras.

**Alt 2: Subdomän**
```
MX   hemmet.brfexempel.se → inbound.resend.com
```
Befintlig e-post störs inte. Adresser blir `styrelsen@hemmet.brfexempel.se`.

**Alt 3: Vidarebefordring**
Föreningen behåller sin befintliga e-post men sätter upp vidarebefordring till Hemmets inbound-adress. Enklast att starta med, men svar kan inte skickas från föreningens adress.

### Setup-wizard i Hemmet

```
/installningar/epost
  1. Välj metod: [Egen domän] [Subdomän] [Vidarebefordring]
  2. Ange domän: brfexempel.se
  3. DNS-instruktioner genereras automatiskt
  4. Verifiera DNS (knapp → kontrollerar MX/SPF/DKIM)
  5. Skapa inkorgar: ☑ Styrelsen  ☑ Förvaltning  ☑ Ekonomi
  6. Testa: skicka testmail → bekräfta att det anländer
```

---

## GDPR-hänsyn

### Persondata i e-post

E-post kan innehålla personuppgifter — namn, adress, personnummer, hälsoinformation. Samma principer som övriga systemet gäller:

| Princip | Tillämpning |
|---------|-------------|
| **Ändamålsbegränsning** | E-post sparas för ärendehantering, inte i onödan |
| **Lagringsminimering** | Ohanterade mail utan ärendekoppling gallras efter 12 mån |
| **Åtkomstloggning** | Varje öppning av e-post loggas i PersonalDataAccessLog |
| **Gallring** | E-post kopplad till ärende gallras med ärendet (6 mån–7 år beroende på typ) |
| **Export** | GDPR-export inkluderar e-post där personen är avsändare eller omnämnd |
| **Radering** | Rätt till radering — men beakta nödvändighet för pågående ärenden |

### Spam och oönskad e-post

- Inkommande mail från okänd avsändare markeras inte som spam automatiskt — styrelsen bedömer
- Möjlighet att blockera avsändare (sparas i `EmailMailbox.config`)
- E-post med skadlig payload (exekverbara bilagor) filtreras på leverantörsnivå (Resend/Postmark)

---

## Signaturer och avsändaridentitet

### Utgående e-post

Alla utgående mail signeras med:
1. **Föreningens namn** (från BrfSettings)
2. **Rollens signatur** (konfigurerbar per inkorg)
3. **Avsändarens namn** (valfritt — kan döljas, då står bara föreningens namn)

Standardsignatur:
```
Med vänliga hälsningar,
Styrelsen, BRF Exempelgården
Storgatan 1, 123 45 Staden
styrelsen@brfexempel.se
```

### Reply-from

Svar skickas alltid från inkorgensadress (aldrig personlig e-post). Reply-To pekar på ärendespecifikt plus-alias för trådning.

---

## Implementationsfaser

### Fas 1: Grundläggande infrastruktur
**Mål:** E-post kan tas emot och visas i Hemmet

- [ ] Datamodell: `EmailMailbox`, `EmailMessage`, `EmailAttachment`, `EmailMailboxAccess`
- [ ] Prisma-migration
- [ ] Webhook-endpoint `/api/email/inbound` (Resend)
- [ ] E-postparsning: from, to, subject, body, bilagor
- [ ] Trådning via Message-ID/In-Reply-To/References
- [ ] Bilagor → dokumentarkivet
- [ ] tRPC-router `email.*` med RBAC per inkorg
- [ ] Grundläggande inkorgsvyn (`/styrelse/epost`)

### Fas 2: Ärendekoppling
**Mål:** E-post kan kopplas till och skapa ärenden

- [ ] "Koppla till ärende"-dialog (välj bland pågående ärenden)
- [ ] "Skapa ärende"-dialog med typväljare
- [ ] E-postinnehåll → ärendebeskrivning + bilagor
- [ ] E-postbilagor → ärendebilagor (via Attachment-modellen)
- [ ] E-post synlig i ärendetidslinje
- [ ] Auto-identifiera känd avsändare (medlem, entreprenör)

### Fas 3: Svar och utgående
**Mål:** Styrelsemedlemmar kan svara från Hemmet

- [ ] Svarsfunktion i inkorgsvyn
- [ ] Svarsfunktion i ärendetidslinje
- [ ] Utgående e-post via Resend API
- [ ] Reply-To med plus-adressering för automatisk trådkoppling
- [ ] Konfigurerbara signaturer per inkorg
- [ ] CC-hantering

### Fas 4: Smart funktionalitet
**Mål:** Systemet hjälper till att kategorisera och följa upp

- [ ] Regelbaserad auto-kategorisering (förslag, inte automatisk)
- [ ] Kontaktbok: automatisk uppbyggnad från e-posthistorik
- [ ] Koppla avsändare till Contractor/User-modeller
- [ ] Påminnelser: obesvarade mail, väntande svar
- [ ] Veckosammanfattning per inkorg

### Fas 5: Konfiguration och setup
**Mål:** Föreningen kan sätta upp e-postintegration själv

- [ ] Setup-wizard i `/installningar/epost`
- [ ] DNS-verifiering
- [ ] Inkorgshantering (skapa, namnge, tilldela roller)
- [ ] Signaturkonfiguration
- [ ] Test-funktion (skicka testmail)

### Fas 6: GDPR och livscykel
**Mål:** E-post följer samma GDPR-regler som övriga systemet

- [ ] Gallringsregler för e-post (kopplat till ärendets livscykel)
- [ ] Åtkomstloggning vid öppning av e-post
- [ ] GDPR-export inkluderar e-post
- [ ] Spam-markering och avsändarblockering
- [ ] Arkivering av gamla trådar

---

## tRPC-router: `email`

### Queries

| Procedure | Input | Beskrivning | Permission |
|-----------|-------|-------------|------------|
| `email.mailboxes` | — | Lista tillgängliga inkorgar (RBAC-filtrerad) | Rollbaserad |
| `email.list` | `{ mailboxId, status?, page? }` | Lista meddelanden i inkorg | Rollbaserad |
| `email.thread` | `{ threadId }` | Hela tråden (sorterad kronologiskt) | Rollbaserad |
| `email.get` | `{ id }` | Enskilt meddelande med bilagor | Rollbaserad |
| `email.unreadCount` | `{ mailboxId? }` | Antal olästa per inkorg | Rollbaserad |
| `email.entityMessages` | `{ entityType, entityId }` | E-post kopplad till specifikt ärende | Rollbaserad |

### Mutations

| Procedure | Input | Beskrivning | Permission |
|-----------|-------|-------------|------------|
| `email.markRead` | `{ id }` | Markera som läst | Rollbaserad |
| `email.archive` | `{ id }` | Arkivera meddelande | Rollbaserad |
| `email.markSpam` | `{ id }` | Markera som spam | Rollbaserad |
| `email.linkToEntity` | `{ messageId, entityType, entityId }` | Koppla till befintligt ärende | Rollbaserad |
| `email.createEntity` | `{ messageId, entityType, data }` | Skapa ärende från e-post | Rollbaserad |
| `email.send` | `{ mailboxId, to, subject, body, inReplyTo?, entityType?, entityId? }` | Skicka utgående e-post | Rollbaserad |
| `email.configureMailbox` | `{ name, emailAddress, roles[] }` | Konfigurera inkorg | `settings:manage` |

---

## Notifieringsintegration

E-postintegration utökar det befintliga notifieringssystemet:

```typescript
// Nytt mail i Styrelsen-inkorgen
notify({
  userId: ordforande.id,
  title: "Nytt mail i Styrelsen",
  body: "Från: eva.j@gmail.com — Fråga om renovering",
  link: "/styrelse/epost?mailbox=styrelsen&msg=abc123",
  channels: ["in_app"],
});

// Obesvarat mail efter 3 dagar
notifyRole("BOARD_CHAIRPERSON", {
  title: "Obesvarat mail",
  body: "Mail från Andersson VVS har väntat 3 dagar",
  link: "/styrelse/epost?mailbox=forvaltning&msg=def456",
  channels: ["in_app"],
});
```

---

## Avgränsningar

### Ingår inte

- **Fullständig e-postklient** — Hemmet är inte Gmail/Outlook
- **Kalenderintegration** — separat funktion om behov uppstår
- **Massutskick/nyhetsbrev** — hanteras via Announcement-modellen
- **Personlig e-post** — integrationen gäller rollbaserade inkorgar, inte privatpersoners mail
- **E-postkryptering (PGP/S/MIME)** — TLS i transit räcker för BRF-kommunikation

### Framtida möjligheter

- **AI-sammanfattning** av långa e-posttrådar
- **Mallsvar** — vanliga frågor (andrahand, renovering, parkering) med förifyllda svar
- **Automatisk fakturaextraktion** — PDF → belopp, leverantör, förfallodatum
- **Integration med ekonomisystem** — Fortnox/Visma för automatisk fakturakoppling

---

## Beroenden och teknikval

| Komponent | Val | Motivering |
|-----------|-----|------------|
| E-postleverantör | Resend | Redan i `.env.example`, enkel API, inbound webhooks |
| Bilagor | Befintligt dokumentarkiv | `/api/documents/upload` + Document-modellen |
| RBAC | Befintligt permission-system | EmailMailboxAccess + requirePermission |
| Notifieringar | Befintlig notify() | Utökas med e-postspecifika händelser |
| Audit | Befintlig logActivity() | Alla e-poståtgärder loggas |
| Trådning | RFC 2822 Message-ID | Industristandard, fungerar med alla e-postklienter |
