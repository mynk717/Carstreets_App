import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TemplatesClient from './TemplatesClient'

async function getTemplateData(subdomain: string) {
  try {
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: {
        id: true,
        businessName: true,
        whatsappBusinessAccountId: true,
        whatsappBusinessVerified: true,
        metaAccessToken: true,
      },
    })

    if (!dealer) {
      console.warn(`Dealer not found for subdomain: ${subdomain}`)
      return null
    }

    // ✅ Show ALL templates (including pending for management)
    const templates = await prisma.whatsAppTemplate.findMany({
      where: { dealerId: dealer.id },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`📋 Templates page: ${templates.length} templates for ${subdomain}`)

    return { dealer, templates }
  } catch (error) {
    console.error('Error fetching template data:', error)
    return null
  }
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ subdomain: string }>  // ✅ CORRECT for Next.js 15
}) {
  try {
    const { subdomain } = await params  // ✅ MUST AWAIT for Next.js 15

    if (!subdomain) {
      notFound()
    }

    const data = await getTemplateData(subdomain)

    if (!data) {
      notFound()
    }

    return (
      <TemplatesClient
        subdomain={subdomain}
        dealer={data.dealer}
        templates={data.templates}
      />
    )
  } catch (error) {
    console.error('Templates page error:', error)
    notFound()
  }
}
