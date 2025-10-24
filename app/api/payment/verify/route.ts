import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { dealerId, txnid, status } = await request.json()

    console.log('📥 Payment verification request:', { dealerId, txnid, status })

    if (!dealerId || !txnid) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    // Check if dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId }
    })

    if (!dealer) {
      return NextResponse.json({
        success: false,
        error: 'Dealer not found'
      }, { status: 404 })
    }

    // Update dealer status based on payment result
    if (status === 'success') {
      const updatedDealer = await prisma.dealer.update({
        where: { id: dealerId },
        data: {
          subscriptionStatus: 'active',
          updatedAt: new Date()
        }
      })

      console.log('✅ Dealer activated:', updatedDealer.id)

      return NextResponse.json({
        success: true,
        message: 'Dealer subscription activated',
        subdomain: updatedDealer.subdomain
      })
    } else {
      console.log('❌ Payment failed for dealer:', dealerId)
      
      return NextResponse.json({
        success: false,
        error: 'Payment was not successful'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Payment verification failed'
    }, { status: 500 })
  }
}
