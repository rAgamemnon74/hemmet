# CX/UX-analys: Styrelsemötet i Hemmet

## Tre perspektiv, en resa

Ett styrelsemöte involverar tre distinkta faser och minst tre rollperspektiv. Varje brister i flödet multipliceras med antalet deltagare.

| Fas | Ordförande | Sekreterare | Ledamot |
|-----|-----------|-------------|---------|
| **Före** | Skapar möte, dagordning, kallar | — | Ska förbereda sig |
| **Under** | Leder, navigerar dagordning | Antecknar | Deltar, röstar |
| **Efter** | Signerar protokoll | Skriver protokoll, slutbehandlar | Läser protokoll, följer upp uppgifter |

---

## Fas 1: Före mötet

### Ordförandens resa

```
Möten-lista → "Nytt möte" → Formulär → Dagordning → Roller → Publicera
```

**Vad som fungerar:**
- Skapa möte med mall — ett klick ger full dagordning
- Dagordningsmallar anpassade per mötestyp (14/21/11 punkter)
- Publicera kallelse med kallelsetids-validering

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **Ingen steg-för-steg-guide** vid skapande | Ordförande skapar möte men vet inte att roller/dagordning behöver sättas INNAN publicering | Wizard: Skapa → Dagordning → Roller → Förhandsgranska → Publicera |
| **Ingen förhandsgranskning av kallelse** | Vet inte hur kallelsen ser ut innan den "publiceras" | Förhandsvisning av kallelse med dagordning, tid, plats |
| **Mötesadmin + Presentation visas alltid** men är mest relevanta under IN_PROGRESS | Visuell brus i DRAFT-fasen | Tonade/dolda i DRAFT, framhävda i IN_PROGRESS |
| **Ingen påminnelse till ledamöter** | Ledamöter vet inte att möte finns | Notifiering vid SCHEDULED (implementerad men ingen e-post) |
| **Inget "inför mötet"-paket** | Ledamöter måste manuellt navigera runt för att förbereda sig | Dashboard-vyn visar nästa möte (implementerad) men saknar samlat underlag |

### Ledamotens resa

```
Dashboard → Ser "Nästa möte" → Klickar → Möte-detalj → Läser dagordning → Klart?
```

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **Inget samlat "mötespaket"** | Ledamoten ser dagordningen men inte underlagen (föregående protokoll, öppna ärenden, motioner att diskutera) | "Förbered inför möte"-knapp som samlar allt i en vy |
| **Ingen indikation på vad som är nytt** | Ledamoten vet inte vilka punkter som lagts till sedan förra gången hen tittade | Markera nya/ändrade punkter |
| **Inget sätt att anmäla jäv i förväg** | Jäv kan bara deklareras under mötet | Möjlighet att flagga potentiellt jäv före mötet |

---

## Fas 2: Under mötet

### Ordförandens resa (Mötesadmin)

```
Mötesadmin → Starta möte → Navigera punkter → Registrera närvaro → Fatta beslut → Avsluta
```

**Vad som fungerar:**
- Mötesadmin med dagordning till vänster, innehåll till höger
- Navigeringsknappar (Föregående/Nästa) för att stega genom dagordningen
- Presentationsvy i separat fönster (mörkt tema, stor text)
- Specialpunkter (ATTENDANCE, ELECT_CHAIR etc.) med dedikerad UI
- QR-kod för självregistrering under OPENING/ATTENDANCE

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **Ingen visuell koppling admin ↔ presentation** | Ordförande ser admin men vet inte exakt vad som visas i presentationen | Miniatyr-förhandsvisning av presentationsvyn i admin |
| **Beslutsregistrering gömd bakom "Dokumentera beslut"** | Knappen ser ut som en sekundär åtgärd, inte som mötets kärna | Beslut bör vara mer framträdande — alltid synlig per dagordningspunkt |
| **Ingen timer per punkt** | Duration finns i mallen men ingen nedräkning/påminnelse under mötet | Valfri timer som varnar när tiden för en punkt löper ut |
| **Jävsdeklaration inte integrerad i beslutsflödet** | Jäv registreras separat, inte som en naturlig del av "fatta beslut" | Integrera jävsfråga direkt i beslutsformuläret: "Är någon jävig?" → checkbox → jävsanledning |
| **Beslutförhet visas bara vid IN_PROGRESS** | Borde visas kontinuerligt i admin-vyn | Kvarorum-indikator alltid synlig i admin-header |
| **Inget "ångra"-flöde vid statusändring** | Klicka "Avsluta → Efterbehandling" av misstag = svårt att gå tillbaka | Bekräftelsedialog vid statusändringar |

### Sekreterarens resa (Under mötet)

```
Mötesadmin → Antecknar per punkt → Mötet avslutas → Möteslogg genereras
```

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **Ingen dedikerad sekreterarvy** | Sekreteraren ser samma admin som ordförande, inget fokus på anteckningar | Sekreterarläge: primärt anteckningsfält, dagordning som referens |
| **Anteckningsfältet (notes) inte synligt i admin** | `agenda.updateNotes` finns men inget UI i admin-vyn | Textfält per dagordningspunkt i admin under mötet |
| **Ingen autosave på anteckningar** | Sekreteraren kan förlora anteckningar vid siduppdatering | Autosave med debounce (3 sek) |

### Ledamotens resa (Under mötet)

