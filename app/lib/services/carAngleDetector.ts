// app/lib/services/carAngleDetector.ts - GOOGLE VISION CAR ANGLE VALIDATION
import { ImageAnnotatorClient } from '@google-cloud/vision';

// ✅ Initialize Google Vision Client
const visionClient = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // or use GOOGLE_APPLICATION_CREDENTIALS
});

export interface CarAngleAnalysis {
  isValidAngle: boolean;
  detectedAngle: 'front' | 'side' | 'front-side' | 'rear' | 'interior' | 'engine' | 'unknown';
  confidence: number;
  details: {
    carDetected: boolean;
    visibleElements: string[];
    rejectionReason?: string;
    marketingViability: 'excellent' | 'good' | 'poor' | 'unsuitable';
  };
  recommendations?: string[];
}

// ✅ MAIN VALIDATION FUNCTION
export async function validateCarAngle(imageUrl: string): Promise<CarAngleAnalysis> {
  try {
    console.log('👁️ Google Vision: Analyzing car angle for:', imageUrl);

    // Perform multiple Vision API analyses
    const [labelResult, objectResult, safeSearchResult] = await Promise.all([
      visionClient.labelDetection({ image: { source: { imageUri: imageUrl } } }),
      visionClient.objectLocalization({ image: { source: { imageUri: imageUrl } } }),
      visionClient.safeSearchDetection({ image: { source: { imageUri: imageUrl } } })
    ]);

    const labels = labelResult[0].labelAnnotations || [];
    const objects = objectResult[0].localizedObjectAnnotations || [];
    const safeSearch = safeSearchResult[0].safeSearchAnnotation;

    console.log('🔍 Vision API Labels:', labels.slice(0, 10).map(l => `${l.description}: ${l.score?.toFixed(2)}`));
    console.log('🔍 Vision API Objects:', objects.map(o => `${o.name}: ${o.score?.toFixed(2)}`));

    // ✅ STEP 1: Check if car is detected
    const carDetected = isCarDetected(labels, objects);
    if (!carDetected.detected) {
      return {
        isValidAngle: false,
        detectedAngle: 'unknown',
        confidence: 0,
        details: {
          carDetected: false,
          visibleElements: [],
          rejectionReason: 'No car detected in image',
          marketingViability: 'unsuitable'
        }
      };
    }

    // ✅ STEP 2: Analyze car angle and elements
    const angleAnalysis = analyzeCarAngle(labels, objects);
    
    // ✅ STEP 3: Check image safety for marketing
    const isSafe = isSafeForMarketing(safeSearch);
    
    // ✅ STEP 4: Generate recommendations
    const recommendations = generateRecommendations(angleAnalysis, isSafe);

    const result: CarAngleAnalysis = {
      isValidAngle: angleAnalysis.isValid && isSafe,
      detectedAngle: angleAnalysis.angle,
      confidence: angleAnalysis.confidence,
      details: {
        carDetected: true,
        visibleElements: angleAnalysis.visibleElements,
        rejectionReason: angleAnalysis.isValid ? undefined : angleAnalysis.rejectionReason,
        marketingViability: angleAnalysis.marketingViability
      },
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };

    console.log('✅ Car angle analysis completed:', {
      angle: result.detectedAngle,
      valid: result.isValidAngle,
      confidence: result.confidence,
      viability: result.details.marketingViability
    });

    return result;

  } catch (error) {
    console.error('❌ Google Vision API error:', error);
    
    // Fallback: Allow image but mark as unknown
    return {
      isValidAngle: true, // Default to allow if Vision API fails
      detectedAngle: 'unknown',
      confidence: 0,
      details: {
        carDetected: true, // Assume car exists
        visibleElements: ['unknown'],
        rejectionReason: `Vision API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        marketingViability: 'good' // Conservative fallback
      },
      recommendations: ['Manual review recommended due to Vision API error']
    };
  }
}

// ✅ HELPER: Detect if image contains a car
function isCarDetected(labels: any[], objects: any[]): { detected: boolean; confidence: number } {
  const carLabels = ['Car', 'Vehicle', 'Automobile', 'Motor vehicle', 'Sedan', 'Hatchback', 'SUV', 'Compact car'];
  const carObjects = objects.filter(obj => 
    obj.name?.toLowerCase().includes('car') || 
    obj.name?.toLowerCase().includes('vehicle')
  );

  const carLabel = labels.find(label => 
    carLabels.some(carType => label.description?.toLowerCase().includes(carType.toLowerCase()))
  );

  const detected = carLabel || carObjects.length > 0;
  const confidence = detected ? (carLabel?.score || carObjects[0]?.score || 0.5) : 0;

  return { detected: !!detected, confidence };
}

// ✅ HELPER: Analyze car angle and marketing viability
function analyzeCarAngle(labels: any[], objects: any[]): {
  angle: CarAngleAnalysis['detectedAngle'];
  isValid: boolean;
  confidence: number;
  visibleElements: string[];
  rejectionReason?: string;
  marketingViability: CarAngleAnalysis['details']['marketingViability'];
} {
  const visibleElements: string[] = [];
  
  // Extract visible car elements from labels
  const carElements = labels.filter(label => label.score && label.score > 0.6).map(l => l.description?.toLowerCase());
  
  // ❌ REJECT: Interior shots
  const interiorElements = ['car interior', 'dashboard', 'steering wheel', 'car seat', 'gear shift'];
  if (interiorElements.some(element => carElements.some(ce => ce?.includes(element)))) {
    return {
      angle: 'interior',
      isValid: false,
      confidence: 0.8,
      visibleElements: interiorElements.filter(e => carElements.some(ce => ce?.includes(e))),
      rejectionReason: 'Interior shots not suitable for marketing',
      marketingViability: 'unsuitable'
    };
  }

  // ❌ REJECT: Engine bay
  const engineElements = ['engine', 'motor', 'car engine', 'automotive engine'];
  if (engineElements.some(element => carElements.some(ce => ce?.includes(element)))) {
    return {
      angle: 'engine',
      isValid: false,
      confidence: 0.8,
      visibleElements: engineElements.filter(e => carElements.some(ce => ce?.includes(e))),
      rejectionReason: 'Engine bay shots not suitable for marketing',
      marketingViability: 'unsuitable'
    };
  }

  // ❌ REJECT: Rear views (less marketing appeal)
  const rearElements = ['rear view', 'back', 'tail light', 'rear'];
  const hasRearElements = rearElements.some(element => carElements.some(ce => ce?.includes(element)));
  const hasFrontElements = ['headlight', 'front', 'grille', 'bumper'].some(element => 
    carElements.some(ce => ce?.includes(element))
  );

  if (hasRearElements && !hasFrontElements) {
    return {
      angle: 'rear',
      isValid: false,
      confidence: 0.7,
      visibleElements: rearElements.filter(e => carElements.some(ce => ce?.includes(e))),
      rejectionReason: 'Rear view has lower marketing appeal than front/side views',
      marketingViability: 'poor'
    };
  }

  // ✅ ACCEPT: Front view (excellent for marketing)
  if (hasFrontElements) {
    return {
      angle: 'front',
      isValid: true,
      confidence: 0.9,
      visibleElements: ['front view', 'headlights', 'grille'],
      marketingViability: 'excellent'
    };
  }

  // ✅ ACCEPT: Side view (good for marketing)
  const sideElements = ['side view', 'profile', 'door', 'window'];
  if (sideElements.some(element => carElements.some(ce => ce?.includes(element)))) {
    return {
      angle: 'side',
      isValid: true,
      confidence: 0.85,
      visibleElements: sideElements.filter(e => carElements.some(ce => ce?.includes(e))),
      marketingViability: 'good'
    };
  }

  // ✅ DEFAULT: Front-side angle (most common, good for marketing)
  return {
    angle: 'front-side',
    isValid: true,
    confidence: 0.7,
    visibleElements: ['general car view'],
    marketingViability: 'good'
  };
}

// ✅ HELPER: Check if image is safe for marketing
function isSafeForMarketing(safeSearch: any): boolean {
  if (!safeSearch) return true;
  
  // Reject if any category is LIKELY or VERY_LIKELY
  const unsafeCategories = ['adult', 'violence', 'racy'];
  return !unsafeCategories.some(category => {
    const level = safeSearch[category];
    return level === 'LIKELY' || level === 'VERY_LIKELY';
  });
}

// ✅ HELPER: Generate improvement recommendations
function generateRecommendations(angleAnalysis: any, isSafe: boolean): string[] {
  const recommendations: string[] = [];
  
  if (!isSafe) {
    recommendations.push('Image content not suitable for professional marketing');
  }
  
  if (angleAnalysis.angle === 'rear') {
    recommendations.push('Consider using front or side view for better marketing appeal');
  }
  
  if (angleAnalysis.confidence < 0.8) {
    recommendations.push('Consider manual review for optimal marketing results');
  }
  
  if (angleAnalysis.marketingViability === 'poor') {
    recommendations.push('This angle may not showcase the vehicle optimally for sales');
  }
  
  return recommendations;
}

// ✅ UTILITY: Quick validation for auto-content pipeline
export async function isCarImageSuitableForMarketing(imageUrl: string): Promise<boolean> {
  try {
    const analysis = await validateCarAngle(imageUrl);
    return analysis.isValidAngle && analysis.details.marketingViability !== 'unsuitable';
  } catch (error) {
    console.warn('⚠️ Car angle validation failed, allowing image:', error);
    return true; // Default to allow if validation fails
  }
}
