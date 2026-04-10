# Analys: Kassörrollen i Hemmet

## Vad som fungerar idag

### Permissions

BOARD_TREASURER delar BOARD_COMMON (24 permissions) plus:
- `expense:approve` — kan godkänna, avslå och markera utlägg som betalda

### Utläggshantering (kärnfunktion)

Fullt flöde implementerat:
- **DRAFT** -> **SUBMITTED** -> **APPROVED/REJECTED** -> **PAID**
- Kan godkänna utlägg med `approverId` och `approvedAt`
- Kan avslå med motivering (`rejectionNote`)
- Kan markera godkända utlägg som betalda (`paidAt`)
- Kategorier: Underhåll, Trädgård, Administration, Städning, Reparation, Försäkring, Material, Representation, Övrigt
- Belopp lagras som `Decimal` (korrekt hantering)

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

## Kritiska brister

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

### 4. Ingen kassör-dashboard

- Ingen samlad ekonomisk översikt
- Ingen vy med: väntande utlägg, totalt godkänt denna månad, budget vs utfall
- Ingen sammanställning av månadsavgifter, föreningens likviditet
- Ingen påminnelse om utlägg som väntar på godkännande

### 5. Budget och uppföljning saknas helt

- Kategorier finns på utlägg men inga budgetgränser per kategori
- Ingen varning vid höga belopp
- Ingen sammanställning per period (månad/kvartal/år)
- Ingen jämförelse budget vs utfall
- Ingen koppling till underhållsplan (`maintenancePlanRequired`, `maintenancePlanYears` finns i BrfRules)

### 6. Kvittohantering primitiv

- `Expense.receiptUrl` finns i schemat men används inte i UI
- Ingen uppladdning av kvitton/underlag
- Ingen verifikationskedja

### 7. Utläggsvalidering saknas

- Ingen beloppsgräns — kassören kan godkänna obegränsade belopp
- Ingen kontroll att kassören inte godkänner egna utlägg (segregation of duties)
- Inget krav på styrelsebeslut för belopp över viss gräns
- Inget attestflöde med flera godkännare

### 8. Ekonomisk rapportering saknas

- Ingen resultaträkning eller balansräkning
- Ingen kassaflödesrapport
- Ingen export av ekonomisk data
- Dagordningspunkten "Ekonomisk rapport" har ingen koppling till faktisk data

### 9. Revision — begränsad åtkomst

- Kassören kan bara SE revision (`audit:view`)
- Kan inte skicka underlag till revisor
- Kan inte se revisionsanmärkningar
- Årsredovisning kan skapas men ingen koppling till faktisk ekonomisk data

## Jämförelse: Kassör vs Ordförande

| Förmåga | Kassör | Ordförande |
|---------|:-:|:-:|
| Godkänna utlägg | Y | Y |
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
| 1 | **Kassör-dashboard** | Samlad ekonomisk översikt: väntande utlägg, utgifter per månad, likviditet |
| 2 | **Ge kassör ekonomi-permissions** | Kassör måste kunna se/redigera bankuppgifter, räkenskapsår, avgifter |
| 3 | **Kvittouppladdning i utlägg** | receiptUrl finns i schemat, behöver UI |
| 4 | **Utläggsvalidering** | Beloppsgränser, hindra godkännande av egna utlägg |
| 5 | **Firmateckningsvalidering** | Koppla signatoryRule till godkännandeflöden |
| 6 | **Ekonomisk rapportering** | Sammanställning per kategori/period, underlag för årsredovisning |
| 7 | **Avgiftshantering** | Beräkning och avisering av månadsavgifter baserat på andelstal |
| 8 | **Budgetverktyg** | Budget per kategori med uppföljning och varningar |
