import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { decrypt } from "@/lib/encryption";
import ContactForm from "@/components/ContactForm";

interface EditContactPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return null;

  const { id } = await params;
  const contact = await prisma.contact.findFirst({
    where: { id, agentId: userId },
  });
  if (!contact) notFound();

  let medicareNumber = "";
  if (contact.medicareNumberEnc) {
    try {
      medicareNumber = decrypt(contact.medicareNumberEnc);
    } catch {
      medicareNumber = "";
    }
  }

  const initialData = {
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email || "",
    phone: contact.phone || "",
    dateOfBirth: contact.dateOfBirth ? contact.dateOfBirth.toISOString().split("T")[0] : "",
    address: contact.address || "",
    city: contact.city || "",
    state: contact.state || "",
    zip: contact.zip || "",
    medicareNumber,
    ssnLast4: contact.ssnLast4 || "",
    notes: contact.notes || "",
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Contact</h1>
      <ContactForm initialData={initialData} />
    </div>
  );
}
