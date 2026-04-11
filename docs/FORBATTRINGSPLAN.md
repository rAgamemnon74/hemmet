# Förbättringsplan — Hemmet

Sammanställning av alla identifierade förbättringar från analyserna i docs/.
160+ individuella åtgärder konsoliderade till 40 leveranser, grupperade i 6 faser.

---

## Status: Redan implementerat

Följande har redan byggts under analysarbetet:

| Funktion | Källa | Status |
|----------|-------|:------:|
| Fältnivå-åtkomstkontroll (`member.list`) | BRF_SYSTEM_LAGRUM | KLAR |
| Personnummermaskering i UI | BRF_SYSTEM_LAGRUM | KLAR |
| Åtkomstloggning (PersonalDataAccessLog) | BRF_SYSTEM_LAGRUM | KLAR |
| Samtyckemodell (UserConsent) + UI på Min sida | BRF_SYSTEM_LAGRUM | KLAR |
| GDPR-designprinciper i CLAUDE.md | BRF_SYSTEM_LAGRUM | KLAR |
| Protokollets livscykel (DRAFT→FINALIZED→SIGNED→ARCHIVED) | SEKRETERAR_ROLLEN | KLAR |
| Överlåtelseprocess (TransferCase + MortgageNotation) | OVERLATELSE_PROCESS | KLAR |
| Transfer permissions för kassör/ordförande | KASSOR_ROLLEN | KLAR |
| Audit trail (ActivityLog med before/after) | LEDAMOT_ROLLEN | KLAR |
| Min sida (profil, lägenhet, samtycke, ärenden) | BRF_PROCESSER | KLAR |
| QR-incheckning + röstandel från ägarskap | BRF_PROCESSER | KLAR |
| Möteslogg som protokollunderlag | SEKRETERAR_ROLLEN | KLAR |
| Admin vs ordförande separation dokumenterad | BRF_PROCESSER | KLAR |

---

## Fas 1 — Juridiskt skyddsnät (2-3 veckor)

Skyddar styrelsen mot de vanligaste legala fallgroparna. Låg komplexitet, högt skyddsvärde.

| # | Leverans | Källa | Komplexitet | Berör roller |
|---|----------|-------|:-----------:|-------------|
| 1.1 | **Jävsdeklaration per beslut** — checkbox + motivering, loggning av deltagare/avstående | JAV_PRAKTISK, LEDAMOT | Låg | Alla styrelsemedlemmar |
| 1.2 | **Beslutförhetsberäkning med jävsavräkning** — automatisk beräkning, varning vid bristande kvarorum | JAV_PRAKTISK | Låg | Ordförande |
| 1.3 | **Suppleant-inträde per ärende** — tillfällig rollersättning vid jäv | JAV_PRAKTISK | Medel | Suppleant |
| 1.4 | **QUORUM_CHECK logik** — evaluera om mötet är beslutfört/behörigen kallat baserat på BrfRules | BRF_PROCESSER | Medel | Ordförande |
| 1.5 | **Utslagsröst (tieBreakerChairperson)** — implementera vid COUNTED-beslut med lika röster | ORDFORANDE_ROLLEN | Låg | Ordförande |
| 1.6 | **Utläggsvalidering** — hindra godkännande av egna utlägg, valfri beloppsgräns | KASSOR_ROLLEN | Låg | Kassör |

---

## Fas 2 — Sekreterare och protokoll (1-2 veckor)

Sekreterarens viktigaste verktyg. Bygger på redan implementerad protokolllåsning.

| # | Leverans | Källa | Komplexitet | Berör roller |
|---|----------|-------|:-----------:|-------------|
| 2.1 | **Autogenerera protokollutkast från möteslogg** — dagordning, beslut, närvaro, röstresultat → strukturerad text | SEKRETERAR_ROLLEN | Medel | Sekreterare |
| 2.2 | **Protokolldeadline-påminnelse** — varna sekreterare om `protocolDeadlineWeeks` passerat | SEKRETERAR_ROLLEN | Låg | Sekreterare |
| 2.3 | **Realtidsanteckningar per dagordningspunkt** — sekreteraren kan anteckna under mötets gång i mötesadmin | SEKRETERAR_ROLLEN | Medel | Sekreterare |
| 2.4 | **Protokoll → dokument-arkiv** — vid ARCHIVED kopplas automatiskt till Document med kategori MEETING_PROTOCOL | SEKRETERAR_ROLLEN | Låg | Sekreterare |

---

## Fas 3 — Styrelsemedlemmens vardag (2-3 veckor)

Gör systemet användbart för alla styrelsemedlemmar, inte bara specialiserade roller.

