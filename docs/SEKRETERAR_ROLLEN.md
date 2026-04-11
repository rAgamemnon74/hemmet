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

### Datamodell (befintlig — utökas)

```
Protocol {
  // Befintliga fält
  content      String    // Protokolltext
  signedBy     String[]  // Array av userId som signerat
  signedAt     DateTime? // Senaste signering
  pdfUrl       String?   // Genererad PDF

  // Nya fält
  status       ProtocolStatus  // DRAFT, FINALIZED, SIGNED, ARCHIVED
  finalizedAt  DateTime?       // När sekreteraren slutbehandlade
  finalizedBy  String?         // Sekreterarens userId
  archivedAt   DateTime?       // När protokollet arkiverades
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

## Kritiska brister

### 1. Protokollsignering — databas delvis klar, UI och flöde saknas

- `Protocol.signedBy[]` och `signedAt` finns i schemat men används aldrig
- Protokollstatus (DRAFT → FINALIZED → SIGNED → ARCHIVED) saknas i schemat
- Inget signeringsflöde i UI
- Ingen låsning av protokoll efter slutbehandling
- Ingen PDF-generering

### 2. Ingen sekreterar-specifik vy

- Ingen dashboard med "mina uppgifter som sekreterare"
- Ingen påminnelse om protokolldeadline (`BrfRules.protocolDeadlineWeeks` = 3 veckor)
- Ingen notifiering vid val till mötessekreterare

### 3. Protokollstöd är primitivt

- Fritext-textarea utan struktur
- Ingen mall som förifylls från mötesloggen (dagordning, beslut, närvaro)
- Ingen versionshistorik eller spårning av ändringar

### 4. Behörighetsseparation saknas under mötet

- Under IN_PROGRESS har sekreteraren samma rättigheter som alla styrelsemedlemmar
- Ingen exklusiv "protokollförare"-vy i mötesadmin
- Sekreteraren kan inte anteckna under punkterna i realtid

### 5. Besluthantering

- Sekreteraren har ingen särskild roll i att kvalitetssäkra beslut
- Ingen validering att alla dagordningspunkter har dokumenterats
- Ingen koppling mellan möteslogg -> protokollutkast

### 6. Kallelsehantering

- Sekreteraren ska normalt assistera ordföranden med kallelser
- Inget stöd för att skicka ut kallelser (digital/e-post)
- `BrfRules.noticeMethodDigital` finns men används inte

## Prioriterad åtgärdslista

| Prio | Funktion | Varför |
|------|----------|--------|
| 1 | **Protokoll från möteslogg** | Autogenerera utkast från loggdata — sekreterarens viktigaste uppgift |
| 2 | **Signeringsflöde** | Lagkrav: protokoll ska justeras av ordförande + justerare |
| 3 | **Protokolldeadline-påminnelse** | Stadgarna kräver protokoll inom X veckor |
| 4 | **Realtidsanteckningar i mötesadmin** | Sekreteraren behöver anteckna under varje punkt |
| 5 | **Kallelseverktyg** | Skicka ut kallelse digitalt med dagordning |
