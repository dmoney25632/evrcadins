import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface ContactsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const { q } = await searchParams;
  const query = q || "";

  const contacts = await prisma.contact.findMany({
    where: {
      agentId: userId,
      OR: query
        ? [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ]
        : undefined,
    },
    orderBy: { lastName: "asc" },
    take: 50,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <Link
          href="/contacts/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          + New Contact
        </Link>
      </div>

      <div className="mb-4">
        <form method="get">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search contacts..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {query ? "No contacts found." : "No contacts yet. Add your first contact!"}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/contacts/${contact.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-900">
                      {contact.firstName} {contact.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(contact.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/contacts/${contact.id}/edit`} className="text-blue-600 hover:text-blue-900">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
