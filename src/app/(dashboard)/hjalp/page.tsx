"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  HelpCircle, ChevronDown, Home, Users, Shield, Calendar,
  Receipt, Wrench, FileText, BookOpen, Vote, CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

type HelpSection = {
  id: string;
  title: string;
  icon: typeof HelpCircle;
  forRoles?: string[];
  content: string;
};

const sections: HelpSection[] = [
  {
    id: "overview",
    title: "Vad är Hemmet?",
    icon: Home,
    content: `Hemmet är föreningens digitala plattform. Här hanteras allt från styrelsemöten och beslut till felanmälningar och bokningar.

**Alla boende** kan:
• Anmäla fel i fastigheten
• Lämna förslag till styrelsen
• Boka tvättstuga, bastu och andra gemensamma resurser
• Se meddelanden från styrelsen

**Medlemmar** (lägenhetsägare) kan dessutom:
• Lämna motioner inför stämman
• Rösta på årsmötet
• Ansöka om renovering eller andrahandsuthyrning
• Föreslå kandidater till valberedningen

**Styrelsemedlemmar** har tillgång till verktyg för möten, beslut, ekonomi och ärendehantering.

Din dashboard visar alltid vad som är relevant för just dig.`,
  },
  {
    id: "ordforande",
    title: "Ordförande — din roll i praktiken",
    icon: Shield,
    forRoles: ["BOARD_CHAIRPERSON"],
    content: `Som ordförande leder du styrelsen och är föreningens ansikte utåt. Du behöver inte kunna allt — men du behöver se till att rätt saker händer.

**Dina viktigaste uppgifter:**
• Kalla till och leda styrelsemöten (du skapar möten under Styrelse → Möten)
• Se till att beslut fattas och följs upp (du ser öppna ärenden under Ärenden)
• Godkänna utlägg tillsammans med kassören (under Styrelse → Utlägg)
• Hantera medlemsansökningar och överlåtelser
• Företräda föreningen utåt (myndigheter, mäklare, leverantörer)

**Vad du INTE behöver göra:**
• Skriva protokoll — det gör sekreteraren
• Sköta bokföring — det gör kassören eller förvaltaren
• Fixa saker i fastigheten — det gör fastighetsansvarig

**Firmateckning:**
Du är normalt firmatecknare tillsammans med kassören. Det betyder att ni två kan skriva under avtal för föreningens räkning.

**Utslagsröst:**
Om en omröstning slutar lika kan din röst vara avgörande — om stadgarna medger det.

**Tips:** Kolla dashboarden varje vecka. Där ser du om det finns ansökningar, utlägg eller ärenden som väntar på dig.`,
  },
  {
    id: "sekreterare",
    title: "Sekreterare — din roll i praktiken",
    icon: FileText,
    forRoles: ["BOARD_SECRETARY"],
    content: `Som sekreterare är du styrelsens dokumenterare. Du ser till att allt som beslutas skrivs ner och sparas.

**Dina viktigaste uppgifter:**
• Skriva mötesprotokoll (under Protokoll-fliken i varje möte)
• Anteckna under mötets gång (i mötesadmin under varje punkt)
• Slutbehandla och arkivera protokoll (UTKAST → SLUTBEHANDLAT → SIGNERAT → ARKIVERAT)
• Hjälpa ordförande med kallelser och dagordning

**Så här skriver du ett protokoll:**
1. Under mötet: anteckna under varje dagordningspunkt i mötesadmin
2. Efter mötet: gå till Protokoll-fliken och klicka "Generera utkast från möteslogg"
3. Redigera utkastet — det är ett förslag, inte det slutgiltiga protokollet
4. Klicka "Slutbehandla" — detta låser protokollet och notifierar ordförande + justerare att signera
5. När alla signerat: klicka "Arkivera"

**Deadline:** Protokollet ska vara klart inom ${3} veckor efter mötet (enligt stadgarna).

**Tips:** Generera utkastet direkt efter mötet medan allt är färskt. Du kan alltid redigera efteråt.`,
  },
  {
    id: "kassor",
    title: "Kassör — din roll i praktiken",
    icon: Receipt,
    forRoles: ["BOARD_TREASURER"],
    content: `Som kassör ansvarar du för föreningens ekonomi. Du behöver inte vara revisor — men du behöver ha koll.

**Dina viktigaste uppgifter:**
• Godkänna eller avslå utlägg (under Styrelse → Utlägg)
• Bevaka överlåtelseavgifter och pantsättningsavgifter (under Styrelse → Överlåtelser)
• Hålla koll på föreningens likviditet
• Förbereda underlag till årsberättelse (ekonomiavsnittet)
• Kontakta banken vid behov

**Utlägg:**
Styrelsemedlemmar lämnar in utlägg med kvitto. Du godkänner eller avslår. Systemet blockerar dig från att godkänna dina egna utlägg.

**Prisbasbelopp:**
Uppdatera prisbasbeloppet i januari varje år (under Inställningar). Det påverkar beräkningen av överlåtelse- och pantsättningsavgifter.

**Överlåtelser:**
Vid lägenhetsförsäljning beräknar systemet automatiskt överlåtelseavgiften. Du markerar den som betald.

**Vad du INTE behöver göra:**
• Bokföring — det sköter den ekonomiska förvaltaren
• Lönehantering — det sköter löneföretaget
• Ändra avgifter — det beslutas av styrelsen/stämman

**Tips:** Kolla dashboarden regelbundet. Där ser du väntande utlägg och obetalda avgifter.`,
  },
  {
    id: "fastighet",
    title: "Fastighetsansvarig — din roll i praktiken",
    icon: Wrench,
    forRoles: ["BOARD_PROPERTY_MGR"],
    content: `Som fastighetsansvarig har du koll på husets fysiska skick. Du behöver inte kunna fixa allt själv — men du behöver veta vad som behöver fixas.

**Dina viktigaste uppgifter:**
• Hantera felanmälningar (under Boende → Felanmälan — ändra status, kommentera)
• Bevaka besiktningar (OVK, hiss, brandskydd, energideklaration)
• Kontakta leverantörer och hantverkare
• Rapportera till styrelsen vid möten (dagordningspunkten "Fastighetsförvaltning")
• Bedöma renoveringsansökningar (teknisk bedömning)

**Felanmälningar:**
Boende rapporterar fel. Du bekräftar, prioriterar och ser till att de åtgärdas. Använd interna kommentarer (synliga bara för styrelsen) för anteckningar.

**Allvarlighetsgrader:**
• KRITISK — akut (vattenläcka, hissstopp) — åtgärda omedelbart
• HÖG — brådskande men inte akut (trasig entrédörr)
• NORMAL — kan planeras in (sliten trappbelysning)
• LÅG — kan vänta (kosmetiskt)

**Besiktningar:**
Vissa besiktningar är lagkrav (OVK, hiss). Systemet varnar när de förfaller. Se till att de bokas i tid.

**Tips:** Gå igenom felanmälningslistan varje vecka. Sortera efter allvarlighet — de kritiska först.`,
  },
  {
    id: "ledamot",
    title: "Ledamot — din roll i praktiken",
    icon: Users,
    forRoles: ["BOARD_MEMBER", "BOARD_ENVIRONMENT", "BOARD_EVENTS"],
    content: `Som styrelseledamot deltar du i alla beslut. Du har samma ansvar som ordförande och kassör — bara en annan roll i det dagliga arbetet.

**Ditt ansvar:**
• Delta i styrelsemöten och rösta (du har rösträtt i alla frågor)
• Hålla dig informerad om föreningens angelägenheter
• Följa upp uppgifter som tilldelas dig
• Anmäla jäv om du har personligt intresse i en fråga

**Solidariskt ansvar:**
Alla styrelseledamöter ansvarar solidariskt för styrelsens beslut. Det betyder att du inte kan skylla på att "kassören skötte det" — alla bär ansvaret gemensamt.

**Innan mötet:**
Kolla dashboarden — under "Årshjulet" ser du vad som hänt sedan förra mötet. Läs dagordningen i förväg.

**Under mötet:**
Var aktiv. Ställ frågor. Om du inte förstår — fråga. Det är bättre att fråga en gång för mycket än att rösta utan att förstå.

**Tips:** Svara alltid på kallelsen. Delta i alla möten. Ditt viktigaste bidrag är att vara närvarande och engagerad.`,
  },
  {
    id: "suppleant",
    title: "Suppleant — din roll i praktiken",
    icon: Users,
    forRoles: ["BOARD_SUBSTITUTE"],
    content: `Som suppleant är du styrelsens reserv. Du träder in när en ordinarie ledamot inte kan delta.

**I normalfallet:**
• Du får kallelser och kan följa styrelsens arbete
• Du ser möten, beslut och ärenden (läsbehörighet)
• Du deltar gärna på möten — men utan rösträtt om alla ordinarie är närvarande

**När du inträder:**
• Om en ordinarie ledamot är frånvarande — du får rösträtt för det mötet
• Om en ordinarie ledamot är jävig — du kan inträda för just den frågan
• Om en ordinarie ledamot avgår — du inträder permanent tills nästa stämma

**När du inträder har du samma ansvar som en ordinarie ledamot** — inklusive personligt ansvar.

**Tips:** Håll dig uppdaterad även om du sällan inträder. Läs protokollen. Då är du redo när det behövs.`,
  },
  {
    id: "revisor",
    title: "Revisor — din roll i praktiken",
    icon: BookOpen,
    forRoles: ["AUDITOR", "AUDITOR_SUBSTITUTE"],
    content: `Som revisor granskar du att styrelsen sköter sitt uppdrag och att ekonomin är korrekt. Du är oberoende av styrelsen.

**Dina uppgifter:**
• Granska årsredovisningen (under Revision → Årsrevision)
• Lämna revisionsberättelse med rekommendation
• Yttra dig om ansvarsfrihet för styrelsen

**Tre möjliga rekommendationer:**
• **Tillstyrker ansvarsfrihet** — allt ser bra ut
• **Tillstyrker med anmärkningar** — i huvudsak bra, men med noteringar
• **Avstyrker ansvarsfrihet** — allvarliga brister (sällsynt men viktigt)

**Du har tillgång till:**
• Styrelsens mötesprotokoll (läs)
• Ekonomisk information (utlägg, attestflöden)
• Medlemsregister
• Årsredovisningen

**Du har INTE tillgång till:**
• Redigera något — bara läsa och granska
• Styrelsemöten (du deltar inte)
• Individuella löner (finns inte i systemet)

**Oberoende:**
Du ska vara helt oberoende av styrelsen. Om du har nära relation till en styrelsemedlem — anmäl det.

**Tips:** Granska löpande under året, inte bara vid bokslutet. Ställ frågor till styrelsen — du har rätt att få svar.`,
  },
  {
    id: "medlem",
    title: "Medlem — dina rättigheter",
    icon: Home,
    forRoles: ["MEMBER"],
    content: `Som medlem äger du en andel i föreningen. Du har både rättigheter och skyldigheter.

**Dina rättigheter:**
• Rösta på föreningsstämman (årsmötet)
• Lämna motioner (förslag till stämman)
• Se årsredovisningen och revisionsberättelsen
• Begära extra stämma (om tillräckligt många medlemmar)
• Nominera kandidater till styrelsen och valberedningen

**Dina skyldigheter:**
• Betala månadsavgiften i tid
• Följa stadgarna och ordningsreglerna
• Inte störa dina grannar
• Underhålla din lägenhet (det inre underhållet)
• Söka tillstånd för renoveringar som påverkar bärande konstruktion, VVS, el eller ventilation

**Andrahand:**
Du kan ansöka om att hyra ut i andrahand (under Medlemmar → Andrahand). Styrelsen beslutar.

**Renovering:**
Planerar du att renovera? Ansök under Medlemmar → Renovering. Styrelsen och fastighetsansvarig bedömer.

**Motioner:**
Har du ett förslag? Lämna en motion under Medlemmar → Motioner. Senast den 1 februari (kontrollera deadline i systemet).

**Delta i föreningslivet:**
En bostadsrättsförening är en gemenskap. Ju fler som engagerar sig, desto bättre blir det för alla:
• Kom på städdagar och grillkvällar — det är så man lär känna sina grannar
• Överväg att ställa upp i styrelsen eller valberedningen
• Lämna förslag om saker du vill förbättra — styrelsen uppskattar det
• Hälsa i trapphuset — det låter banalt men det gör skillnad

**Tips:** Lär känna dina grannar. Det mesta löser sig enklare mellan människor som känner varandra.`,
  },
  {
    id: "valberedare",
    title: "Valberedare — din roll i praktiken",
    icon: Vote,
    forRoles: ["NOMINATING_COMMITTEE", "NOMINATING_COMMITTEE_CHAIR"],
    content: `Som valberedare har du ett av föreningens viktigaste uppdrag: att hitta rätt personer till styrelsen och revisorsposten. Du är vald av stämman och arbetar oberoende av styrelsen.

**Ditt uppdrag:**
• Hitta och föreslå kandidater till styrelseledamöter, suppleanter och revisorer
• Kontakta potentiella kandidater och höra om de är intresserade
• Bedöma vilka kompetenser styrelsen behöver (ekonomi, teknik, juridik, kommunikation)
• Presentera ert förslag vid stämman med motivering

**Så här arbetar ni:**
1. **Inventera** — vilka poster är lediga? Vilka sitter kvar? Vilka kompetenser saknas?
2. **Öppna nomineringsperioden** — medlemmar kan föreslå kandidater via systemet
3. **Kontakta kandidater** — ring, träffas, ställ frågor. Är de intresserade? Har de tid?
4. **Sammanställ förslaget** — en kandidat per post med motivering
5. **Presentera vid stämman** — berätta varför ni föreslår just dessa personer

**Vad du letar efter hos kandidater:**
• Tid och engagemang — styrelsearbete kräver regelbundna möten och uppgifter däremellan
• Kompetens som kompletterar — inte bara fler av samma sort
• Intresse för föreningen — bor de här? Bryr de sig?
• Samarbetsförmåga — styrelsen är ett lag, inte ensamvargar

**Sammankallande (ordförande i valberedningen):**
Om du är sammankallande leder du valberedningens arbete:
• Kalla till valberedningens möten
• Fördela arbetet (vem kontaktar vem)
• Slutbehandla och presentera förslaget
• Svara på frågor vid stämman

**Oberoende:**
Valberedningen ska arbeta oberoende av styrelsen. Sittande styrelsemedlemmar ska inte styra vilka som nomineras. Om en styrelsemedlem försöker påverka — stå emot.

**Externa valberedare:**
I vissa föreningar — särskilt de anslutna till HSB eller Riksbyggen — kan en extern person sitta i valberedningen. Det kan vara en representant från moderorganisationen eller en person utanför föreningen som stämman valt. Fördelen med en extern är oberoendet — ingen personlig relation med kandidaterna. Nackdelen är att de kanske inte känner grannskapet lika väl. Externa valberedare har tillgång till systemet och ser medlemsregistret (namn och lägenhet) men inte personnummer eller ekonomisk data.

**Externa styrelsekandidater:**
Valberedningen kan i vissa fall föreslå personer som inte är medlemmar i föreningen som styrelseledamöter. Det kräver att stadgarna tillåter det (kontrollera i föreningens stadgar eller fråga ordförande). Några saker att tänka på:
• Det är vanligare i HSB- och Riksbyggen-anslutna föreningar där moderorganisationen har reserverade poster
• En extern ledamot kan tillföra professionell kompetens som saknas internt (ekonomi, juridik, teknik)
• En extern ledamot har samma solidariska ansvar som alla andra styrelsemedlemmar
• Föreningen kan ha en gräns för hur många externa som tillåts (se stadgarna)
• En extern har inte alltid samma känsla för vad de boende behöver — balansera med interna kandidater

**Vanliga misstag:**
• Vänta för länge — börja arbeta direkt efter att ni valts, inte månaden före stämman
• Bara fråga "vem vill?" — sök aktivt efter kompetens föreningen behöver
• Glömma motivering — stämman vill veta varför ni föreslår just dessa personer
• Inte kontakta kandidaten först — presentera aldrig någon som inte sagt ja

**Tips:** Det bästa sättet att hitta kandidater är att prata med grannar. Många vill bidra men tänker inte på det förrän någon frågar.`,
  },
  {
    id: "boende",
    title: "Boende — så använder du Hemmet",
    icon: Home,
    forRoles: ["RESIDENT"],
    content: `Välkommen! Som boende i föreningen har du tillgång till grundläggande funktioner.

**Du kan:**
• **Felanmälan** — rapportera skador eller fel i fastigheten (trasig lampa, läckage, hissstopp)
• **Förslag** — lämna förslag till styrelsen om förbättringar
• **Boka** — boka tvättstuga, bastu och andra gemensamma resurser
• **Meddelanden** — se information från styrelsen

**Felanmälan:**
Beskriv felet, ange plats och allvarlighetsgrad. Styrelsen/fastighetsansvarig hanterar ärendet. Du ser statusen i din dashboard.

**Kontakt med grannar:**
Om du delar ditt telefonnummer (under Integritet i dashboarden) kan grannar kontakta dig direkt vid frågor — istället för att gå via styrelsen.

**Störningar:**
Har du problem med buller eller annat? Prata med grannen först. Om det inte hjälper kan du anmäla — men läs informationen om vad som räknas som störning.

**Tips:** Kolla dashboarden då och då. Där ser du statusen på dina ärenden och meddelanden från styrelsen.`,
  },
  {
    id: "jav",
    title: "Jäv — vad det innebär",
    icon: Shield,
    forRoles: ["BOARD_CHAIRPERSON", "BOARD_SECRETARY", "BOARD_TREASURER", "BOARD_PROPERTY_MGR", "BOARD_ENVIRONMENT", "BOARD_EVENTS", "BOARD_MEMBER", "BOARD_SUBSTITUTE"],
    content: `Jäv innebär att du har ett personligt intresse i en fråga som styrelsen beslutar om. Om du är jävig ska du inte delta i beslutet.

**Tydliga fall — du ÄR jävig:**
• Din firma lämnar offert på ett jobb åt föreningen
• Din svågers målerifirma är en av leverantörerna som jämförs
• Din egen renoveringsansökan behandlas av styrelsen
• Din makes andrahandsansökan ska godkännas
• Styrelsen beslutar om avgiftsjustering som bara berör din lägenhet
• En störningsanmälan har lämnats in mot dig
• Du sitter i styrelsen för ett företag som vill hyra föreningens lokal
• Styrelsen beslutar om arvoden (alla ledamöter är jäviga — stämman beslutar)

**Gränsfall — använd sunt förnuft:**
• Din granne (inte nära vän) söker andrahand → troligen inte jäv, men nämn det
• Styrelsen beslutar om avgiftshöjning som berör alla lika → inte jäv (alla berörs lika)
• Din kollega (inte nära relation) lämnar offert → troligen inte jäv, men var transparent
• Styrelsen diskuterar generell renoveringspolicy → inte jäv, även om du planerar renovera
• Föreningen ska byta trappstädningsfirma och din kusin jobbar på en av firmorna → jäv

**Inte jäv:**
• Du bor i huset och berörs av beslutet som alla andra → inte jäv
• Du har en åsikt om frågan → inte jäv (det vore konstigt att inte ha det)
• Du är den som tagit upp frågan → inte jäv (initiativtagare ≠ jävig)

**Vad gör du vid jäv?**
1. Säg till ordförande att du är jävig — innan diskussionen börjar
2. Berätta varför ("min firma har lämnat offert")
3. Lämna rummet under den punkten (eller avstå från att delta i beslutet)
4. Systemet registrerar din jävsdeklaration automatiskt under beslutet
5. Du kan delta i resten av mötet som vanligt

**Vad händer om du INTE deklarerar jäv?**
• Beslutet kan ogiltigförklaras om det överklagas
• Du riskerar personligt skadeståndsansvar
• Förtroendet i styrelsen skadas
• I allvarliga fall (t.ex. kickbacks vid upphandling) kan det vara brottsligt

**Suppleant vid jäv:**
Om du deklarerar jäv och styrelsen tappar beslutförhet kan en suppleant inträda för just den punkten. Suppleanten röstar i ditt ställe.

**Tumregel:** Om du tvekar — deklarera jäv. Det kostar ingenting att vara försiktig. Det kan kosta mycket att inte vara det.`,
  },
  {
    id: "gdpr",
    title: "Personuppgifter och integritet",
    icon: Shield,
    content: `Föreningen hanterar personuppgifter (namn, e-post, telefon) enligt GDPR.

**Du bestämmer:**
Under "Integritet" i din dashboard kan du välja:
• **Kontaktdelning** — om andra boende får se din e-post och telefon
• **Digital kommunikation** — om föreningen får skicka e-post till dig
• **Fotopublicering** — om föreningen får publicera foton med dig

**Dina rättigheter:**
• Du kan alltid ändra dina samtyckesinställningar
• Du kan begära att se vilka uppgifter som lagras om dig
• Vid flytt gallras dina uppgifter enligt lag (personnummer, telefon, e-post raderas — namn och lägenhetshistorik bevaras för bokföring)

**Personnummer:**
Visas aldrig i klartext i systemet. Bara ordförande och kassör kan se fullständiga personnummer vid specifika behov (medlemsprövning, pant).`,
  },
];

