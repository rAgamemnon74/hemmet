# Changelog

Alla märkbara ändringar dokumenteras här.
Versioner följer [semver](https://semver.org) — MAJOR.MINOR.PATCH.

## [Unreleased]

Pågående arbete innan nästa release.

## [0.1.0] — 2026-04-22

Första paketerade versionen.

### Lagt till

- Deb-paketering med `dpkg-deb` (cross-build: x86_64 → arm64 för Raspberry Pi)
- Admin-kommandon: `hemmet-setup`, `hemmet-migrate`, `hemmet-test-db`, `hemmet-gen-secret`, `hemmet-import-brf`
- Bootstrap av BrfSettings + BrfRules + admin-användare med slumpat lösenord
- BRF-YAML-mallsystem (schema 1.0) med CLI + admin-UI-uppladdning
- Fiktiv exempel-YAML (`prisma/brfs/example-brf.yaml`) som referens
- Bokningssystem med tre lägen (FREEFORM/SLOTS/DAYS), priority, anti-gaming
- Möten: inline yttrande-formulär, protokoll-generering (Markdown + .docx),
  undertecknat PDF-uppladdning, NEXT_MEETING-kalender, bilagor per agendapunkt
- Protokoll-huvud-config per mötestyp i /installningar
- Context-aware snabbtext per specialType
- GDPR-gallring av bokningar efter 24 mån
- Systemd-integration med sandboxad `hemmet`-user

### Kända begränsningar

- Loggo-stöd i .docx saknas (manuell insertion i Word/LibreOffice)
- Ingen automatisk SMTP-konfiguration
- Max-consecutive-check för SLOTS-mode inte fullt implementerad (bara DAYS)

<!--
Format för framtida entries:
## [X.Y.Z] — YYYY-MM-DD

### Lagt till
- ...

### Ändrat
- ...

### Fixat
- ...

### Tagit bort / Breaking changes
- ...
-->
