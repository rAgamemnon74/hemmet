/**
 * K3-komponentstandard — typiska livslängder och kategorier
 * för bostadsrättsföreningar.
 *
 * Baserat på branschpraxis och BFN:s vägledning BFNAR 2012:1 (K3).
 */

export type ComponentTemplate = {
  category: string;
  name: string;
  typicalLifespan: number; // År
  description: string;
};

export const K3_COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // Tak
  { category: "ROOF", name: "Yttertak — tegel/betongpannor", typicalLifespan: 50, description: "Takpannor, underlagsduk, läkt" },
  { category: "ROOF", name: "Yttertak — plåt", typicalLifespan: 40, description: "Plåttak, falsad eller profilerad" },
  { category: "ROOF", name: "Yttertak — papp/membran (platt tak)", typicalLifespan: 25, description: "Takpapp, takmembran" },
  { category: "ROOF", name: "Takavvattning", typicalLifespan: 40, description: "Hängrännor, stuprör, brunnar" },

  // Fasad
  { category: "FACADE", name: "Fasad — puts", typicalLifespan: 40, description: "Putsfasad, ommålning/omputsning" },
  { category: "FACADE", name: "Fasad — tegel", typicalLifespan: 60, description: "Tegelfasad, fogning" },
  { category: "FACADE", name: "Fasad — trä", typicalLifespan: 20, description: "Träpanel, ommålning" },
  { category: "FACADE", name: "Balkonger", typicalLifespan: 40, description: "Balkongplattor, räcken, tätskikt" },

  // Fönster & dörrar
  { category: "WINDOWS", name: "Fönster — trä", typicalLifespan: 30, description: "Träfönster, kopplade/isolerglas" },
  { category: "WINDOWS", name: "Fönster — trä/aluminium", typicalLifespan: 40, description: "Kombifönster trä/alu" },
  { category: "WINDOWS", name: "Entréportar", typicalLifespan: 35, description: "Ytterdörrar, entrésystem, porttelefon" },

  // Stammar & VVS
  { category: "PLUMBING", name: "Stammar — avlopp", typicalLifespan: 50, description: "Avloppsstammar, gjutjärn/plast" },
  { category: "PLUMBING", name: "Stammar — vatten (kallvatten)", typicalLifespan: 50, description: "Vattenledningar, koppar/plast" },
  { category: "PLUMBING", name: "Stammar — varmvatten/cirkulation", typicalLifespan: 40, description: "VVC-system, cirkulationspump" },
  { category: "PLUMBING", name: "Badrumsrenovering (gemensamt)", typicalLifespan: 30, description: "Tätskikt, kakel, blandare i gemensamma utrymmen" },

  // El
  { category: "ELECTRICAL", name: "Elstammar / stigarledningar", typicalLifespan: 50, description: "Elcentraler, stigarledningar, jordfelsbrytare" },
  { category: "ELECTRICAL", name: "Belysning gemensamma utrymmen", typicalLifespan: 15, description: "Armaturer, trapphusbelysning, LED-byte" },
  { category: "ELECTRICAL", name: "Porttelefon / passagesystem", typicalLifespan: 15, description: "Porttelefon, tagg-/kodsystem" },

  // Ventilation
  { category: "VENTILATION", name: "Ventilationsaggregat (FTX)", typicalLifespan: 20, description: "FTX-aggregat med värmeåtervinning" },
  { category: "VENTILATION", name: "Ventilationskanaler", typicalLifespan: 50, description: "Kanaler, don, spjäll" },
  { category: "VENTILATION", name: "Frånluftsfläktar", typicalLifespan: 15, description: "Takfläktar, kanalfläktar" },

  // Hiss
  { category: "ELEVATOR", name: "Hiss — komplett", typicalLifespan: 30, description: "Hissmaskineri, korg, dörrar, styrsystem" },
  { category: "ELEVATOR", name: "Hiss — styrsystem", typicalLifespan: 15, description: "Modernisering av styrsystem" },

  // Grund & stomme
  { category: "FOUNDATION", name: "Grund / källare", typicalLifespan: 80, description: "Grundförstärkning, dränering" },
  { category: "DRAINAGE", name: "Dränering", typicalLifespan: 40, description: "Dräneringssystem runt fastigheten" },

  // Värmesystem
  { category: "HEATING", name: "Fjärrvärmecentral", typicalLifespan: 25, description: "Värmeväxlare, pumpar, styrning" },
  { category: "HEATING", name: "Radiatorer", typicalLifespan: 50, description: "Radiatorer, termostater" },
  { category: "HEATING", name: "Bergvärme / värmepump", typicalLifespan: 20, description: "Värmepump, borrhål" },

  // Gemensamma utrymmen
  { category: "COMMON_AREAS", name: "Tvättstuga — maskiner", typicalLifespan: 12, description: "Tvättmaskiner, torktumlare, mangel" },
  { category: "COMMON_AREAS", name: "Tvättstuga — ytskikt", typicalLifespan: 25, description: "Golv, väggar, ventilation" },
  { category: "COMMON_AREAS", name: "Trapphusrenovering", typicalLifespan: 25, description: "Målning, golv, ledstänger" },

  // Garage/parkering
  { category: "PARKING", name: "Garage — betongdäck", typicalLifespan: 40, description: "Betongdäck, membran, avvattning" },
  { category: "PARKING", name: "Garageport", typicalLifespan: 20, description: "Garageport med motor och styrning" },
  { category: "PARKING", name: "Laddinfrastruktur — ledning/kabelstegar", typicalLifespan: 30, description: "Tomrör, kabelstegar, elmatning till parkeringsplatser. Krav vid nybyggnation (BBR) och >20 platser." },
  { category: "PARKING", name: "Laddstolpar/laddboxar", typicalLifespan: 10, description: "Laddpunkter för elfordon. Lastbalansering, mätning, underhåll." },
  { category: "PARKING", name: "Lastbalanseringssystem", typicalLifespan: 8, description: "Smart styrning som fördelar tillgänglig effekt mellan laddpunkter." },

  // Utemiljö
  { category: "OUTDOOR", name: "Asfaltytor", typicalLifespan: 25, description: "Parkering, gångvägar" },
  { category: "OUTDOOR", name: "Lekplats", typicalLifespan: 15, description: "Lekutrustning, fallskydd" },
  { category: "OUTDOOR", name: "Planteringar / trädgård", typicalLifespan: 20, description: "Buskar, träd, staket, belysning" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  ROOF: "Tak",
  FACADE: "Fasad",
  WINDOWS: "Fönster & dörrar",
  PLUMBING: "Stammar & VVS",
  ELECTRICAL: "El",
  VENTILATION: "Ventilation",
  ELEVATOR: "Hiss",
  BALCONY: "Balkonger",
  FOUNDATION: "Grund",
  DRAINAGE: "Dränering",
  HEATING: "Värmesystem",
  COMMON_AREAS: "Gemensamma utrymmen",
  PARKING: "Garage/parkering",
  OUTDOOR: "Utemiljö",
  OTHER: "Övrigt",
};

export const CONDITION_LABELS: Record<string, string> = {
  GOOD: "Bra skick",
  FAIR: "Godkänt",
  POOR: "Slitet",
  CRITICAL: "Akut",
};

export const CONDITION_COLORS: Record<string, string> = {
  GOOD: "bg-green-100 text-green-700",
  FAIR: "bg-blue-100 text-blue-700",
  POOR: "bg-amber-100 text-amber-700",
  CRITICAL: "bg-red-100 text-red-700",
};
