# Analys: Sekreterarrollen i Hemmet

## Vad som fungerar idag

- **RBAC:** Rätt permissions — `meeting:protocol`, `meeting:create`, `meeting:assign_roles`
- **Mötesroll:** Kan väljas som mötessekreterare per möte (ELECT_SECRETARY-punkt)
- **Röstregistrering:** Under FINALIZING kan bara ordförande, sekreterare och justerare registrera röster
- **Protokoll:** Kan skriva protokolltext (men vem som helst med `meeting:edit` kan det också)

## Kritiska brister

### 1. Protokollsignering — databas klar, UI saknas

- `Protocol.signedBy[]` och `signedAt` finns i schemat men används aldrig
- Ingen signeringsflöde: sekreterare skriver -> ordförande + justerare signerar
- Ingen PDF-generering av protokoll

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
