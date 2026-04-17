# Analys: Sekreterarrollen i Hemmet

## Vad som fungerar idag

- **RBAC:** Rätt permissions — `meeting:protocol`, `meeting:create`, `meeting:assign_roles`
- **Mötesroll:** Kan väljas som mötessekreterare per möte (ELECT_SECRETARY-punkt)
- **Röstregistrering:** Under FINALIZING kan bara ordförande, sekreterare och justerare registrera röster
- **Protokoll:** Kan skriva protokolltext (men vem som helst med `meeting:edit` kan det också)

## Protokollets livscykel

### Designprincip

Alla styrelseledamöter kan bidra till protokollet (utkast). Sekreteraren äger slutbehandlingen. Ordförande och justerare signerar. Därefter är protokollet låst.

### Flöde

```
1. UTKAST (DRAFT)
   Alla styrelsemedlemmar kan redigera protokolltexten.
   Mötesloggen (närvaro, beslut, röstresultat) autogenereras som underlag.
   Sekreteraren sammanställer och redigerar.

2. SLUTBEHANDLAT (FINALIZED)
   Sekreteraren markerar protokollet som slutbehandlat.
   → Protokollet låses för redigering av andra.
   → Ordförande och justerare notifieras att signering krävs.
   → Sekreteraren kan fortfarande göra mindre korrigeringar.

3. SIGNERAT (SIGNED)
   Ordförande signerar (digital bekräftelse).
   Justerare signerar (digital bekräftelse).
   → Alla signaturer registreras i Protocol.signedBy[] med tidsstämpel.
   → Protocol.signedAt sätts till senaste signaturen.

4. ARKIVERAT (ARCHIVED)
   Protokollet är fullständigt justerat och låst.
   → Ingen kan ändra, inte ens sekreteraren.
   → Automatisk koppling till årsberättelse.
   → Tillgängligt i dokumentarkivet.
   → Protokolldeadline kontrolleras (BrfRules.protocolDeadlineWeeks).
```

### Datamodell (implementerad)

```
Protocol {
  content      String           // Protokolltext
  signedBy     String[]         // Array av userId som signerat
  signedAt     DateTime?        // Senaste signering
  pdfUrl       String?          // Genererad PDF
  status       ProtocolStatus   // DRAFT, FINALIZED, SIGNED, ARCHIVED
  finalizedAt  DateTime?        // När sekreteraren slutbehandlade
  finalizedBy  String?          // Sekreterarens userId
  archivedAt   DateTime?        // När protokollet arkiverades
}

enum ProtocolStatus {
  DRAFT       // Alla styrelsemedlemmar kan redigera
  FINALIZED   // Sekreteraren har slutbehandlat — låst för andra
  SIGNED      // Ordförande + justerare har signerat
  ARCHIVED    // Fullständigt justerat och arkiverat
}
```

### Behörighetsmatris per protokollstatus

| Status | Sekreterare | Ordförande | Justerare | Övriga ledamöter |
|--------|:-----------:|:----------:|:---------:|:----------------:|
| DRAFT | Redigera | Redigera | Redigera | Redigera |
| FINALIZED | Redigera (korrigeringar) | Signera | Signera | Läsa |
| SIGNED | Läsa | Läsa | Läsa | Läsa |
| ARCHIVED | Läsa | Läsa | Läsa | Läsa |

### Kopplingar vid arkivering

- **Årsberättelse:** Arkiverade protokoll kopplas automatiskt till rätt verksamhetsår
- **Beslutslogg:** Beslut i protokollet är redan kopplade via Decision-modellen
- **Dokumentarkiv:** Protokollet sparas som Document med kategori MEETING_PROTOCOL
- **Notifiering:** Vid FINALIZED notifieras ordförande + justerare, vid ARCHIVED notifieras alla styrelsemedlemmar

## Implementerat

### 1. Protokollsignering — fullständigt flöde

- `ProtocolStatus`-enum med 4 tillstånd: DRAFT, FINALIZED, SIGNED, ARCHIVED
- Protocol-modellen har `status`, `finalizedAt`, `finalizedBy`, `archivedAt`
- Protocol-routern har komplett livscykel: generera utkast, uppdatera anteckningar, slutbehandla, återöppna, signera, arkivera
- `signedBy[]` och `signedAt` används i signeringsflödet
- Låsning av protokoll efter slutbehandling

**Begränsning:** Signering sker via klick-bekräftelse, inte via BankID eller annan juridiskt bindande digital signatur.

### 2. Protokollstatus i schemat

- `ProtocolStatus`-enum (DRAFT, FINALIZED, SIGNED, ARCHIVED) finns i Prisma-schemat
- Fullständig statushantering i protocol-routern

### 3. Sekreterardata på dashboard (delvis)

- "Mitt just nu"-sektionen på dashboarden visar protokoll som väntar på signering (`protocolsToSign`)
- `boardOverview`-queryn visar antal väntande protokoll
- **Saknas fortfarande:** Dedikerad sekreterardashboard, protokolldeadline-påminnelse, notifiering vid val till mötessekreterare

## Kvarvarande brister

### 1. Kallelsehantering

- Sekreteraren ska normalt assistera ordföranden med kallelser
- Inget stöd för att skicka ut kallelser (digital/e-post)
- `BrfRules.noticeMethodDigital` finns men används inte

### 2. Protokollstöd är primitivt

- Fritext-textarea utan struktur
- Ingen mall som förifylls från mötesloggen (dagordning, beslut, närvaro)
- Ingen versionshistorik eller spårning av ändringar

### 3. Behörighetsseparation saknas under mötet

- Under IN_PROGRESS har sekreteraren samma rättigheter som alla styrelsemedlemmar med `meeting:edit`
- Ingen exklusiv "protokollförare"-vy i mötesadmin
- Sekreteraren kan inte anteckna under punkterna i realtid

### 4. Besluthantering

- Sekreteraren har ingen särskild roll i att kvalitetssäkra beslut
- Ingen validering att alla dagordningspunkter har dokumenterats
- Ingen koppling mellan möteslogg -> protokollutkast

## Prioriterad åtgärdslista

| Prio | Funktion | Status | Varför |
|------|----------|--------|--------|
| ~~1~~ | ~~**Signeringsflöde**~~ | Implementerat | Komplett livscykel i protocol-routern (klick-signering, ej BankID) |
| 2 | **Protokoll från möteslogg** | Saknas | Autogenerera utkast från loggdata — sekreterarens viktigaste uppgift |
| 3 | **Protokolldeadline-påminnelse** | Saknas | Stadgarna kräver protokoll inom X veckor |
| 4 | **Realtidsanteckningar i mötesadmin** | Saknas | Sekreteraren behöver anteckna under varje punkt |
| 5 | **Kallelseverktyg** | Saknas | Skicka ut kallelse digitalt med dagordning |
| 6 | **BankID-signering** | Saknas | Juridiskt bindande digital signatur för protokolljustering |