export default function HelpPage() {
  const { data: session } = useSession();
  const userRoles = (session?.user?.roles ?? []) as string[];
  const [openSection, setOpenSection] = useState<string | null>("overview");

  // Show relevant sections first, then general
  const myRoleSections = sections.filter((s) => s.forRoles?.some((r) => userRoles.includes(r)));
  const generalSections = sections.filter((s) => !s.forRoles || s.id === "overview" || s.id === "gdpr" || s.id === "jav");
  const otherSections = sections.filter((s) => s.forRoles && !s.forRoles.some((r) => userRoles.includes(r)) && s.id !== "jav");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <HelpCircle className="h-6 w-6 text-blue-600" /> Hjälp
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Praktisk guide till Hemmet och din roll i föreningen.
      </p>

      {/* Role-specific sections first */}
      {myRoleSections.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-blue-700 uppercase mb-2">Din roll</h2>
          <div className="space-y-2">
            {myRoleSections.map((s) => (
              <HelpAccordion key={s.id} section={s} isOpen={openSection === s.id}
                onToggle={() => setOpenSection(openSection === s.id ? null : s.id)} highlight />
            ))}
          </div>
        </div>
      )}

      {/* General */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Allmänt</h2>
        <div className="space-y-2">
          {generalSections.filter((s) => !myRoleSections.includes(s)).map((s) => (
            <HelpAccordion key={s.id} section={s} isOpen={openSection === s.id}
              onToggle={() => setOpenSection(openSection === s.id ? null : s.id)} />
          ))}
        </div>
      </div>

      {/* Other roles (collapsed) */}
      {otherSections.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-2">Övriga roller</h2>
          <div className="space-y-2">
            {otherSections.map((s) => (
              <HelpAccordion key={s.id} section={s} isOpen={openSection === s.id}
                onToggle={() => setOpenSection(openSection === s.id ? null : s.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HelpAccordion({ section, isOpen, onToggle, highlight }: {
  section: HelpSection; isOpen: boolean; onToggle: () => void; highlight?: boolean;
}) {
  const Icon = section.icon;
  return (
    <div className={cn("rounded-lg border overflow-hidden", highlight ? "border-blue-200" : "border-gray-200")}>
      <button onClick={onToggle}
        className={cn("w-full flex items-center justify-between px-4 py-3 text-left",
          highlight ? "bg-blue-50 hover:bg-blue-100" : "bg-white hover:bg-gray-50")}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", highlight ? "text-blue-600" : "text-gray-400")} />
          <span className={cn("text-sm font-medium", highlight ? "text-blue-900" : "text-gray-900")}>{section.title}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="px-4 py-4 border-t border-gray-100 bg-white">
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {section.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>
        </div>
      )}
    </div>
  );
}
