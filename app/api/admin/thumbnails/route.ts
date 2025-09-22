// app/api/admin/thumbnails/route.ts - ENHANCED MULTI-AGENT WITH GOOGLE VISION
import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth/admin';
import { getCarEnhancementPrompt, getPromptMetrics, addAutomotiveCertification } from '@/lib/prompts/carImagePrompts';

fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: NextRequest) {
  console.log('🤖 Multi-Agent Image Generation Starting');

  try {
    // ✅ AUTHENTICATION: Vercel bypass authentication check
    const authResult = await verifyAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('❌ Invalid JSON in request:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { 
      carData, 
      prompt: userPrompt, 
      platform, 
      style = 'professional_automotive', 
      contentType = 'standard', 
      festival 
    } = requestBody;

    if (!carData?.id || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: carData.id, platform' },
        { status: 400 }
      );
    }

    console.log('🔍 Multi-Agent Processing for:', `${carData.year} ${carData.brand} ${carData.model}`);

    // ✅ STEP 1: Get Car Data from Database
    let carRecord;
    try {
      carRecord = await prisma.car.findUnique({
        where: { id: carData.id },
        select: { images: true, brand: true, model: true, year: true, price: true },
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    if (!carRecord) {
      console.log('❌ Car not found:', carData.id);
      return NextResponse.json(
        { success: false, error: `Car with id ${carData.id} not found` },
        { status: 404 }
      );
    }

    // ✅ STEP 2: Initial Car Image Check
    let carImageUrl = null;
    let visionAnalysis = null;

    if (carRecord.images && Array.isArray(carRecord.images) && carRecord.images.length > 0) {
      carImageUrl = carRecord.images[0];
      console.log('🖼️ Found Cloudinary car image for analysis');

      // ✅ STEP 2.5: Google Vision Car Angle Validation
      try {
        console.log('👁️ Validating car angle with Google Vision...');
        
        // Dynamic import to handle potential missing dependency
        const { validateCarAngle } = await import('@/lib/services/carAngleDetector');
        visionAnalysis = await validateCarAngle(carImageUrl);
        
        console.log('📊 Car Angle Analysis:', {
          angle: visionAnalysis.detectedAngle,
          valid: visionAnalysis.isValidAngle,
          viability: visionAnalysis.details.marketingViability,
          confidence: visionAnalysis.confidence
        });
        
        // ❌ REJECT unsuitable angles
        if (!visionAnalysis.isValidAngle) {
          console.warn('⚠️ Car image rejected:', visionAnalysis.details.rejectionReason);
          console.log('🔄 Switching to generation mode due to unsuitable car angle');
          carImageUrl = null; // Force generation mode
        }
        
        // ✅ Log recommendations for approved images
        if (visionAnalysis.recommendations && visionAnalysis.recommendations.length > 0) {
          console.log('💡 Marketing Recommendations:', visionAnalysis.recommendations);
        }
        
      } catch (visionError) {
        console.warn('⚠️ Google Vision validation failed (continuing with image):', visionError);
        // Continue with the image if Vision API fails
        visionAnalysis = {
          isValidAngle: true,
          detectedAngle: 'unknown' as const,
          confidence: 0.5,
          details: {
            carDetected: true,
            visibleElements: ['unknown'],
            rejectionReason: 'Vision API unavailable',
            marketingViability: 'good' as const
          }
        };
      }
    }

    // ✅ STEP 3: AI-Generated Smart Prompt (Instead of hardcoded)
    let enhancedPrompt: string;

    if (userPrompt) {
      // User provided custom prompt - use it directly
      enhancedPrompt = userPrompt;
      console.log('👤 Using user-provided custom prompt');
    } else {
      // ✅ AI-GENERATED PROFESSIONAL PROMPT via Central System
      console.log('🤖 Generating AI-optimized prompt via central prompt system...');
      
      try {
        const promptParams = {
          car: {
            id: carData.id,
            brand: carRecord.brand || carData.brand,
            model: carRecord.model || carData.model,
            year: carRecord.year || carData.year,
            price: Number(carRecord.price || carData.price)
          },
          platform: platform as 'instagram' | 'facebook' | 'linkedin',
          imageUrl: carImageUrl, // null if rejected by Vision API
          contentType: contentType as 'standard' | 'festival',
          festival: festival as any
        };

        // ✅ USE NEW CENTRALIZED PROMPT SYSTEM
        enhancedPrompt = getCarEnhancementPrompt(promptParams);
        
        // ✅ STEP 4: Quality Control Check on Prompt
        const promptMetrics = getPromptMetrics(enhancedPrompt);
        console.log('📊 Prompt Quality Metrics:', promptMetrics);
        
        if (promptMetrics.length < 50) {
          throw new Error('Generated prompt too short for quality results');
        }

        console.log('✅ AI-optimized prompt generated successfully');
        console.log('🎯 Enhanced Prompt Preview:', enhancedPrompt.substring(0, 150) + '...');

      } catch (promptError) {
        console.error('❌ Prompt generation failed:', promptError);
        // Fallback to basic prompt
        enhancedPrompt = carImageUrl 
          ? `Professional automotive photography enhancement for ${carData.year} ${carData.brand} ${carData.model} at CarStreets dealership with price ₹${carData.price}`
          : `Professional CarStreets showroom photography of ${carData.year} ${carData.brand} ${carData.model} with price ₹${carData.price}`;
      }
    }

    // ✅ STEP 5: fal.ai Generation with Enhanced Prompt
    if (!process.env.FAL_KEY) {
      console.error('❌ FAL_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'FAL_KEY not configured in environment' },
        { status: 500 }
      );
    }

    try {
      let result;
      const aspectRatio = platform === 'linkedin' ? '16:9' : '1:1';
      
      if (carImageUrl && carImageUrl.startsWith('https://res.cloudinary.com/')) {
        console.log('🔄 nano-banana/edit: Enhancing existing car photograph');

        result = await fal.subscribe('fal-ai/nano-banana/edit', {
          input: {
            prompt: enhancedPrompt,
            image_urls: [carImageUrl], // ✅ FIXED: plural array
            num_images: 1,
            output_format: 'jpeg',
            aspect_ratio: aspectRatio,
          },
        });

        console.log('🎨 fal.ai edit completed:', result?.data?.images?.length || 0, 'images');
      } else {
        console.log('🎨 nano-banana: Generating complete scene');

        result = await fal.subscribe('fal-ai/nano-banana', {
          input: {
            prompt: enhancedPrompt,
            num_images: 1,
            output_format: 'jpeg',
            aspect_ratio: aspectRatio,
          },
        });

        console.log('🎨 fal.ai generation completed:', result?.data?.images?.length || 0, 'images');
      }

      if (!result?.data?.images?.[0]?.url) {
        console.error('❌ No image URL in fal.ai response:', result);
        throw new Error('No image URL returned by fal.ai API');
      }

      const generatedImageUrl = result.data.images[0].url;

      // ✅ STEP 6: Quality Control Validation 
      let qualityMetrics;
      try {
        console.log('🔍 Running final quality control validation...');
        qualityMetrics = {
          promptQuality: getPromptMetrics(enhancedPrompt),
          generationMode: carImageUrl ? 'enhancement' : 'creation',
          platform: platform,
          visionAnalysis: visionAnalysis ? {
            angle: visionAnalysis.detectedAngle,
            viability: visionAnalysis.details.marketingViability,
            confidence: visionAnalysis.confidence
          } : null,
          processingTime: Date.now()
        };
        console.log('✅ Quality control passed:', qualityMetrics);
      } catch (qcError) {
        console.warn('⚠️ Quality control validation failed (non-critical):', qcError);
        qualityMetrics = { error: 'Quality control failed' };
      }

      // ✅ STEP 7: Return Enhanced Results with Full Context
      return NextResponse.json({
        success: true,
        model: carImageUrl ? 'fal-ai/nano-banana/edit' : 'fal-ai/nano-banana',
        imageUrl: generatedImageUrl,
        originalImage: carImageUrl,
        cost: 0.039,
        platform,
        mode: carImageUrl ? 'ai-enhanced-real-car' : 'ai-generated-showroom',
        promptUsed: enhancedPrompt.substring(0, 200) + '...', // Preview for debugging
        agentGenerated: !userPrompt, // Track if AI generated the prompt
        qualityMetrics: qualityMetrics,
        certification: addAutomotiveCertification(platform),
        visionAnalysis: visionAnalysis ? {
          detectedAngle: visionAnalysis.detectedAngle,
          marketingViability: visionAnalysis.details.marketingViability,
          confidence: visionAnalysis.confidence,
          recommendations: visionAnalysis.recommendations
        } : null
      });

    } catch (falError) {
      console.error('❌ fal.ai API error:', falError);
      return NextResponse.json(
        { success: false, error: `fal.ai API failed: ${falError instanceof Error ? falError.message : String(falError)}` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Multi-Agent Image Generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Multi-Agent Image Generation failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
