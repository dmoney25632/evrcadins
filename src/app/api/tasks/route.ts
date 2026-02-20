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
    const { title, description, dueDate, contactId } = await req.json();

    if (!title || !dueDate) {
      return NextResponse.json({ error: "Title and due date are required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        assigneeId: userId,
        contactId: contactId || null,
      },
    });

    await createAuditLog({
      userId,
      action: "CREATE",
      entity: "tasks",
      entityId: task.id,
      newValue: { title, dueDate },
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
