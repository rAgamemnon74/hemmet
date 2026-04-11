# CX/UX Flödesanalys — Hemmet

## Princip

Systemet har **funktioner** men saknar **flöden**. En funktion är en knapp. Ett flöde är en resa med tydlig start, steg och mål. Användare tänker inte i funktioner — de tänker "jag ska ordna ett styrelsemöte" eller "jag vill rapportera att det läcker i taket".

---

## Flöde 1: Ordna styrelsemöte (Ordförande)

### Önskat flöde
```
"Jag behöver ordna ett styrelsemöte" →
  1. Välj datum/tid/plats →
  2. Dagordning (mall eller manuell) →
  3. Tilldela roller (ordförande, sekreterare, justerare) →
  4. Förhandsgranska →
  5. Publicera → Klart!
```

### Nuvarande flöde
```
Möten → Nytt möte → Fyll i formulär → Skapa →
  → Landar på mötesdetalj med 5 flikar
  → Måste veta att man ska:
    1. Klicka "Dagordning"-flik → redigera
    2. Klicka "Mötesroller"-flik → tilldela
    3. Klicka "Publicera kallelse"
  → Ingen guide, ingen checklista, ingen ordning
```

### Problem
- **Inget sammanhängande flöde** — användaren måste själv navigera mellan flikar
- **Ingen "är jag klar?"-indikator** — vet inte om allt är redo för publicering
- **Roller kan missas** — inget krav att tilldela ordförande/sekreterare innan publicering

### Föreslagen förbättring
**Checklista i mötes-headern:**
```
☐ Dagordning klar (X punkter)
☐ Mötesordförande tilldelad
☐ Sekreterare tilldelad  
☐ Justerare tilldelade (X av Y)
☑ Datum och plats satt
→ [Publicera kallelse] (aktiv först när alla checkpunkter OK)
```

---

## Flöde 2: Genomföra styrelsemöte (Ordförande + Sekreterare)

### Önskat flöde
```
Mötet börjar →
  1. Starta mötet →
  2. Närvarokontroll (QR eller manuell) →
  3. Beslutförhet bekräftad →
  4. Punkt för punkt: diskussion → anteckna → eventuellt beslut →
  5. Avsluta → Efterbehandling
```

### Nuvarande flöde
```
Möte-detalj → Klicka "Starta möte" →
  → Admin-vy öppnas i samma flik
  → Presentation i ny flik (manuellt)
  → Navigera punkt för punkt med pilar
  → Sekreteraren... var antecknar hen? (nu fixat med notes-fält)
  → Dokumentera beslut via dold knapp per punkt
  → Klicka "Avsluta → Efterbehandling"
```

### Problem
- **Admin och presentation är separata** — ordförande behöver två skärmar
- **Ingen "mötesvyn" för deltagare** — ledamöter ser ingenting live
- **Beslutsdokumentation känns som efterhandskonstruktion** — gömd bakom "Dokumentera beslut"
- **Jävsdeklaration nu integrerad** (fixad) men jävsregistret (förebyggande) syns inte

### Föreslagen förbättring
**Tre parallella vyer:**
1. **Ordförande-admin** (surfplatta/laptop): Navigera dagordning, kontrollera flöde
2. **Sekreterare-vy** (laptop): Anteckningar fokus, dagordning som referens
3. **Deltagarvy** (mobil): Visa aktuell punkt, röstknapp, jävs-flaggning

---

## Flöde 3: Skriva protokoll (Sekreterare)

### Önskat flöde
```
Mötet avslutat →
  1. Öppna protokoll →
  2. Autogenererat utkast väntar →
  3. Redigera/komplettera →
  4. Slutbehandla →
  5. Ordförande + justerare signerar →
  6. Arkivera → Klart!
```

### Nuvarande flöde
```
Möte-detalj → Protokoll-flik →
  → Tom textarea (eller "Generera utkast" om tom)
  → Skriva/redigera
  → Klicka "Slutbehandla"
  → Vänta på att ordförande + justerare signerar
    → De får notis men hamnar på mötet, inte på protokollet
  → Klicka "Arkivera" → Klart
```

### Problem
- **Utkast genereras bara om fältet är tomt** — kan inte regenerera
- **Signerare landar på mötesdetalj, inte protokoll-fliken** — extra klick
- **Ingen statusvy** — vem har signerat, vem saknas?
- **Ingen deadline-indikator** — sekreteraren ser inte att det brinner

### Föreslagen förbättring
- **Auto-generera utkast direkt vid FINALIZING** — visa "Utkast baserat på möteslogg" automatiskt
- **Djuplänk i notifiering**: `/styrelse/moten/{id}?tab=protocol`
- **Signerings-panel**: "✓ Anna (signerat 15 mars) / ⏳ Bengt (inväntar)"
- **Deadline-banner**: "5 dagar kvar att slutbehandla (stadgekrav: 3 veckor)"

---

## Flöde 4: Felanmäla (Boende/Medlem)

### Önskat flöde
```
"Det läcker i taket" →
  1. Ny felanmälan →
  2. Beskriv, välj plats, välj allvarlighet →
  3. Skicka → Bekräftelse →
  4. Få uppdateringar när status ändras
```

### Nuvarande flöde
```
Boende → Felanmälan → "Ny felanmälan" →
  → Formulär: titel, beskrivning, plats, allvarlighet
  → Skicka → Redirect till detaljsida
  → Sen... ingenting. Ingen notifiering vid statusändring.
  → Måste manuellt gå tillbaka och kolla.
```

