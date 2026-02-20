import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { canRevealSensitiveData } from "@/lib/rbac";
import { maskMedicareNumber, decrypt } from "@/lib/encryption";
import Link from "next/link";
import type { Session } from "next-auth";

interface ContactDetailPageProps {
  params: { id: string };
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const contact = await prisma.contact.findFirst({
    where: { id: params.id },
    include: {
      tasks: { orderBy: { dueDate: "asc" }, take: 10 },
      activities: { orderBy: { occurredAt: "desc" }, take: 10 },
      enrollments: { orderBy: { effectiveDate: "desc" }, take: 10 },
    },
  });

  if (!contact) notFound();

  const canReveal = canRevealSensitiveData(session as Session);
  let medicareDisplay = "****-****-****";
  if (contact.medicareNumberEnc) {
    if (canReveal) {
      try {
        medicareDisplay = decrypt(contact.medicareNumberEnc);
      } catch {
        medicareDisplay = "[decrypt error]";
      }
    } else {
      try {
        const plain = decrypt(contact.medicareNumberEnc);
        medicareDisplay = maskMedicareNumber(plain);
      } catch {
        medicareDisplay = "****";
      }
    }
  } else {
    medicareDisplay = "Not set";
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/contacts" className="text-sm text-blue-600 hover:underline">← Back to Contacts</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{contact.firstName} {contact.lastName}</h1>
        </div>
        <Link href={`/contacts/${contact.id}/edit`} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">Edit</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Email</dt>
              <dd className="text-sm text-gray-900">{contact.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Phone</dt>
              <dd className="text-sm text-gray-900">{contact.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</dt>
              <dd className="text-sm text-gray-900">{contact.dateOfBirth ? new Date(contact.dateOfBirth).toLocaleDateString() : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Address</dt>
              <dd className="text-sm text-gray-900">{[contact.address, contact.city, contact.state, contact.zip].filter(Boolean).join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">SSN Last 4</dt>
              <dd className="text-sm text-gray-900">{contact.ssnLast4 ? `***-**-${contact.ssnLast4}` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Medicare Number{!canReveal && <span className="ml-1 text-xs text-gray-400">(masked)</span>}</dt>
              <dd className="text-sm font-mono text-gray-900">{medicareDisplay}</dd>
            </div>
          </dl>
          {contact.notes && (
            <div className="mt-4">
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Notes</dt>
              <dd className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{contact.notes}</dd>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks ({contact.tasks.length})</h2>
          {contact.tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks.</p>
          ) : (
            <ul className="space-y-2">
              {contact.tasks.map((task) => (
                <li key={task.id} className="text-sm p-2 bg-gray-50 rounded">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-gray-500 text-xs mt-1">Due: {new Date(task.dueDate).toLocaleDateString()} · {task.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activities ({contact.activities.length})</h2>
          {contact.activities.length === 0 ? (
            <p className="text-sm text-gray-500">No activities.</p>
          ) : (
            <ul className="space-y-2">
              {contact.activities.map((activity) => (
                <li key={activity.id} className="text-sm p-2 bg-gray-50 rounded">
                  <p className="font-medium">{activity.summary}</p>
                  <p className="text-gray-500 text-xs mt-1">{activity.type} · {new Date(activity.occurredAt).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollments ({contact.enrollments.length})</h2>
        {contact.enrollments.length === 0 ? (
          <p className="text-sm text-gray-500">No enrollments.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Effective</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contact.enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="px-4 py-2 text-sm">{enrollment.planName}</td>
                  <td className="px-4 py-2 text-sm">{enrollment.planType || "—"}</td>
                  <td className="px-4 py-2 text-sm">{new Date(enrollment.effectiveDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm">{enrollment.premium ? `$${enrollment.premium}` : "—"}</td>
                  <td className="px-4 py-2 text-sm">{enrollment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
