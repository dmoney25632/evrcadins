import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.task.findFirst({
      where: { id, assigneeId: userId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      userId,
      action: "UPDATE",
      entity: "tasks",
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status },
    });

    return NextResponse.json(task);
  } catch (err) {
    console.error("Failed to update task status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
