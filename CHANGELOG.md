# Changelog

Alla märkbara ändringar dokumenteras här.
Versioner följer [semver](https://semver.org) — MAJOR.MINOR.PATCH[-suffix].

## [Unreleased]

Pågående arbete inför 1.0.0-final. Inga planerade breaking changes —
rc1 → 1.0.0 är i första hand en stabiliseringsperiod med buggfixar och
dokumentationsslip.

## [1.0.0-rc1] — 2026-04-22

Första release-kandidaten. Komplett funktionsset för att driva en svensk
bostadsrättsförening digitalt — styrelsearbete, möten, protokoll, bokningar,
ekonomi, medlemsregister och integrationer.

### Tekniskt

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript**
- **PostgreSQL 14+** via Prisma 6
- **tRPC v11** med end-to-end typsäkerhet (45 routrar, 60+ modeller)
- **NextAuth v5** (JWT-sessioner, credentials)
- **Tailwind CSS 4**
- **Debian .deb**-paketering med systemd-integration

### Styrelse och mötesadministration

- Möteshantering med dagordningsmallar (styrelsemöte, ordinarie stämma, extra stämma)
- Mötesroller: ordförande, sekreterare, justerare — med syntetiserade beslutsmeningar i protokollet
- Tre beslutsmetoder: acklamation, votering (räknade röster), votering (namnupprop)
- Automatiska referensnummer (`YYYY-MM-§N`) och protokollnummer per räkenskapsår
- **Jävsdeklarationer** med automatisk uppdatering av participantIds och audit-logg
- **Inline yttrande-formulär** på motioner under pågående styrelsemöte
- **Bilagor per agendapunkt** (PDF/bild embed via iframe, Office-länk)
- **`NEXT_MEETING`**-specialtyp med månadskalender inkl. veckonummer
- **Context-aware snabbtext** per agendapunkt-typ (16 specialtyper med per-typ-mallar)
- **Per-punkt-notes** med presenter-dropdown från närvarolistan

### Protokoll

- Protokoll-generator med konfigurerbart sidhuvud per mötestyp
  (namn, org.nr, säte, protokollnummer, räkenskapsår, adress, webb, e-post)
- Dynamiskt protokollnummer (N:e möte av samma typ inom räkenskapsåret)
- Inkluderar motioner handlagda av styrelsen, jävsdeklarationer, role-election-beslut, bilagor
- **Markdown-export** + **.docx-export** (via `docx`-paketet)
- **Undertecknat PDF-uppladdning** — medlemmar kan ladda ner det formella protokollet
- Protokoll-livscykel: DRAFT → FINALIZED → SIGNED → ARCHIVED

### Bokningssystem

- Tre bokningslägen: `FREEFORM` (fri tid), `SLOTS` (pass), `DAYS` (dygn)
- Resurstyper: tvättstuga, bastu, gästlägenhet, festlokal, parkering, hobbyrum, övrigt
- **Veckovy** (måndag–söndag) med ISO-veckonummer i boende-UI
- **Priority-gating per resurstyp** — boende med bokning inom priority-fönstret får reducerat bokningsfönster
- **Anti-gaming** via `cancelLockHours` (sen avbokning räknas mot priority)
- Per-resurs-limiter: max aktiva bokningar, max per period, max i följd
- Admin-UI för CRUD av resurser + slot-editor
- **24 månaders GDPR-gallring** av bokningshistorik

### Årsmöte och röstning

- 21 standardpunkter för ordinarie stämma, 11 för extra stämma
- Digital röstlängd eller uppladdad bilaga
- Ombudshantering: medlemsombud eller extern person
- Max-gräns per ombud (stadgekonfig)

### Medlemmar och lägenheter

- Medlemsregister med sök, filter, CSV-export (rollfiltrerad enligt GDPR)
- Lägenhetsregister med andelstal, avgifter, yta, ägarskap
- Medlemsansökan för person och juridisk person med ägarskapsvalidering
- Organisationsägande med ombud (personnummer, mandatdokument obligatoriskt)
- Överlåtelseprocess med beslutsflöde

### Motioner

- Motioner från medlemmar kopplas automatiskt till nästa stämma
- Styrelsens yttrande + rekommendation (tillstyrker/avstyrker/föreslår ändring/tar inte ställning)
- Alternativa beslutsförslag från styrelsen
- Motionen kan handläggas under styrelsemöte (`boardResponseMeetingId`)

### Valberedning

- `NOMINATING_COMMITTEE` + `NOMINATING_COMMITTEE_CHAIR`-roller
- Nomineringsperioder, kandidatförslag från medlemmar
- Sammankallandes finalisering

### Revision

- Revisorer med förtroendevald vs auktoriserad
- Revisionsberättelse med rekommendation
- Separat åtkomst till ekonomi, protokoll, årsberättelse

### Boende

- Felanmälan med allvarlighetsgrad, statusspårning, bilder
- Förslag från boende med styrelsens svar
- Anslagstavla med målgruppsscoping (alla/medlemmar/styrelse)
- Störningsärenden (ansvarskedja vid andrahand)

### Miljömodul

- Egenkontroll (revisioner, uppdateringar)
- Kemiska produkter-register
- Avfallshantering
- Miljöincidenter
- Riskbedömning

### GDPR och audit

- Rollbaserad åtkomst (15 roller, 44 permissions)
- Personuppgifts-maskering (personnummer, kontaktuppgifter bakom rollcheck)
- `ActivityLog` på alla mutations med before/after-data
- `PersonalDataAccessLog` loggar alla visningar av persondata
- 24 mån-gallring av bokningshistorik, 6 mån för avslagna ansökningar
- Samtyckesflöde för kontaktdelning mellan medlemmar

### BRF-YAML-mallsystem (nytt)

- Schema 1.0 för att grundladda hela BRF-kontexten från en YAML-fil
- CLI: `hemmet-import-brf` (dry-run + apply)
- Admin-UI: upload/textarea + dry-run-förhandsgranskning
- Fiktiv exempel-YAML inkluderad (`example-brf.yaml`)
- Idempotent — kan återimporteras utan dubletter

### Paketering och deployment

- **.deb-paket** (arm64) byggt via cross-build från x86_64 dev-maskin
- Admin-kommandon: `hemmet-setup`, `hemmet-migrate`, `hemmet-test-db`,
  `hemmet-gen-secret`, `hemmet-import-brf`
- **Auto-setup** vid fresh install + lokal PostgreSQL
- Bootstrap skapar BrfSettings + BrfRules + admin-user med slumpat lösenord
- systemd-integration med sandboxed `hemmet`-user
- Versionering: semver + git-tag → clean release, annars `+dev.<sha>[.dirty]`-suffix

### Säkerhet

- Stale JWT-sessioner fångas i tRPC-middleware (401 istället för FK-krasch)
- Platshållar-konton för förtroendevalda har **oanvändbar lösenords-hash**
  (admin måste bjuda in riktigt via UI)
- `.env` och `local/` utanför git

### Kända begränsningar

- `maxConsecutiveUnits`-check för SLOTS-läge inte fullt implementerad (bara DAYS)
- Ingen automatisk SMTP-konfiguration (krav på manuell setup)
- Logo-stöd i .docx-export saknas (admin lägger in manuellt i Word)
- Max-gräns per ombud validering är på stadgekonfig-nivå, ej UI-enforcement

<!--
Framtida format:
## [X.Y.Z] — YYYY-MM-DD

### Lagt till
### Ändrat
### Fixat
### Tagit bort / Breaking changes
-->