### Problem
- **Ingen bekräftelse-toast** — skickar och landar på detaljsida utan bekräftelse
- **Ingen push-notifiering** vid statusändring — "din felanmälan har åtgärdats"
- **Ingen fotoupladdning** — boende vill visa vad som är fel
- **Ingen tidslinje** — vad händer med ärendet? Ingen synlig progress

### Föreslagen förbättring
- **Toast vid skapande**: "Felanmälan skickad! Du får en notis när statusen ändras."
- **Notifiering vid varje statusändring** till rapportör
- **Tidslinje på detaljsidan**: "10 mars: Inskickad → 12 mars: Bekräftad → 15 mars: Pågår"
- **Fotoknapp** i formuläret (mobilkamera direkt)

---

## Flöde 5: Andrahandsuthyrning (Medlem)

### Önskat flöde
```
"Jag vill hyra ut i andrahand" →
  1. Se regler (hur länge, avgift) →
  2. Fyll i ansökan →
  3. Skicka →
  4. Få besked →
  5. Om godkänd: avgiftsinfo + villkor
```

### Nuvarande flöde
```
Boende → Andrahand → ... (ingen sida existerar ännu, bara API)
```

### Problem
- **Hela flödet saknar UI** — routrar finns men inga sidor
- **Medlem vet inte vilka regler som gäller** — BrfRules har data men ingen medlemsvy
- **Ingen koppling till Min sida** — pågående ansökan syns inte där

### Föreslagen förbättring
- Skapa `/boende/andrahand` med: regler (från BrfRules), ansökningsformulär, mina ansökningar
- Koppla till Min sida → "Pågående ärenden"

---

## Flöde 6: Överlåtelse (Kassör/Ordförande)

### Önskat flöde
```
"Mäklaren ringer — lägenhet 2001 säljs" →
  1. Skapa ärende (typ, parter, tillträdesdag) →
  2. Medlemsprövning (checklist) →
  3. Styrelsebeslut →
  4. Ekonomisk reglering →
  5. Ägarskifte → Klart
```

### Nuvarande flöde
```
Styrelse → Överlåtelser → Nytt ärende → ... (ingen "nytt"-sida existerar ännu)
→ Lista finns, detaljvy finns, men skapa-sida saknas
```

### Problem
- **Ingen skapa-sida** — routern stöder create men inget formulär
- **Länken "Nytt ärende" i listan pekar på `/styrelse/overlatelser/nytt`** — 404
- **Prövnings-checklista fungerar** men ingen vägledning om vad som krävs

### Föreslagen förbättring
- Skapa `/styrelse/overlatelser/nytt` med formulär (typ, lägenhet, parter, datum)
- Steg-guide: "1. Grunduppgifter → 2. Medlemsprövning → 3. Styrelsebeslut → 4. Ekonomi → 5. Slutför"

---

## Flöde 7: Bokningssystem (Boende)

### Önskat flöde
```
"Jag vill boka tvättstugan" →
  1. Se tillgängliga tider →
  2. Välj tid →
  3. Boka → Bekräftelse →
  4. Påminnelse innan
```

### Nuvarande flöde
```
Boende → Boka → ... (ingen sida existerar ännu, bara API)
```

### Problem
- **Hela flödet saknar UI** — BookableResource + Booking finns men inga sidor
- **Ingen kalendervy** — bara API

### Föreslagen förbättring
- Skapa `/boende/boka` med: resurs-lista, kalendervy per resurs, boka/avboka

---

## Sammanfattning: Flöden vs funktioner

| Flöde | API/Backend | UI/Frontend | Sammanhängande? |
|-------|:-----------:|:-----------:|:---------------:|
| Styrelsemöte (skapa) | OK | OK men spretigt | Saknar wizard/checklista |
| Styrelsemöte (genomföra) | OK | Admin + presentation | Saknar deltagarvy |
| Protokoll | OK | OK | Saknar auto-start + signerings-panel |
| Felanmälan | OK | OK | Saknar toast + notifiering + tidslinje |
| Andrahand | OK | **Saknar UI helt** | — |
| Renovering | OK | **Saknar UI helt** | — |
| Störning | OK | **Saknar UI helt** | — |
| Överlåtelse | OK | Saknar skapa-sida | — |
| Bokning | OK | **Saknar UI helt** | — |
| Min sida | OK | OK | Bra flöde |
| Dashboard | OK | OK | Bra flöde |

### Prioritering: Saknade UI-sidor

| Prio | Sida | Berör | Komplexitet |
|------|------|-------|:-----------:|
| 1 | `/boende/boka` — bokningskalender | Alla boende | Medel |
| 2 | `/boende/andrahand` — ansökningsflöde | Medlemmar | Medel |
| 3 | `/boende/renovering` — ansökningsflöde | Medlemmar | Medel |
| 4 | `/boende/storningar` — anmälningsflöde | Alla boende | Medel |
| 5 | `/styrelse/overlatelser/nytt` — skapa ärende | Kassör/Ordförande | Låg |
| 6 | Möteschecklista i meeting-header | Ordförande | Låg |
| 7 | Signerings-panel i protokoll-flik | Sekreterare | Låg |
| 8 | Tidslinje på felanmälan-detalj | Alla boende | Låg |
