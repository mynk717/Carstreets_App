// app/dealers/[subdomain]/dashboard/whatsapp/templates/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TemplatesClient from "./TemplatesClient";

async function getTemplateData(subdomain: string) {
  const dealer = await prisma.dealer.findUnique({
    where: { subdomain },
    select: {
      id: true,
      businessName: true,
      whatsappBusinessAccountId: true,
      whatsappBusinessVerified: true,
    },
  });

  if (!dealer) return null;

  // Fetch templates from database
  const templates = await prisma.whatsAppTemplate.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: "desc" },
  });

  return { dealer, templates };
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getTemplateData(subdomain);

  if (!data) notFound();

  return (
    <TemplatesClient
      subdomain={subdomain}
      dealer={data.dealer}
      templates={data.templates}
    />
  );
}
