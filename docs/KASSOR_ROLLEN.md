# Analys: Kassörrollen i Hemmet

## Vad som fungerar idag

### Permissions

BOARD_TREASURER delar BOARD_COMMON (24 permissions) plus:
- `expense:approve` — kan godkänna, avslå och markera utlägg som betalda
- `application:review` — kan granska medlemsansökningar
- `transfer:create` — kan skapa överlåtelseärenden
- `transfer:manage_financial` — kan hantera ekonomiska delar av överlåtelser (avgifter, pantnoteringar)
- `transfer:view` — kan se överlåtelseärenden
- `contract:manage` — kan skapa, redigera och avsluta avtal
- `procurement:manage` — kan hantera upphandlingar
- `contractor:manage` — kan hantera leverantörsregistret

### Utläggshantering (kärnfunktion)

Fullt flöde implementerat:
- **DRAFT** -> **SUBMITTED** -> **APPROVED/REJECTED** -> **PAID**
- Kan godkänna utlägg med `approverId` och `approvedAt`
- Kan avslå med motivering (`rejectionNote`)
- Kan markera godkända utlägg som betalda (`paidAt`)
- Kategorier: Underhåll, Trädgård, Administration, Städning, Reparation, Försäkring, Material, Representation, Övrigt
- Belopp lagras som `Decimal` (korrekt hantering)

### Kassör-dashboard (delvis implementerad)

`treasurerOverview`-query returnerar ekonomisk sammanställning:
- **pendingExpenses** — antal utlägg som väntar på godkännande
- **approvedUnpaid** — antal godkända men ännu obetalda utlägg
- **thisMonthPaid** — totalt betalt denna månad
- **lastMonthPaid** — totalt betalt föregående månad
- **pendingTransferFees** — väntande överlåtelseavgifter
- **prisbasbelopp** — aktuellt prisbasbelopp

Dashboarden visas korrekt baserat på permissions (tidigare bugg som dolde den för användare med dubbla roller är åtgärdad).

**Saknas fortfarande:** Budget vs utfall, likviditetsöversikt, avgiftssammanställning.

### Överlåtelsehantering

Kassören har fullständiga överlåtelsepermissions:
- Kan skapa och se överlåtelseärenden (`transfer:create`, `transfer:view`)
- Kan hantera ekonomiska aspekter: avgiftsberäkning, pantnoteringar (`transfer:manage_financial`)
- Överlåtelseavgifter konfigureras via `BrfRules` (procent av prisbasbelopp)

### Avtalshantering (fullt implementerad)

Komplett avtalsmodul med `contract:manage`:
- **Kategorier:** SERVICE, INSURANCE, FINANCIAL, MANAGEMENT, UTILITY, PROJECT, CONSULTING, OTHER
- **Statushantering:** fullständigt livscykelflöde
- **Ramavtal** med avrop (call-offs)
- **Utgångsspårning** — bevaka när avtal löper ut
- Koppling till leverantörer via Contractor-modellen

### Upphandlingshantering (fullt implementerad)

Komplett upphandlingsmodul med `procurement:manage`:
- **13-stegs upphandlingsflöde** — från behovsbeskrivning till avtalstecknande
- **Offerthantering** — samla in och jämföra offerter
- **Mandatspårning** — koppla upphandling till styrelsebeslut/beloppsgränser

### Leverantörsregister (fullt implementerat)

Komplett leverantörsregister med `contractor:manage`:
- Kontaktuppgifter och organisationsnummer
- **F-skattsedel** — spåra status
- **PUB-avtal** (personuppgiftsbiträdesavtal) — spåra GDPR-krav
- Koppling till avtal och upphandlingar

### Möteskontext

- Deltar i möten med `meeting:edit` (samma som andra styrelsemedlemmar)
- Dagordningsmallen har "Ekonomisk rapport" — "Kassören redovisar föreningens ekonomiska ställning"
- Kan rösta och delta i beslutsfattande
- Kan skapa/redigera årsredovisning (`annual_report:edit`)

### Övriga förmågor

- Kan svara på motioner (`motion:respond`)
- Kan granska medlemsansökningar (`application:review`)
- Kan ladda upp dokument (`document:upload`)
- Kan skapa meddelanden (`announcement:create`)

## Kvarvarande brister

### 1. Ekonomiska inställningar — kassören utestängd

- `admin:settings` finns bara på ADMIN
- Kassören kan INTE redigera:
  - Bankgiro, plusgiro, IBAN, Swish
  - Firmateckningsregel
  - Räkenskapsår (fiscalYearStart/End)
  - Momsregistrering, F-skatt
