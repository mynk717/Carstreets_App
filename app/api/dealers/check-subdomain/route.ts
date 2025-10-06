import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { subdomain } = await request.json()
    
    if (!subdomain) {
      return NextResponse.json({
        available: false,
        message: 'Subdomain is required'
      }, { status: 400 })
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]{3,20}$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json({
        available: false,
        message: 'Subdomain must be 3-20 characters, lowercase letters, numbers, and hyphens only'
      })
    }

    // Reserved subdomains
    const reservedSubdomains = [
      'www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 'staging', 
      'test', 'dev', 'beta', 'demo', 'support', 'help', 'blog', 'news',
      'motoyard', 'carstreets'
    ]

    if (reservedSubdomains.includes(subdomain)) {
      return NextResponse.json({
        available: false,
        message: 'This subdomain is reserved'
      })
    }

    // Check if subdomain exists in database
    const existingDealer = await prisma.dealer.findUnique({
      where: { subdomain }
    })

    if (existingDealer) {
      return NextResponse.json({
        available: false,
        message: 'This subdomain is already taken'
      })
    }

    return NextResponse.json({
      available: true,
      message: 'Subdomain is available!'
    })

  } catch (error) {
    console.error('Error checking subdomain:', error)
    return NextResponse.json({
      available: false,
      message: 'Error checking subdomain availability'
    }, { status: 500 })
  }
}
