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
      name: "BRF Solbacken",
      orgNumber: "769012-3456",
      address: "Solvägen 1-5",
      city: "Stockholm",
      postalCode: "123 45",
      fiscalYearStart: 1,
    },
  });

  // Building
  const building = await db.building.upsert({
    where: { id: "building-1" },
    update: {},
    create: {
      id: "building-1",
      name: "Hus A",
      address: "Solvägen 1",
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
      email: "miljo@hemmet.se",
      firstName: "David",
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
      email: "medlem@hemmet.se",
      firstName: "Fredrik",
      lastName: "Medlem",
      roles: [Role.MEMBER],
      apartmentIndex: 5,
    },
    {
      email: "boende@hemmet.se",
      firstName: "Gabriella",
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

  console.log("Seed complete!");
  console.log("");
  console.log("Test accounts (password: password123):");
  console.log("  admin@hemmet.se          - Admin");
  console.log("  ordforande@hemmet.se     - Ordförande");
  console.log("  kassor@hemmet.se         - Kassör");
  console.log("  forvaltning@hemmet.se    - Förvaltningsansvarig");
  console.log("  miljo@hemmet.se          - Miljöansvarig");
  console.log("  suppleant@hemmet.se      - Suppleant");
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
