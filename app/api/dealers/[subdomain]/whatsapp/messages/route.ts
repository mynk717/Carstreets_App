import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/api/auth/[...nextauth]/route'

export async function GET(
  request: NextRequest,
  { params }: { params: { subdomain: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subdomain } = await params

    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true, email: true }
    })

    if (!dealer || session.user.email !== dealer.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ Get messages with dealerId scope
    const messages = await prisma.whatsAppMessage.findMany({
      where: { dealerId: dealer.id },
      include: {
        contact: {
          select: { name: true, phoneNumber: true }
        },
        template: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('❌ WhatsApp messages error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
