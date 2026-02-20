import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, dateOfBirth, address, city, state, zip, medicareNumber, ssnLast4, notes } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
    }

    let medicareNumberEnc: string | undefined;
    if (medicareNumber) {
      medicareNumberEnc = encrypt(medicareNumber);
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email: email || null,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        medicareNumberEnc: medicareNumberEnc || null,
        ssnLast4: ssnLast4 || null,
        notes: notes || null,
        agentId: userId,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "contacts",
      entityId: contact.id,
      newValue: { firstName, lastName, email },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