| # | Leverans | Källa | Komplexitet | Berör roller |
|---|----------|-------|:-----------:|-------------|
| 3.1 | **"Inför mötet"-vy** — samla dagordning, föregående protokoll, öppna ärenden, inkomna motioner | LEDAMOT_ROLLEN | Medel | Alla styrelsemedlemmar |
| 3.2 | **"Sedan sist"-sammanfattning** — vad har hänt sedan förra styrelsemötet | LEDAMOT_ROLLEN | Medel | Alla styrelsemedlemmar |
| 3.3 | **Notifieringssystem** — e-post/push vid nya uppgifter, möten, ärenden. `Notification`-modell finns, logik saknas | LEDAMOT_ROLLEN | Medel | Alla |
| 3.4 | **Ordförande-dashboard** — samlad vy: väntande ansökningar, utlägg att godkänna, överlåtelser, motioner | ORDFORANDE_ROLLEN | Medel | Ordförande |
| 3.5 | **Kassör-dashboard** — ekonomisk översikt: väntande utlägg, utgifter per månad, prisbasbelopp-status | KASSOR_ROLLEN | Medel | Kassör |
| 3.6 | **Fastighets-dashboard** — öppna felanmälningar, kommande besiktningar, underhållsstatus | FASTIGHETSANSV_ROLLEN | Medel | Fastighetsansvarig |
| 3.7 | **Kvittouppladdning i utlägg** — receiptUrl finns, behöver UI + filuppladdning | KASSOR_ROLLEN | Låg | Alla styrelsemedlemmar |
| 3.8 | **Testanvändare: ledamot@hemmet.se** — seed-data för ren BOARD_MEMBER-roll | LEDAMOT_ROLLEN | Låg | — |

---

## Fas 4 — Boende och medlemsprocesser (3-4 veckor)

Processer som direkt berör medlemmar och boende.

| # | Leverans | Källa | Komplexitet | Berör roller |
|---|----------|-------|:-----------:|-------------|
| 4.1 | **Andrahandsuthyrningsflöde** — ansökan, bedömning, beslut, tidsbegränsning, påminnelse | BRF_PROCESSER, STYRELSEN_KRAV | Medel | Medlem, Ordförande |
| 4.2 | **Renoveringsansökan** — ansökan, teknisk bedömning, styrelsebeslut, besiktning | BRF_PROCESSER, STYRELSEN_KRAV | Medel | Medlem, Fastighetsansvarig |
| 4.3 | **Störningsärendehantering** — anmälan → tillsägelse → varning → eventuellt förverkande, mallar | STYRELSEN_KRAV | Medel | Boende, Ordförande |
| 4.4 | **Utöka felanmälan** — kostnad, entreprenörstilldelning, SLA-bevakning, ärendehistorik per lägenhet | FASTIGHETSANSV_ROLLEN | Medel | Fastighetsansvarig, Boende |
| 4.5 | **Bokningssystem** — tvättstuga, bastu, gästlägenhet, festlokal | BRF_PROCESSER | Medel | Alla boende |
| 4.6 | **Beslut → uppgifter-flöde** — beslut genererar automatiskt uppgifter med ansvarig och deadline | ORDFORANDE_ROLLEN | Låg | Alla styrelsemedlemmar |

---

## Fas 5 — Revision, val och compliance (3-4 veckor)

Stärker gransknings- och valprocesserna.

| # | Leverans | Källa | Komplexitet | Berör roller |
|---|----------|-------|:-----------:|-------------|
| 5.1 | **Ge revisor ekonomi + protokoll-läsåtkomst** — expense:view_all, meeting:view, meeting:protocol | REVISOR_ROLLEN | Låg | Revisor |
| 5.2 | **specialType AUDIT_REPORT + DISCHARGE_VOTE** — visa revisionsberättelse och rekommendation vid stämma | REVISOR_ROLLEN | Låg | Revisor, Stämma |
| 5.3 | **Valberedning: roll + datamodell** — NOMINATING_COMMITTEE i enum, NominationPeriod/Nomination-modeller | VALBEREDARE_ROLLEN | Medel | Valberedare |
| 5.4 | **Valberedning: nomineringssida + arbetsyta** — medlemmar föreslår, valberedning hanterar | VALBEREDARE_ROLLEN | Medel | Valberedare, Medlem |
| 5.5 | **Val-specialTypes + automatisk rolltilldelning** — BOARD_ELECTION, AUDITOR_ELECTION → roller tilldelas vid beslut | VALBEREDARE_ROLLEN | Hög | Stämma |
| 5.6 | **Revisorssuppleant-roll** — AUDITOR_SUBSTITUTE med läspermissions | REVISOR_ROLLEN | Låg | Revisor |
| 5.7 | **Jävsregister per styrelsemedlem** — förebyggande, korsreferens mot leverantörer | JAV_PRAKTISK | Medel | Alla styrelsemedlemmar |
| 5.8 | **Löpande revision** — revisor kan ställa frågor under verksamhetsåret | REVISOR_ROLLEN | Medel | Revisor |

---

## Fas 6 — GDPR-härdning och integrationer (4-6 veckor)

Djupare dataskydd, K3-compliance och externa integrationer.

