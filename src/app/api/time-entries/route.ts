import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, geo } = await req.json();

    if (action !== "clock-in") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const existing = await prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    });
    if (existing) {
      return NextResponse.json({ error: "Already clocked in" }, { status: 409 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        clockIn: new Date(),
        clockInGeo: geo || {},
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "time_entries",
      entityId: entry.id,
      newValue: { clockIn: entry.clockIn.toISOString() },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