```
Checkar in via QR → Följer presentation → Röstar → Klart
```

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **Ingen interaktiv vy för ledamöter** | Ledamöter kan checka in och sedan... ingenting. Ingen live-vy att följa | "Deltagarvy" — lätt version av presentationen med aktuell punkt och röstknapp |
| **Röstning sker bara via admin** | Ledamöter kan inte rösta direkt från sin telefon | Möjlighet att rösta via självbetjäning (som incheckning) |
| **Ingen bekräftelse att röst registrerats** | Ordförande säger "alla som är för?" men systemet bekräftar inte | Individuell röstbekräftelse om digital röstning används |

---

## Fas 3: Efter mötet

### Sekreterarens resa (Protokoll)

```
Möte avslutat → Protokoll-flik → Generera utkast → Redigera → Slutbehandla → Invänta signering → Arkivera
```

**Vad som fungerar:**
- Autogenerera utkast från möteslogg (närvaro, beslut, röstresultat, jäv)
- Protokollets livscykel: DRAFT → FINALIZED → SIGNED → ARCHIVED
- Sekreteraren kan återöppna om korrigeringar behövs
- Signerare notifieras

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **"Generera utkast" syns bara om innehållet är tomt** | Om sekreteraren börjat skriva manuellt och sedan vill regenerera → knappen är borta | Knapp "Regenerera från möteslogg" med varning "Befintligt innehåll skrivs över" |
| **Ingen diff vid regenerering** | Vet inte vad som ändrades vs manuellt skrivet | Visa diff eller markera autogenererat vs manuellt |
| **Ingen deadline-indikator i UI** | `protocolDeadlineWeeks` finns men sekreteraren ser inte nedräkningen | "X dagar kvar att slutbehandla" i protokoll-fliken |
| **Signeringsflödet saknar tydlig status per person** | "2 signaturer" men vem har signerat och vem saknas? | Lista signerare med status: ✓ Anna (signerat 15 mars), ⏳ Bengt (inväntar) |

### Ordförandens resa (Signering)

```
Notifiering → Protokoll-flik → Läsa igenom → Signera → Klart
```

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **Notifiering leder till mötet, inte direkt till protokoll-fliken** | Extra klick: möte → klicka "Protokoll"-fliken → hitta "Signera" | Djuplänk: `/styrelse/moten/{id}?tab=protocol` |
| **Ingen "jag har läst och godkänner"-bekräftelse** | Signering = ett klick utan bekräftelse att man faktiskt läst | Checkbox: "Jag har läst protokollet" innan "Signera" aktiveras |

### Ledamotens resa (Uppföljning)

```
Nästa möte → Dashboard → "Sedan sist" → Se beslut → Kolla mina uppgifter
```

**UX-problem:**

| Problem | Påverkan | Åtgärd |
|---------|----------|--------|
| **Beslut → uppgift skapas automatiskt men tilldelad ordförande** | Alla uppgifter hamnar hos ordförande, inte den som faktiskt ska utföra | Möjlighet att omtilldela direkt i beslutsformuläret |
| **Ingen koppling uppgift → nästa mötes dagordning** | Öppna uppgifter bör visas under "Föregående mötesprotokoll" | Automatisk punkt "Uppföljning av beslut" med öppna uppgifter |

---

## Övergripande CX-problem

### 1. Inget flöde — bara funktioner

Systemet har alla funktioner men inga **guider**. Användaren måste veta vad de ska göra. Det saknas:
- Steg-för-steg vid första mötet
- Checklista: "Innan du publicerar: ✓ dagordning klar, ✓ roller tilldelade, ✓ tid/plats satt"
- Progressindikator: var i mötets livscykel befinner vi oss?

### 2. Ingen mobilanpassning uttryckligen designad

Styrelsemöten sker fysiskt — deltagare har telefonen, inte laptopen. Kritiskt att:
- QR-incheckning fungerar mobilt (OK)
- Presentationsvy är läsbar på stor skärm (OK)
- Admin-vy fungerar på surfplatta (Oklart — 3-kolumnslayout kan kräva scroll)
- Deltagarvy saknas helt (mobil first)

### 3. Feedback-fattigdom

Systemet bekräftar sällan vad som hänt:
- Statusändring: ingen toast/bekräftelse, bara siduppdatering
- Beslut registrerat: inget visuellt bekräftelse-ögonblick
- Signering: "Signerat" visas men ingen celebration
- Export/loggning: sker tyst i bakgrunden

### 4. Parallella flöden utan synkronisering

- Mötesadmin och presentation pollar oberoende (3s vs 5s)
- Två personer kan redigera protokollet samtidigt i DRAFT (sista skrivare vinner)
- Ingen indikation om andra är online/redigerar

---

## Prioriterad UX-förbättringslista

| Prio | Förbättring | Fas | Komplexitet |
|------|------------|-----|:-----------:|
| 1 | **Bekräftelsedialoger vid statusändringar** | Under | Låg |
| 2 | **Jävsdeklaration integrerad i beslutsformulär** | Under | Låg |
| 3 | **Anteckningsfält per punkt i mötesadmin** | Under | Låg |
| 4 | **Signerings-statuslista** (vem har/har inte signerat) | Efter | Låg |
| 5 | **Deadline-nedräkning i protokoll-flik** | Efter | Låg |
| 6 | **Checklista före publicering** | Före | Medel |
| 7 | **Mötesförberedelse-paket** (samlat underlag) | Före | Medel |
| 8 | **Deltagarvy** (mobil, följ med + rösta) | Under | Hög |
| 9 | **Sekreterarläge** i mötesadmin | Under | Medel |
| 10 | **Toast/bekräftelser** vid alla mutationer | Alla | Medel |
| 11 | **Progressindikator** för mötets livscykel | Alla | Låg |
| 12 | **Autosave** på anteckningar och protokoll | Under/Efter | Medel |