| # | Leverans | Källa | Komplexitet | Berör roller |
|---|----------|-------|:-----------:|-------------|
| 6.1 | **Kryptera personnummer i databasen** — AES-256 med nyckelrotation | BRF_SYSTEM_LAGRUM | Medel | — |
| 6.2 | **Gallringsrutin** — automatisk anonymisering av avslutade medlemskap, avslagna ansökningar, gamla ombud | BRF_SYSTEM_LAGRUM | Medel | — |
| 6.3 | **Rate limiting** — login, ansökningar, API-endpoints | BRF_SYSTEM_LAGRUM | Låg | — |
| 6.4 | **Begränsa CSV-export** — kräv motivering, logga, begränsa till ordförande/kassör | BRF_SYSTEM_LAGRUM | Låg | — |
| 6.5 | **Komponentregister + underhållsplan** — K3-kopplad med livslängd, skick, planerad åtgärd | FASTIGHETSANSV_ROLLEN, BRF_SYSTEM_LAGRUM | Hög | Fastighetsansvarig |
| 6.6 | **Besiktningskalender** — OVK, hiss, brand, energi med automatiska påminnelser | FASTIGHETSANSV_ROLLEN | Medel | Fastighetsansvarig |
| 6.7 | **Leverantörsregister** — avtal, PUB-avtal, kontakttider, avtalsbevakning | FASTIGHETSANSV_ROLLEN, STYRELSEN_KRAV | Medel | Fastighetsansvarig, Kassör |
| 6.8 | **Revisionsunderlag-export** — PDF/SIE för extern revisor | REVISOR_ROLLEN | Medel | Revisor, Kassör |

---

## Framtida (ej fasplanerade)

Större integrationer och avancerade funktioner, planeras när grundplattformen är stabil.

| Leverans | Källa | Komplexitet |
|----------|-------|:-----------:|
| Ekonomisystemintegration (Fortnox/Visma/SIE) | KASSOR_ROLLEN, BRF_PROCESSER | Hög |
| BankID digital signering | SEKRETERAR_ROLLEN, BRF_SYSTEM_LAGRUM | Hög |
| iXBRL-export till Bolagsverket | BRF_SYSTEM_LAGRUM | Hög |
| K3-avskrivningsberäkning | BRF_SYSTEM_LAGRUM | Hög |
| Momshantering för parkering | BRF_SYSTEM_LAGRUM | Medel |
| Energidata-integration (el, fjärrvärme) | FASTIGHETSANSV_ROLLEN | Hög |
| IoT-integration (värmesystem, vattenläcka) | FASTIGHETSANSV_ROLLEN | Hög |
| Registerförteckning (ROPA) | BRF_SYSTEM_LAGRUM | Låg |
| Incidenthanteringsplan (IMY) | BRF_SYSTEM_LAGRUM | Låg |
| Firmateckningsvalidering | ORDFORANDE_ROLLEN, KASSOR_ROLLEN | Medel |
| Automatisk korsreferens leverantör ↔ jävsregister | JAV_PRAKTISK | Hög |
| Privacy notice vid medlemsansökan | BRF_SYSTEM_LAGRUM | Låg |
| Mötesledning med verkställighet (ordförande styr exklusivt) | ORDFORANDE_ROLLEN | Medel |
| Oberoendebegränsningar för valberedning | VALBEREDARE_ROLLEN | Medel |
| Skilja förtroendevald/auktoriserad revisor | REVISOR_ROLLEN | Låg |
| Avgiftshantering + avisering | KASSOR_ROLLEN | Hög |
| Budgetverktyg | KASSOR_ROLLEN | Medel |
| Ekonomisk rapportering | KASSOR_ROLLEN | Medel |
| Försäkringspåminnelse | STYRELSEN_KRAV | Låg |

---

## Sammanfattning

| Fas | Tema | Leveranser | Status |
|-----|------|:----------:|:------:|
| **1** | Juridiskt skyddsnät | 6 | KLAR — Jäv, beslutförhet, utslagsröst, utläggsvalidering |
| **2** | Protokoll | 4 | KLAR — Autogenerering, deadline, anteckningar, livscykel |
| **3** | Styrelsemedlemmens vardag | 8 | KLAR — Dashboards, notifieringar, mötesförberedelse |
| **4** | Boende och medlem | 6 | KLAR — Andrahand, renovering, störning, bokning |
| **5** | Revision och val | 8 | KLAR — Revisor ser ekonomi, valberedning, val-specialTypes |
| **6** | GDPR och integrationer | 8 | KLAR — Kryptering, gallring, K3-komponenter, leverantörer |
| — | Framtida | 19 | Ej påbörjad — Ekonomisystem, BankID, K3-beräkning, IoT |

**Alla 40 fasplanerade leveranser implementerade.** 19 framtida förbättringar kvarstår.

### Systemstatistik efter alla faser

| Mått | Antal |
|------|:-----:|
| tRPC-routrar | 34 |
| Roller | 15 |
| Permissions | 62 |
| Prisma-modeller | 48 |
| Sidroutes | 46 |
| Migrationer | 20 |
| Analysdokument | 15 |
