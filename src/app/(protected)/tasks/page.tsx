import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, startOfDay } from "date-fns";

export default async function TasksPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
    include: { contact: true },
    orderBy: { dueDate: "asc" },
    take: 100,
  });

  const groups: Record<string, typeof tasks> = {};
  for (const task of tasks) {
    const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(task);
  }

  const sortedDates = Object.keys(groups).sort();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link href="/tasks/new" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">+ New Task</Link>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">No open tasks.</div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey + "T00:00:00");
            const today = startOfDay(new Date());
            const isToday = dateKey === format(today, "yyyy-MM-dd");
            const isPast = date < today;

            return (
              <div key={dateKey} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className={`px-6 py-3 ${isPast && !isToday ? "bg-red-50" : isToday ? "bg-blue-50" : "bg-gray-50"}`}>
                  <h2 className={`text-sm font-semibold ${isPast && !isToday ? "text-red-700" : isToday ? "text-blue-700" : "text-gray-700"}`}>
                    {isToday ? "Today — " : isPast ? "Overdue — " : ""}
                    {format(date, "EEEE, MMMM d, yyyy")}
                    <span className="ml-2 font-normal">({groups[dateKey].length} task{groups[dateKey].length !== 1 ? "s" : ""})</span>
                  </h2>
                </div>
                <ul className="divide-y divide-gray-100">
                  {groups[dateKey].map((task) => (
                    <li key={task.id} className="px-6 py-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        {task.contact && (
                          <p className="text-xs text-gray-500 mt-1">
                            <Link href={`/contacts/${task.contact.id}`} className="hover:underline text-blue-600">
                              {task.contact.firstName} {task.contact.lastName}
                            </Link>
                          </p>
                        )}
                        {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${task.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
