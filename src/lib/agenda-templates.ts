export type AgendaTemplate = {
  title: string;
  description?: string;
  duration?: number;
  specialType?: "OPENING" | "ATTENDANCE" | "QUORUM_CHECK" | "ELECT_CHAIR" | "ELECT_SECRETARY" | "ELECT_ADJUSTERS" | "AUDIT_REPORT" | "DISCHARGE_VOTE" | "BOARD_ELECTION" | "SUBSTITUTE_ELECTION" | "AUDITOR_ELECTION" | "ELECT_NOMINATING_COMMITTEE" | "MOTIONS" | "BOARD_MATTERS";
};

export const BOARD_MEETING_TEMPLATE: AgendaTemplate[] = [
  { title: "Mötets öppnande", duration: 2, specialType: "OPENING" },
  { title: "Närvarokontroll", description: "Fastställande av närvarande styrelseledamöter och beslutförhet.", duration: 5, specialType: "ATTENDANCE" },
  { title: "Beslut om styrelsemötets behörighet", description: "Prövning av om mötet uppfyller stadgarnas krav på beslutförhet och behörig kallelse.", duration: 3, specialType: "QUORUM_CHECK" },
  { title: "Val av mötesordförande", description: "Om annan än ordinarie ordförande ska leda mötet.", duration: 2, specialType: "ELECT_CHAIR" },
  { title: "Val av mötessekreterare", duration: 2, specialType: "ELECT_SECRETARY" },
  { title: "Val av justerare", duration: 2, specialType: "ELECT_ADJUSTERS" },
  { title: "Godkännande av dagordning", duration: 2 },
  { title: "Föregående mötesprotokoll", description: "Godkännande och uppföljning av beslut från föregående möte.", duration: 10 },
  { title: "Ekonomisk rapport", description: "Kassören redovisar föreningens ekonomiska ställning.", duration: 10 },
  { title: "Fastighetsförvaltning", description: "Pågående och planerade underhållsåtgärder, felanmälningar.", duration: 15 },
  { title: "Inkomna skrivelser och ärenden", description: "Inlämnade motioner, förslag från boende och övriga inkomna ärenden.", duration: 10, specialType: "BOARD_MATTERS" },
  { title: "Nya ärenden", description: "Övriga frågor som styrelseledamöter vill ta upp.", duration: 15 },
  { title: "Nästa möte", description: "Beslut om datum och tid för nästa styrelsemöte.", duration: 5 },
  { title: "Mötets avslutande", duration: 1 },
];

export const ANNUAL_MEETING_TEMPLATE: AgendaTemplate[] = [
  { title: "Mötets öppnande", duration: 2, specialType: "OPENING" },
  { title: "Upprättande av röstlängd", description: "Fastställande av närvarande medlemmar och ombud.", duration: 10, specialType: "ATTENDANCE" },
  { title: "Val av mötesordförande", duration: 5, specialType: "ELECT_CHAIR" },
  { title: "Val av mötessekreterare", duration: 2, specialType: "ELECT_SECRETARY" },
  { title: "Val av justerare tillika rösträknare", duration: 5, specialType: "ELECT_ADJUSTERS" },
  { title: "Fråga om stämman blivit behörigen kallad", description: "Kallelse ska ha skickats senast 2 veckor före ordinarie stämma.", duration: 2, specialType: "QUORUM_CHECK" },
  { title: "Godkännande av dagordning", duration: 2 },
  { title: "Styrelsens årsredovisning", description: "Förvaltningsberättelse samt resultat- och balansräkning.", duration: 15 },
  { title: "Revisionsberättelse", description: "Revisorn redogör för sin granskning.", duration: 10, specialType: "AUDIT_REPORT" },
  { title: "Fastställande av resultat- och balansräkning", duration: 5 },
  { title: "Fråga om ansvarsfrihet för styrelsen", description: "Stämman beslutar om styrelseledamöterna beviljas ansvarsfrihet.", duration: 5, specialType: "DISCHARGE_VOTE" },
  { title: "Beslut om resultatdisposition", description: "Hantering av årets resultat (vinst eller förlust).", duration: 5 },
  { title: "Beslut om arvoden", description: "Arvoden för styrelse och revisor kommande verksamhetsår.", duration: 5 },
  { title: "Beslut om årsavgift och budget", description: "Styrelsens förslag till budget och eventuell avgiftsändring.", duration: 10 },
  { title: "Val av styrelseledamöter", description: "Val av ordinarie ledamöter enligt stadgarna.", duration: 10, specialType: "BOARD_ELECTION" },
  { title: "Val av styrelsesuppleanter", duration: 5, specialType: "SUBSTITUTE_ELECTION" },
  { title: "Val av revisor", description: "Val av revisor och eventuell revisorssuppleant.", duration: 5, specialType: "AUDITOR_ELECTION" },
  { title: "Val av valberedning", duration: 5, specialType: "ELECT_NOMINATING_COMMITTEE" },
  { title: "Motioner", description: "Behandling av inkomna motioner från medlemmar. Motioner från verksamhetsåret kopplas automatiskt.", duration: 20, specialType: "MOTIONS" },
  { title: "Övriga ärenden", duration: 10 },
  { title: "Mötets avslutande", duration: 1 },
];

export const EXTRAORDINARY_MEETING_TEMPLATE: AgendaTemplate[] = [
  { title: "Mötets öppnande", duration: 2, specialType: "OPENING" },
  { title: "Upprättande av röstlängd", description: "Fastställande av närvarande medlemmar och ombud.", duration: 5, specialType: "ATTENDANCE" },
  { title: "Val av mötesordförande", duration: 3, specialType: "ELECT_CHAIR" },
  { title: "Val av mötessekreterare", duration: 2, specialType: "ELECT_SECRETARY" },
  { title: "Val av justerare tillika rösträknare", duration: 3, specialType: "ELECT_ADJUSTERS" },
  { title: "Fråga om stämman blivit behörigen kallad", description: "Kallelse ska ha skickats senast 2 veckor före extra stämma.", duration: 2, specialType: "QUORUM_CHECK" },
  { title: "Godkännande av dagordning", duration: 2 },
  { title: "Anledning till extra stämma", description: "Redogörelse för varför extra stämma har kallats.", duration: 10 },
  { title: "Behandling av ärende", description: "Det ärende som föranlett den extra stämman. Ersätt denna punkt med det specifika ärendet.", duration: 20 },
  { title: "Beslut", description: "Stämman beslutar i det aktuella ärendet.", duration: 10 },
  { title: "Mötets avslutande", duration: 1 },
];

export function getTemplate(type: string): AgendaTemplate[] {
  switch (type) {
    case "BOARD": return BOARD_MEETING_TEMPLATE;
    case "ANNUAL": return ANNUAL_MEETING_TEMPLATE;
    case "EXTRAORDINARY": return EXTRAORDINARY_MEETING_TEMPLATE;
    default: return [];
  }
}
