import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

async function getDashboardStats(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [tasksDueToday, contactsThisWeek, activitiesToday, enrollmentsThisMonth] =
    await Promise.all([
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          dueDate: { gte: todayStart, lte: todayEnd },
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        include: { contact: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.contact.count({
        where: {
          agentId: userId,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.activity.count({
        where: {
          userId,
          occurredAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.enrollment.count({
        where: {
          contact: { agentId: userId },
          effectiveDate: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]);

  return { tasksDueToday, contactsThisWeek, activitiesToday, enrollmentsThisMonth };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const { tasksDueToday, contactsThisWeek, activitiesToday, enrollmentsThisMonth } =
    await getDashboardStats(userId);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {session?.user?.name}!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500">Contacts This Week</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{contactsThisWeek}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500">Activities Today</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{activitiesToday}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm font-medium text-gray-500">Enrollments This Month</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">{enrollmentsThisMonth}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tasks Due Today ({tasksDueToday.length})
        </h2>
        {tasksDueToday.length === 0 ? (
          <p className="text-gray-500 text-sm">No tasks due today. 🎉</p>
        ) : (
          <ul className="space-y-3">
            {tasksDueToday.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  {task.contact && (
                    <p className="text-xs text-gray-500 mt-1">
                      {task.contact.firstName} {task.contact.lastName}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    task.status === "IN_PROGRESS"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {task.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
