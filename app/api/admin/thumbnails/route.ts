import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { carData, prompt, platform, style = 'photorealistic' } = await request.json();
    
    if (!carData || !prompt || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Primary: Try Gemini first
    try {
      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      });

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        
        return NextResponse.json({
          success: true,
          model: 'gemini-2.5-flash-image-preview',
          data: geminiData,
          cost: 0.039,
          platform
        });
      }
    } catch (geminiError) {
      console.log('Gemini failed, falling back to DALL-E:', geminiError);
    }

    // Fallback: DALL-E 3
    try {
      const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt.substring(0, 4000), // DALL-E prompt limit
          size: platform === 'linkedin' ? '1792x1024' : '1024x1024',
          quality: 'standard',
          n: 1
        })
      });

      if (dalleResponse.ok) {
        const dalleData = await dalleResponse.json();
        
        return NextResponse.json({
          success: true,
          model: 'dall-e-3',
          imageUrl: dalleData.data[0].url,
          cost: 0.04,
          platform
        });
      }
    } catch (dalleError) {
      console.error('DALL-E also failed:', dalleError);
    }

    return NextResponse.json(
      { success: false, error: 'All image generation models failed' },
      { status: 500 }
    );

  } catch (error) {
    console.error('Thumbnails API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
