import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hash("password123", 12);

  // BRF Settings
  await db.brfSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      name: "BRF Exempelföreningen",
      orgNumber: "999999-0001",
      registrationDate: new Date("1985-06-15"),
      seat: "Exempelstad",
      signatoryRule: "Ordförande och kassör var för sig, eller två styrelseledamöter i förening",
      address: "Exempelvägen 1-5",
      city: "Exempelstad",
      postalCode: "100 00",
      phone: "000-000 00 00",
      email: "styrelsen@example.se",
      fiscalYearStart: 1,
      fiscalYearEnd: 12,
      bankgiro: "0000-0000",
      swish: "000 000 00 00",
      propertyManager: "Exempelförvaltning AB",
      insuranceCompany: "Exempelförsäkring",
      insurancePolicy: "EX-2024-00001",
    },
  });

  // BRF Rules (fristående förening med moderna stadgar)
  await db.brfRules.upsert({
    where: { id: "default" },
    update: {},
    create: {
      affiliation: "NONE",
      minBoardMembers: 3,
      maxBoardMembers: 7,
      maxBoardSubstitutes: 3,
      allowExternalBoardMembers: 1,
      noticePeriodMinWeeks: 2,
      noticePeriodMaxWeeks: 6,
      noticeMethodDigital: true,
      allowDigitalMeeting: false,
      maxProxiesPerPerson: 2,
      proxyCircleRestriction: true,
      adjustersCount: 2,
      motionDeadlineMonth: 2,
      motionDeadlineDay: 1,
      transferFeeMaxPercent: 2.5,
      pledgeFeeMaxPercent: 1.0,
      transferFeePaidBySeller: false,
      minAuditors: 1,
      maxAuditors: 2,
      maxAuditorSubstitutes: 2,
      requireAuthorizedAuditor: false,
      maintenancePlanRequired: true,
      maintenancePlanYears: 30,
      protocolDeadlineWeeks: 3,
      maxOwnershipPercent: 100,
    },
  });

  // Building
  const building = await db.building.upsert({
    where: { id: "building-1" },
    update: {},
    create: {
      id: "building-1",
      name: "Hus A",
      address: "Exempelvägen 1",
      city: "Exempelstad",
      postalCode: "100 00",
      propertyDesignation: "Exempelstad Kvarteret 1:5",
      constructionYear: 1972,
      totalArea: 2450,
      plotArea: 3200,
      heatingType: "Fjärrvärme",
      energyRating: "C",
    },
  });

  // Apartments
  const apartments = await Promise.all(
    [
      { number: "1001", floor: 1, area: 65, rooms: 2.5, share: 0.05, monthlyFee: 4500 },
      { number: "1002", floor: 1, area: 80, rooms: 3, share: 0.06, monthlyFee: 5200 },
      { number: "2001", floor: 2, area: 65, rooms: 2.5, share: 0.05, monthlyFee: 4500 },
      { number: "2002", floor: 2, area: 95, rooms: 4, share: 0.07, monthlyFee: 6100 },
      { number: "3001", floor: 3, area: 45, rooms: 1.5, share: 0.03, monthlyFee: 3200 },
      { number: "3002", floor: 3, area: 110, rooms: 5, share: 0.08, monthlyFee: 7000 },
    ].map((apt) =>
      db.apartment.upsert({
        where: { buildingId_number: { buildingId: building.id, number: apt.number } },
        update: {},
        create: { ...apt, buildingId: building.id },
      })
    )
  );

  // Users with roles
  const users: Array<{
    email: string;
    firstName: string;
    lastName: string;
    roles: Role[];
    apartmentIndex: number;
  }> = [
    {
      email: "admin@hemmet.se",
      firstName: "Admin",
      lastName: "Adminsson",
      roles: [Role.ADMIN],
      apartmentIndex: 0,
    },
    {
      email: "ordforande@hemmet.se",
      firstName: "Anna",
      lastName: "Ordförande",
      roles: [Role.BOARD_CHAIRPERSON, Role.MEMBER],
      apartmentIndex: 0,
    },
    {
      email: "kassor@hemmet.se",
      firstName: "Bengt",
      lastName: "Kassör",
      roles: [Role.BOARD_TREASURER, Role.MEMBER],
      apartmentIndex: 1,
    },
    {
      email: "forvaltning@hemmet.se",
      firstName: "Cecilia",
      lastName: "Förvaltare",
      roles: [Role.BOARD_PROPERTY_MGR, Role.MEMBER],
      apartmentIndex: 2,
    },
    {
      email: "sekreterare@hemmet.se",
      firstName: "Diana",
      lastName: "Sekreterare",
      roles: [Role.BOARD_SECRETARY, Role.MEMBER],
      apartmentIndex: 3,
    },
    {
      email: "miljo@hemmet.se",
      firstName: "Erik",
      lastName: "Miljösson",
      roles: [Role.BOARD_ENVIRONMENT, Role.MEMBER],
      apartmentIndex: 3,
    },
    {
      email: "suppleant@hemmet.se",
      firstName: "Eva",
      lastName: "Suppleant",
      roles: [Role.BOARD_SUBSTITUTE, Role.MEMBER],
      apartmentIndex: 4,
    },
    {
      email: "revisor@hemmet.se",
      firstName: "Filip",
      lastName: "Revisor",
      roles: [Role.AUDITOR],
      apartmentIndex: 5,
    },
    {
      email: "medlem@hemmet.se",
      firstName: "Gustav",
      lastName: "Medlem",
      roles: [Role.MEMBER],
      apartmentIndex: 5,
    },
    {
      email: "boende@hemmet.se",
      firstName: "Hanna",
      lastName: "Boende",
      roles: [Role.RESIDENT],
      apartmentIndex: 5,
    },
  ];

  for (const userData of users) {
    const user = await db.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        passwordHash,
        apartmentId: apartments[userData.apartmentIndex].id,
      },
    });

    for (const role of userData.roles) {
      await db.userRole.upsert({
        where: { userId_role: { userId: user.id, role } },
        update: {},
        create: { userId: user.id, role },
      });
    }
  }

  // === Motioner ===
  const medlemUser = await db.user.findUnique({ where: { email: "medlem@hemmet.se" } });
  const suppleantUser = await db.user.findUnique({ where: { email: "suppleant@hemmet.se" } });
  const miljoUser = await db.user.findUnique({ where: { email: "miljo@hemmet.se" } });

  if (medlemUser && suppleantUser && miljoUser) {
    // Motion 1: Laddstolpar — med styrelsens yttrande
    const motion1 = await db.motion.create({
      data: {
        authorId: medlemUser.id,
        title: "Installation av laddstolpar för elbilar",
        description:
          "Antalet elbilar i föreningen ökar stadigt och det finns idag inga möjligheter att ladda i garaget. " +
          "Flera medlemmar har uttryckt önskemål om laddmöjligheter. Enligt en offert från Charge Amps kan " +
          "16 laddplatser installeras för ca 480 000 kr exkl. moms. Kostnaden kan finansieras genom " +
          "föreningens underhållsfond alternativt genom ett lån. Laddningen bekostas av respektive användare " +
          "genom ett separat abonnemang.",
        proposal:
          "Motionären yrkar att stämman beslutar att:\n" +
          "1. Ge styrelsen i uppdrag att installera minst 16 laddplatser i garaget.\n" +
          "2. Finansiering sker genom föreningens underhållsfond.\n" +
          "3. Installation ska vara slutförd senast 2026-12-31.",
        status: "BOARD_RESPONSE",
        boardResponse:
          "Styrelsen har utrett frågan och inhämtat tre offerter. Styrelsen anser att laddstolpar är en " +
          "nödvändig investering men föreslår att antalet begränsas till 8 platser i ett första steg, " +
          "med möjlighet till utbyggnad baserat på behov. Kostnaden beräknas till ca 280 000 kr. " +
          "Styrelsen avstyrker finansiering via underhållsfonden och föreslår istället ett separat lån.",
        boardRecommendation: "AMEND",
        submittedAt: new Date("2026-01-20"),
        voteProposals: {
          create: [
            {
              sortOrder: 1,
              label: "Bifall",
              description:
                "Motionärens yrkande: 16 laddplatser, finansiering via underhållsfond, klart 2026-12-31.",
              isDefault: true,
              source: "MOTIONER",
            },
            {
              sortOrder: 2,
              label: "Avslag",
              description: "Motionen avslås.",
              source: "MOTIONER",
            },
            {
              sortOrder: 3,
              label: "Styrelsens förslag",
              description:
                "8 laddplatser installeras i garaget, finansieras genom lån, med option på utbyggnad till 16 platser.",
              source: "BOARD",
            },
          ],
        },
      },
    });

    // Motion 2: Cykelrum — inskickad, ej behandlad ännu
    await db.motion.create({
      data: {
        authorId: suppleantUser.id,
        title: "Utökat cykelrum med laddning för elcyklar",
        description:
          "Det nuvarande cykelrummet är fullt och cyklar ställs i trapphuset, vilket är en brandrisk. " +
          "Genom att bygga om det oanvända förrådet i källarplan till ett nytt cykelrum kan vi lösa " +
          "platsproblemen. Förslaget inkluderar även eluttag för laddning av elcyklar.",
        proposal:
          "Motionären yrkar att stämman beslutar att styrelsen får i uppdrag att utreda och genomföra " +
          "en ombyggnad av det oanvända förrådet i källarplan till cykelrum med laddningsmöjligheter.",
        status: "SUBMITTED",
        submittedAt: new Date("2026-02-15"),
        voteProposals: {
          create: [
            {
              sortOrder: 1,
              label: "Bifall",
              description: "Ombyggnad av förråd till cykelrum med elladdning.",
              isDefault: true,
              source: "MOTIONER",
            },
            {
              sortOrder: 2,
              label: "Avslag",
              description: "Motionen avslås.",
              source: "MOTIONER",
            },
          ],
        },
      },
    });

    // Motion 3: Grillplats — beslutad (bifallen)
    await db.motion.create({
      data: {
        authorId: miljoUser.id,
        title: "Anläggning av gemensam grillplats på innergården",
        description:
          "Innergården används sparsamt och saknar naturliga samlingspunkter. En gemensam grillplats " +
          "skulle främja gemenskap och ge möjlighet till utomhusmatlagning under sommarhalvåret. " +
          "Kostnaden beräknas till ca 35 000 kr.",
        proposal:
          "Motionären yrkar att stämman beslutar att anlägga en gemensam grillplats med sittplatser " +
          "på innergården, finansierad inom ramen för den ordinarie budgeten.",
        status: "DECIDED",
        boardResponse:
          "Styrelsen tillstyrker motionen. Kostnaden ryms inom årets budget för utemiljö.",
        boardRecommendation: "APPROVE",
        resolution: "Bifall: Grillplats med sittplatser anläggs på innergården, inom ordinarie budget.",
        submittedAt: new Date("2025-01-30"),
        voteProposals: {
          create: [
            {
              sortOrder: 1,
              label: "Bifall",
              description: "Grillplats med sittplatser anläggs på innergården, inom ordinarie budget.",
              isDefault: true,
              source: "MOTIONER",
              votesFor: 42,
              votesAgainst: 3,
              votesAbstained: 5,
              adopted: true,
            },
            {
              sortOrder: 2,
              label: "Avslag",
              description: "Motionen avslås.",
              source: "MOTIONER",
            },
          ],
        },
      },
    });

    // Motion 4: Solceller — med ändringsyrkande
    await db.motion.create({
      data: {
        authorId: medlemUser.id,
        title: "Installation av solceller på taket",
        description:
          "Med stigande energipriser och föreningens stora takyta finns det goda förutsättningar för " +
          "solcellsinstallation. En preliminär utredning visar att föreningen kan producera ca 80 MWh/år " +
          "vilket täcker ca 40% av föreningens gemensamma elförbrukning. Återbetalningstid beräknas " +
          "till 8-10 år.",
        proposal:
          "Motionären yrkar att:\n" +
          "1. Styrelsen upphandlar och installerar solceller på föreningens tak.\n" +
          "2. Investeringen (ca 1,2 Mkr) finansieras genom grönt lån.\n" +
          "3. Arbetet ska påbörjas under 2026.",
        status: "BOARD_RESPONSE",
        boardResponse:
          "Styrelsen är positiv till solceller men anser att en fullständig teknisk utredning behöver " +
          "genomföras innan beslut om installation kan fattas. Takets skick behöver bedömas och " +
          "eventuellt underhåll prioriteras före installation. Styrelsen föreslår därför att " +
          "stämman beslutar om en utredning snarare än direkt installation.",
        boardRecommendation: "AMEND",
        submittedAt: new Date("2026-01-25"),
        voteProposals: {
          create: [
            {
              sortOrder: 1,
              label: "Bifall",
              description: "Installation av solceller enligt motionärens förslag, finansiering genom grönt lån.",
              isDefault: true,
              source: "MOTIONER",
            },
            {
              sortOrder: 2,
              label: "Avslag",
              description: "Motionen avslås.",
              source: "MOTIONER",
            },
            {
              sortOrder: 3,
              label: "Styrelsens förslag",
              description:
                "Styrelsen får i uppdrag att genomföra en teknisk utredning av solcellsinstallation " +
                "inklusive takbesiktning, och återkomma med beslutsunderlag till nästa ordinarie stämma.",
              source: "BOARD",
            },
          ],
        },
      },
    });

    console.log("  4 exempelmotioner skapade");
  }

  // === Boendeförslag ===
  const boendeUser = await db.user.findUnique({ where: { email: "boende@hemmet.se" } });

  if (boendeUser && medlemUser) {
    await db.suggestion.create({
      data: {
        authorId: boendeUser.id,
        title: "Bättre belysning i källargången",
        description:
          "Belysningen i källargången mellan hus A och cykelrummet är mycket dålig, särskilt vintertid. " +
          "Flera boende har uttryckt oro för tryggheten. Föreslår att befintliga armaturer byts ut mot " +
          "LED-belysning med rörelsesensor.",
        status: "SUBMITTED",
      },
    });

    await db.suggestion.create({
      data: {
        authorId: medlemUser.id,
        title: "Gemensam bokhylla i tvättstugan",
        description:
          "Det vore trevligt med en liten bokhylla i tvättstugan där boende kan lämna och ta böcker — " +
          "en sorts bokbytarhörna. Kostar ingenting och skapar gemenskap.",
        status: "ACKNOWLEDGED",
        response: "Tack för förslaget! Styrelsen tycker det är en bra idé och utreder lämplig plats.",
      },
    });

    await db.suggestion.create({
      data: {
        authorId: boendeUser.id,
        title: "Hundrastgård på baksidan",
        description:
          "Med allt fler hundar i föreningen vore det bra med en inhägnad hundrastgård på den oanvända " +
          "gräsytan bakom hus A. Det skulle minska problemet med hundbajs på gemensamma ytor och ge " +
          "hundägare en trygg plats att släppa hundarna.",
        status: "SUBMITTED",
      },
    });

    console.log("  3 boendeförslag skapade");
  }

  console.log("Seed complete!");
  console.log("");
  console.log("Test accounts (password: password123):");
  console.log("  admin@hemmet.se          - Admin");
  console.log("  ordforande@hemmet.se     - Ordförande");
  console.log("  sekreterare@hemmet.se    - Sekreterare");
  console.log("  kassor@hemmet.se         - Kassör");
  console.log("  forvaltning@hemmet.se    - Förvaltningsansvarig");
  console.log("  miljo@hemmet.se          - Miljöansvarig");
  console.log("  suppleant@hemmet.se      - Suppleant");
  console.log("  revisor@hemmet.se        - Revisor");
  console.log("  medlem@hemmet.se         - Medlem");
  console.log("  boende@hemmet.se         - Boende");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
