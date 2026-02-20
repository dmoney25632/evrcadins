import { prisma } from "./prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "REVEAL";
type AuditEntity =
  | "contacts"
  | "tasks"
  | "activities"
  | "enrollments"
  | "time_entries";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue ?? undefined,
        newValue: params.newValue ?? undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (err) {
    console.error("Failed to create audit log:", err);
  }
}
