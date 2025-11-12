import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import WhatsAppDashboardClient from './WhatsAppDashboardClient'

async function getWhatsAppData(subdomain: string) {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        businessName: true,
        name: true,
        whatsappBusinessAccountId: true,
        whatsappBusinessVerified: true,
      },
    })

    if (!dealer) {
      console.warn(`Dealer not found for subdomain: ${subdomain}`)
      return null
    }

    const [contacts, templates, recentMessages] = await Promise.all([
      prisma.whatsAppContact.findMany({
        where: { dealerId: dealer.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.whatsAppTemplate.findMany({
        where: { dealerId: dealer.id, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.whatsAppMessage.findMany({
        where: { dealerId: dealer.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          contact: { select: { name: true, phoneNumber: true } },
          template: { select: { name: true } },
        },
      }),
    ])

    const messageStats = {
      sent: recentMessages.filter((m) => m.status === 'sent').length,
      delivered: recentMessages.filter((m) => m.status === 'delivered').length,
      failed: recentMessages.filter((m) => m.status === 'failed').length,
      read: recentMessages.filter((m) => m.status === 'read').length,
    }

    return { dealer, contacts, templates, recentMessages, messageStats }
  } catch (error) {
    console.error('Error fetching WhatsApp data:', error)
    return null
  }
}

export default async function WhatsAppDashboardPage({
  params,
}: {
  params: { subdomain: string }
}) {
  const { subdomain } = params

  if (!subdomain) {
    notFound()
  }

  const data = await getWhatsAppData(subdomain)

  if (!data) {
    notFound()
  }

  return (
    <WhatsAppDashboardClient
      subdomain={subdomain}
      dealer={data.dealer}
      initialContacts={data.contacts}
      initialTemplates={data.templates}
      initialMessages={data.recentMessages}
      initialStats={data.messageStats}
    />
  )
}
