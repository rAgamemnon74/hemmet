/**
 * Snabbtext-mallar för sekreterarens anteckningar per agendapunkt-typ.
 *
 * Används av AgendaNotesEditor för att erbjuda context-medvetna knappar.
 * Texter är formulerade i svensk protokoll-stil och följer respektive
 * mötestyp (styrelsemöte vs stämma).
 */

import type { AgendaItemType, MeetingType } from "@prisma/client";

export type AgendaSnippet = {
  label: string;          // Knapptext (kort)
  text: string;           // Texten som infogas i notes
  tip?: string;           // Valfri tooltip/description
};

export function getAgendaSnippets(
  specialType: AgendaItemType | null,
  meetingType: MeetingType,
  presenter: string,
): AgendaSnippet[] {
  const actor = meetingType === "BOARD" ? "Styrelsen" : "Stämman";
  const presenterName = presenter.trim();
  const byPresenter = (action: string) =>
    presenterName ? `${presenterName} ${action}` : `[Föredragande] ${action}`;

  switch (specialType) {
    case "OPENING":
      return [
        { label: "Öppnat", text: "Ordföranden förklarade mötet öppnat." },
      ];

    case "APPROVAL_AGENDA":
      return [
        { label: "Godkänd", text: `${actor} godkände dagordningen.` },
        { label: "Med tillägg", text: `${actor} godkände dagordningen med tillägg av ny punkt: `, tip: "Fortsätt skriva beskrivning av tilläggspunkt" },
        { label: "Med ändring", text: `${actor} godkände dagordningen med följande ändring: `, tip: "Fortsätt skriva vilken ändring" },
        { label: "Med strykning", text: `${actor} beslutade att stryka punkt [N] och godkände dagordningen i övrigt.` },
      ];

    case "ATTENDANCE":
      return meetingType === "BOARD"
        ? [
            { label: "Närvaro OK", text: "Närvaron konstaterades enligt bifogad närvarolista." },
            { label: "Ankomst", text: `[Namn] anlände vid kl [XX:XX] och adderades till närvaron.` },
          ]
        : [
            { label: "Röstlängd upprättad", text: "Röstlängd upprättades och godkändes av stämman." },
            { label: "Röstlängd justerad", text: "Röstlängden justerades efter [Namn]s ankomst kl [XX:XX]." },
          ];

    case "QUORUM_CHECK":
      return meetingType === "BOARD"
        ? [
            { label: "Beslutsmässigt", text: "Mötet konstaterades vara beslutsmässigt enligt stadgarnas krav." },
            { label: "Ej beslutsmässigt", text: "Mötet konstaterades EJ vara beslutsmässigt och avbröts.", tip: "Mycket ovanligt — sätt mötesstatus till CANCELLED efteråt" },
          ]
        : [
            { label: "Kallelse OK", text: "Stämman konstaterades ha blivit behörigen kallad." },
            { label: "Kallelse ej OK", text: "Kallelsen konstaterades EJ ha skett i behörig ordning. Stämman kan därmed endast besluta i frågor som alla röstberättigade samtycker till.", tip: "Konsekvens enligt BRL" },
          ];

    case "ELECT_CHAIR":
      return [
        { label: "Vald", text: `Till mötesordförande valdes ${presenterName || "[Namn]"}.` },
        { label: "Enhälligt", text: `${presenterName || "[Namn]"} valdes enhälligt till mötesordförande.` },
      ];

    case "ELECT_SECRETARY":
      return [
        { label: "Vald", text: `Till mötessekreterare valdes ${presenterName || "[Namn]"}.` },
        { label: "Enhälligt", text: `${presenterName || "[Namn]"} valdes enhälligt till mötessekreterare.` },
      ];

    case "ELECT_ADJUSTERS":
      return meetingType === "BOARD"
        ? [
            { label: "Valda enhälligt", text: `${actor} valde enhälligt [Namn] och [Namn] till justerare.` },
            { label: "Justerare noterade", text: "Justerare valdes enligt separat notering." },
          ]
        : [
            { label: "Valda enhälligt", text: `${actor} valde enhälligt [Namn] och [Namn] till justerare tillika rösträknare.` },
            { label: "Justerare noterade", text: "Justerare tillika rösträknare valdes enligt separat notering." },
          ];

    case "AUDIT_REPORT":
      return [
        { label: "Föredrag", text: byPresenter("föredrog revisionsberättelsen.") },
        { label: "Lades till", text: "Revisionsberättelsen lades till handlingarna." },
        { label: "Tillstyrker", text: "Revisorn tillstyrker att styrelsen beviljas ansvarsfrihet och att resultat- och balansräkningen fastställs." },
      ];

    case "DISCHARGE_VOTE":
      return [
        { label: "Beviljad", text: "Stämman beviljade styrelsens ledamöter ansvarsfrihet för det gångna räkenskapsåret." },
        { label: "Ej beviljad", text: "Stämman beviljade EJ styrelsens ledamöter ansvarsfrihet för det gångna räkenskapsåret.", tip: "Revisorn ska ha rekommenderat avslag eller reservation" },
      ];

    case "BOARD_ELECTION":
      return [
        { label: "Valberedningens förslag", text: "Valberedningens förslag antogs enhälligt." },
        { label: "Till styrelse valdes", text: "Till styrelseledamöter valdes: [Namn, Namn, Namn]." },
      ];

    case "SUBSTITUTE_ELECTION":
      return [
        { label: "Valberedningens förslag", text: "Valberedningens förslag antogs enhälligt." },
        { label: "Till suppleanter valdes", text: "Till styrelsesuppleanter valdes: [Namn, Namn]." },
      ];

    case "AUDITOR_ELECTION":
      return [
        { label: "Valberedningens förslag", text: "Valberedningens förslag antogs enhälligt." },
        { label: "Till revisor valdes", text: "Till revisor valdes [företag/namn], org.nr [XXX]." },
        { label: "Omval", text: "[Revisor] omvaldes för kommande räkenskapsår." },
      ];

    case "ELECT_NOMINATING_COMMITTEE":
      return [
        { label: "Till valberedning", text: "Till valberedning valdes: [Namn, Namn, Namn]." },
        { label: "Sammankallande", text: "Till sammankallande i valberedningen valdes [Namn]." },
      ];

    case "MEMBERSHIP_REVIEW":
      return [
        { label: "Godkända", text: `${actor} godkände samtliga beredda medlemsansökningar.` },
        { label: "Behandlade", text: `${actor} behandlade inkomna medlemsansökningar enligt separat beslut.` },
        { label: "Inga ansökningar", text: "Inga nya medlemsansökningar att behandla." },
      ];

    case "MOTIONS":
      return [
        { label: "Inga motioner", text: "Inga inkomna motioner att behandla." },
        { label: "Behandlade", text: "Inkomna motioner behandlades enligt separat beslut." },
      ];

    case "BOARD_MATTERS":
      return [
        { label: "Inga ärenden", text: "Inga inkomna ärenden eller motioner att behandla." },
        { label: "Behandlade", text: "Inkomna motioner och förslag behandlades enligt separat beslut." },
      ];

    case "CLOSING":
      return [
        { label: "Avslutat", text: "Ordföranden tackade för visat intresse och förklarade mötet avslutat." },
      ];

    default:
      // Generiska informationspunkter (ekonomisk rapport, fastighetsförvaltning, etc)
      return [
        { label: "Föredrag", text: byPresenter("föredrog punkten.") },
        { label: "Noterades", text: `${actor} noterade informationen.` },
        { label: "Lades till", text: "Rapporten lades till handlingarna." },
        { label: "Bordlades", text: "Ärendet bordlades till nästa möte." },
      ];
  }
}
