// app/api/admin/thumbnails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from '@vercel/og'
import { fetchCarById } from '@/lib/database/db'
import React from 'react'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { carId, style = 'clean' } = await request.json()
    
    const car = await fetchCarById(carId)
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 })
    }

    return new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1f2937',
            padding: '40px',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              fontSize: 48,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: '20px',
            },
          },
          `${car.year} ${car.brand} ${car.model}`
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: 32,
              color: '#60a5fa',
              fontWeight: '600',
            },
          },
          `₹${Number(car.price).toLocaleString('en-IN')}`
        ),
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              fontSize: 24,
              color: '#9ca3af',
            },
          },
          'CarStreets'
        )
      ),
      {
        width: 1280,
        height: 720,
      }
    )
    
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return NextResponse.json({ error: 'Failed to generate thumbnail' }, { status: 500 })
  }
}
