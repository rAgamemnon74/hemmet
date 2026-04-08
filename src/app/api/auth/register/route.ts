import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/server/db";
import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(1, "Förnamn krävs"),
  lastName: z.string().min(1, "Efternamn krävs"),
  email: z.string().email("Ogiltig e-postadress"),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    return NextResponse.json(
      { error: issues[0]?.message ?? "Ogiltig data" },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "E-postadressen är redan registrerad." },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);

  await db.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
      roles: {
        create: { role: "RESIDENT" },
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