- Kassören kan INTE ens SE inställningarna (`admin:integrations` saknas)
- **Bör åtgärdas:** Kassör bör ha tillgång till ekonomiska inställningar

### 2. Avgiftshantering — helt avsaknad

- `BrfRules` har avgiftsparametrar (överlåtelse, pant, andrahand) men kassören kan inte konfigurera dem
- `Apartment.monthlyFee` finns men kräver `member:edit` (bara ordförande/admin)
- Ingen beräkningslogik för avgifter kopplat till `BrfRules`-procentsatser
- Ingen fakturering eller avisering av månadsavgifter

### 3. Firmateckning — rent informativt

- `BrfSettings.signatoryRule` = "Ordförande och kassör var för sig, eller två styrelseledamöter i förening"
- Ingen validering vid godkännanden — vem som helst med `expense:approve` kan godkänna ensam
- Inget stöd för "i förening"-krav (dubbelsignering)
- Kassören nämns explicit i firmateckningsregeln men systemet kontrollerar aldrig detta

### 4. Budget och uppföljning saknas helt

- Kategorier finns på utlägg men inga budgetgränser per kategori
- Ingen varning vid höga belopp
- Ingen sammanställning per period (månad/kvartal/år)
- Ingen jämförelse budget vs utfall
- Ingen koppling till underhållsplan (`maintenancePlanRequired`, `maintenancePlanYears` finns i BrfRules)
- Inget årligt budgetverktyg eller prognostisering

### 5. Kvittohantering primitiv

- `Expense.receiptUrl` finns i schemat men UI:t är minimalt
- Ingen fullständig uppladdningsvy för kvitton/underlag
- Ingen verifikationskedja

### 6. Utläggsvalidering saknas

- Ingen beloppsgräns — kassören kan godkänna obegränsade belopp
- Blockering av godkännande av egna utlägg (segregation of duties) behöver verifieras
- Inget krav på styrelsebeslut för belopp över viss gräns
- Inget attestflöde med flera godkännare

### 7. Ekonomisk rapportering saknas

- Ingen resultaträkning eller balansräkning
- Ingen kassaflödesrapport
- Ingen export av ekonomisk data
- Dagordningspunkten "Ekonomisk rapport" har ingen koppling till faktisk data
- Dashboarden visar bara utläggsstatistik, inte fullständig ekonomisk bild

### 8. Revision — begränsad åtkomst

- Kassören kan bara SE revision (`audit:view`)
- Kan inte skicka underlag till revisor
- Kan inte se revisionsanmärkningar
- Årsredovisning kan skapas men ingen koppling till faktisk ekonomisk data

## Jämförelse: Kassör vs Ordförande

| Förmåga | Kassör | Ordförande |
|---------|:-:|:-:|
| Godkänna utlägg | Y | Y |
| Kassör-dashboard | Y (delvis) | - |
| Skapa överlåtelser | Y | Y |
| Hantera överlåtelseekonomi | Y | - |
| Hantera avtal | Y | - |
| Hantera upphandlingar | Y | - |
| Hantera leverantörer | Y | - |
| Se ekonomiska inställningar | - | Y |
| Ändra ekonomiska inställningar | - | - (ADMIN) |
| Ändra månadsavgifter | - | Y |
| Skapa möten | - | Y |
| Tilldela roller | - | Y |
| Granska ansökningar | Y | Y |
| Budget/uppföljning | - | - |
| Firmateckning (enforcement) | - | - |

## Prioriterad åtgärdslista

| Prio | Funktion | Varför |
|------|----------|--------|
| 1 | **Ge kassör ekonomi-permissions** | Kassör måste kunna se/redigera bankuppgifter, räkenskapsår, avgifter |
| 2 | **Budgetverktyg** | Årlig budget per kategori, prognostisering, avvikelseanalys |
| 3 | **Avgiftshantering** | Beräkning och avisering av månadsavgifter baserat på andelstal |
| 4 | **Ekonomisk rapportering** | Sammanställning per kategori/period, underlag för årsredovisning |
| 5 | **Kvittouppladdning (fullständig)** | receiptUrl finns i schemat, behöver komplett uppladdnings-UI |
| 6 | **Utläggsvalidering** | Beloppsgränser, verifiera blockering av egna utlägg |
| 7 | **Firmateckningsvalidering** | Koppla signatoryRule till godkännandeflöden |
