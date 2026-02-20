import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { createAuditLog } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await req.json();
    const { firstName, lastName, email, phone, dateOfBirth, address, city, state, zip, medicareNumber, ssnLast4, notes } = body;

    let medicareNumberEnc: string | null = existing.medicareNumberEnc;
    if (medicareNumber !== undefined) {
      medicareNumberEnc = medicareNumber ? encrypt(medicareNumber) : null;
    }

    const updated = await prisma.contact.update({
      where: { id },
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
        medicareNumberEnc,
        ssnLast4: ssnLast4 || null,
        notes: notes || null,
      },
    });

    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "contacts",
      entityId: id,
      oldValue: { firstName: existing.firstName, lastName: existing.lastName },
      newValue: { firstName, lastName, email },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    await createAuditLog({
      userId,
      action: "DELETE",
      entity: "contacts",
      entityId: id,
      oldValue: { firstName: existing.firstName, lastName: existing.lastName },
    });

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
