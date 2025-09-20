// Update /app/api/admin/thumbnails/route.ts
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

    console.log('🔄 Attempting image generation for:', platform);

    // ✅ FIXED: Use correct Gemini API endpoint and authentication
    try {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      console.log('🔑 Using Gemini API key:', geminiApiKey.substring(0, 10) + '...');

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // ✅ REMOVED: Authorization header (not needed when using ?key= parameter)
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate an image: ${prompt}`
            }]
          }]
        })
      });

      console.log('📡 Gemini API response status:', geminiResponse.status);

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        console.log('✅ Gemini success for', platform);
        
        return NextResponse.json({
          success: true,
          model: 'gemini-pro',
          data: geminiData,
          cost: 0.039,
          platform
        });
      } else {
        const errorText = await geminiResponse.text();
        console.log('❌ Gemini failed:', geminiResponse.status, errorText);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }
    } catch (geminiError) {
      console.log('🔄 Gemini failed, falling back to DALL-E:', geminiError);

      // ✅ Fallback: DALL-E 3 with proper authentication
      try {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        
        if (!openaiApiKey) {
          throw new Error('OPENAI_API_KEY not configured');
        }

        const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
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
          console.log('✅ DALL-E success for', platform);
          
          return NextResponse.json({
            success: true,
            model: 'dall-e-3',
            imageUrl: dalleData.data[0].url,
            cost: 0.04,
            platform
          });
        } else {
          const errorText = await dalleResponse.text();
          console.log('❌ DALL-E failed:', dalleResponse.status, errorText);
          throw new Error(`DALL-E API error: ${dalleResponse.status}`);
        }
      } catch (dalleError) {
        console.error('❌ DALL-E also failed:', dalleError);
        throw dalleError;
      }
    }

  } catch (error) {
    console.error('💥 Thumbnails API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
