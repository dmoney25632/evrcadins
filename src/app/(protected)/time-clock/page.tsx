import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import TimeClockClient from "./TimeClockClient";

export default async function TimeClockPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const now = new Date();

  const [todayEntries, openEntry] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        userId,
        clockIn: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      orderBy: { clockIn: "desc" },
    }),
    prisma.timeEntry.findFirst({
      where: { userId, clockOut: null },
    }),
  ]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Time Clock</h1>
      <TimeClockClient
        isClockedIn={!!openEntry}
        openEntryId={openEntry?.id || null}
        todayEntries={todayEntries.map((e) => ({
          id: e.id,
          clockIn: e.clockIn.toISOString(),
          clockOut: e.clockOut?.toISOString() || null,
          clockInGeo: e.clockInGeo as Record<string, number> | null,
          clockOutGeo: e.clockOutGeo as Record<string, number> | null,
        }))}
      />
    </div>
  );
}
