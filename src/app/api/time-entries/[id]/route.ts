import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, geo } = await req.json();

    if (action !== "clock-out") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const existing = await prisma.timeEntry.findFirst({
      where: { id: params.id, userId, clockOut: null },
    });
    if (!existing) {
      return NextResponse.json({ error: "Time entry not found or already clocked out" }, { status: 404 });
    }

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        clockOut: new Date(),
        clockOutGeo: geo || {},
      },
    });

    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "time_entries",
      entityId: params.id,
      newValue: { clockOut: updated.clockOut?.toISOString() },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
