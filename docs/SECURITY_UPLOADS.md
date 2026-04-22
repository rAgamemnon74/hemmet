# Uppladdningssäkerhet

Dokumenterar säkerhetsmodellen för filuppladdning och vad som kan läggas till framöver.

## Nuvarande skyddsnivå (1.0.0-rc1)

### Paket 1 — XSS-skydd

- **Extension-blocklist**: `.html`, `.svg`, `.js`, `.sh`, `.py`, `.php`, `.exe`, `.bat` m.fl. (se `src/lib/upload-security.ts`)
- **Magic-byte-sniff** via `file-type`-paketet — klientens `file.type` ignoreras, server beräknar verklig MIME från filens innehåll
- **MIME-whitelist per kategori** — t.ex. `DAMAGE_REPORT_PHOTO` tillåter bara bilder, `MEETING_PROTOCOL` bara PDF
- **Content-Disposition: attachment** för allt utom säkra inline-typer (PDF, bild, plain text) — andra filer laddas ner istället för att renderas
- **X-Content-Type-Options: nosniff** + **CSP sandbox** på download-svar
- **Permission-check per kategori** — bara ordförande/admin kan ladda upp stadgar, bara sekreterare kan ladda upp protokoll, osv.
- **Publikt synliga dokument kräver `document:publish`** (ADMIN / BOARD_CHAIRPERSON / BOARD_SECRETARY)

### Paket 2 — Resursskydd

- **Storlekstak per kategori** (default 50 MB, 10 MB för bilder, 20 MB för kvitton)
- **Rate-limiting per användare** (token bucket: 20 uploads/minut, in-memory)
- **Total kvot per användare** (500 MB)
- **Disk-check** — avslår om mindre än 1 GB fritt

### Paket 3 — Audit & GDPR

- **`logActivity`** på varje upload (kategori, storlek, synlighet)
- **`logPersonalDataAccess`** (action `DOWNLOAD_DOCUMENT`) på varje nedladdning — vem, när, vilket dokument, vilken kategori
- **Auth-check** på både upload och download (401 om ej inloggad)

## Framtida förbättringar

### Virusscanning via ClamAV

För föreningar som vill ha extra skydd (t.ex. efter en incident, eller om de
distribuerar till allmänheten).

**Setup på brunkan:**

```bash
sudo apt install clamav clamav-daemon
sudo freshclam                       # ladda ner databasen
sudo systemctl enable --now clamav-daemon
```

**Integration i upload-routet:**

```ts
// src/lib/upload-virus-scan.ts
import NodeClam from "clamscan";
// ... skapa scanner mot clamd på localhost:3310
// anropa i upload-routet efter magic-byte-sniff
```

ClamAV kan skanna strömmande data innan filen sparas, så angripare får aldrig
ett kvitto på att filen sparades. Kostnad: ~200 MB RAM för daemon, några sekunder
per skanning.

**Inte inkluderat i 1.0.0-rc1** eftersom:
- Lägger till betydande overhead för varje upload
- Ökar systemkomplexiteten
- XSS-skyddet ovan är betydligt viktigare än virusskydd (malware är en
  klient-sidan-risk, XSS är en server-sidan-risk)

### Content Security Policy globalt

Nuvarande CSP är bara på `/api/documents/*/download`. En striktare global CSP
(t.ex. via Next.js `middleware.ts`) skulle ge djupförsvar mot reflected XSS
och click-jacking.

### Signerade download-URL:er

För länkar som kan delas externt: temporära signerade URL:er med TTL istället
för att bara kräva inloggning. Nu kan vilken inloggad som helst ladda ner om
de har dokument-ID:t — skulle inte vara säkert vid offentlig delning av länkar.

Inte relevant så länge dokumenten bara delas via systemet internt.

### Sandboxed image preview

För bildförhandsvisning i UI (t.ex. skadeanmälan-foton): proxya via en
iframe med `sandbox=""`-attribut så att även smaklösa EXIF-exploits eller
bildparser-buggar begränsas.

## Attackmodell

### Det vi skyddar mot

1. **Stored XSS** — inloggad användare laddar upp HTML/SVG/JS som körs i annan användares browser
2. **MIME-spoofing** — klienten ljuger om filtyp för att kringgå whitelist
3. **Ägarskap-förfalskning** — lågprivilegierad användare laddar upp "styrelsedokument" med felaktig kategori
4. **DoS via disk-fyllning** — stora filer eller många uppladdningar på kort tid
5. **Persondata-läckage** — dokument med känsligt innehåll utan access-logg

### Det vi INTE skyddar mot (by design)

1. **Skadlig server-operatör** — root på servern kan alltid komma åt allt
2. **Brute-force mot admin-konto** — förlitar sig på starkt lösenord + AUTH_SECRET
3. **Social engineering** — ingen teknisk fix mot att styrelsen lurar sig själv
4. **Malware i legitim PDF** — kan inte skilja från äkta PDF utan ClamAV
5. **Side-channel via tidsmätningar** — inte relevant för en BRF-plattform

### Det som förlitar sig på andra system

1. **TLS in-transit** — delegeras till nginx/Cloudflare framför Hemmet
2. **Backup av uploads/** — admin ansvar (rsync till Hetzner Storage Box etc)
3. **Intrångsdetektion** — delegeras till brandväggen/UDR / operativsystem
4. **Kompromettering av databas** — delegeras till PostgreSQL-hårdning
