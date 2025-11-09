interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  color?: string;
  images: string[];
  fuelType?: string;
  transmission?: string;
}

interface DealerBrand {
  businessName: string;
  location: string;
  logo?: string;
  tagline?: string;
  description?: string;
}

type TransformationType = 
  | 'adventure_scene' 
  | 'professional_lifestyle' 
  | 'family_outing' 
  | 'urban_lifestyle' 
  | 'premium_location';

type CarType = 'suv' | 'sedan' | 'hatchback' | 'luxury';

export class ImagePromptAgent {
  
  generateHighValuePrompt(
    car: CarData, 
    dealer: DealerBrand, 
    platform: string,
    originalImageUrl: string
  ): string {
    
    const transformationType = this.selectTransformation(car, platform);
    
    const prompt = `Professional automotive marketing transformation using AI image editing:

SOURCE IMAGE: ${originalImageUrl}
CRITICAL: Use the EXISTING car photo as base. Enhance and transform the environment, not the car itself.

CAR DETAILS:
- ${car.year} ${car.brand} ${car.model}
- Color: ${car.color || 'as shown in original image'}
- Type: Preowned, well-maintained
${car.fuelType ? `- Fuel: ${car.fuelType}` : ''}
${car.transmission ? `- Transmission: ${car.transmission}` : ''}

TRANSFORMATION TYPE: ${transformationType}

${this.getTransformationInstructions(transformationType, car, dealer, platform)}

DEALER CONTEXT (subtle integration, not text overlay):
- Dealership: ${dealer.businessName}
- Location: ${dealer.location}
${dealer.tagline ? `- Brand Promise: "${dealer.tagline}"` : ''}
${dealer.description ? `- Specialty: "${dealer.description}"` : ''}

TECHNICAL REQUIREMENTS:
✅ Maintain car's authentic condition (preowned appeal)
✅ Natural lighting enhancement (golden/blue hour)
✅ 1080x1080px square format
✅ Professional color grading (cinematic look)
✅ Remove/blur distracting background elements
✅ Car remains primary focus (60-70% of composition)
✅ Add environmental storytelling elements

PLATFORM OPTIMIZATION: ${platform}
${this.getPlatformStyle(platform)}

PROHIBITED ACTIONS:
❌ Don't add fake text overlays or price tags
❌ Don't make used car look brand new
❌ Don't add cheesy stock photo elements
❌ Don't create unrealistic fantasy scenes
❌ Don't change the car's actual appearance
❌ Don't add dealer logo as watermark overlay

REQUIRED ACTIONS:
✅ Enhance existing environment naturally
✅ Add contextual lifestyle elements
✅ Professional atmospheric enhancement
✅ Emotional storytelling through scene
✅ Buyer persona targeting
✅ Authentic preowned car marketing appeal`;

    return prompt;
  }

  private selectTransformation(car: CarData, platform: string): TransformationType {
    const carType = this.detectCarType(car);
    
    const transformationMap: Record<CarType, TransformationType[]> = {
      'suv': ['adventure_scene', 'family_outing', 'urban_lifestyle'],
      'sedan': ['professional_lifestyle', 'urban_lifestyle', 'family_outing'],
      'hatchback': ['urban_lifestyle', 'professional_lifestyle', 'family_outing'],
      'luxury': ['premium_location', 'professional_lifestyle', 'urban_lifestyle']
    };
    
    const options = transformationMap[carType] || transformationMap['sedan'];
    
    // Platform-specific override
    if (platform === 'linkedin') return 'professional_lifestyle';
    if (platform === 'instagram') return options[0]; // Most aspirational
    if (platform === 'facebook') return 'family_outing';
    if (platform === 'whatsapp') return options[1]; // Balanced approach
    
    return options[0];
  }

  private getTransformationInstructions(
    type: TransformationType, 
    car: CarData, 
    dealer: DealerBrand,
    platform: string
  ): string {
    
    const instructions: Record<TransformationType, string> = {
      'adventure_scene': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TRANSFORMATION: Adventure Explorer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENVIRONMENT:
→ Scenic location: Mountain road, hill station, or coastal highway
→ Dramatic sky: Sunset/sunrise with dynamic clouds
→ Natural elements: Trees, mountains, or ocean glimpse
→ Road context: Winding path or scenic viewpoint visible
→ Atmospheric depth: Layered background (foreground-midground-background)

LIGHTING & MOOD:
→ Golden hour warmth (if sunset) or cool blue (if dawn)
→ Volumetric lighting effects (sun rays, mist)
→ High contrast to emphasize adventure theme
→ Color palette: Warm oranges, deep blues, rich greens

STORYTELLING ELEMENTS:
→ Suggest journey/exploration (distant road, mountain peaks)
→ Freedom and open-road appeal
→ No people needed (car as adventure companion)
→ Weather drama optional (clearing storm, rainbow)

EMOTIONAL TARGET:
→ Persona: Adventure seekers, outdoor enthusiasts, weekend travelers
→ Emotion: Excitement, wanderlust, freedom, exploration
→ Message: "This car takes you places"`,

      'professional_lifestyle': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TRANSFORMATION: Professional Success
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENVIRONMENT:
→ Corporate setting: Modern office building, business district
→ Clean architecture: Glass buildings, contemporary design
→ Professional context: Office parking, business entrance
→ Urban sophistication: City skyline glimpse, clean streets
→ Minimalist approach: Uncluttered, focused composition

LIGHTING & MOOD:
→ Bright, confident lighting (daylight or well-lit evening)
→ Cool color temperature (professional blue/gray tones)
→ Sharp, crisp details
→ Subtle shadows for depth

STORYTELLING ELEMENTS:
→ Business success indicators (modern buildings, upscale area)
→ Professional arriving/departing work scenario
→ Achievement and status (without being ostentatious)
→ Optional: Briefcase or business attire subtle presence

EMOTIONAL TARGET:
→ Persona: Working professionals, executives, business owners
→ Emotion: Achievement, confidence, competence, success
→ Message: "The car of successful professionals"`,

      'family_outing': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TRANSFORMATION: Family Comfort & Safety
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENVIRONMENT:
→ Family-friendly location: Park, lakeside, family restaurant
→ Safe, welcoming setting: Well-maintained public space
→ Natural beauty: Greenery, water features, open space
→ Community context: Other families visible (blurred background)
→ Comfortable atmosphere: Shade, seating areas nearby

LIGHTING & MOOD:
→ Soft, warm natural light (late afternoon perfection)
→ Inviting color palette: Warm yellows, soft greens, gentle blues
→ Even, flattering lighting (no harsh shadows)
→ Cheerful, optimistic atmosphere

STORYTELLING ELEMENTS:
→ Family destination context (park bench, picnic area)
→ Safety and reliability cues (well-lit, populated area)
→ Spacious feel (emphasize car's family capacity)
→ Comfort indicators (suggesting easy parking, accessibility)

EMOTIONAL TARGET:
→ Persona: Parents, families, safety-conscious buyers
→ Emotion: Trust, comfort, reliability, peace of mind
→ Message: "The perfect family companion"`,

      'urban_lifestyle': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TRANSFORMATION: Smart City Living
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENVIRONMENT:
→ Urban setting: Modern street, shopping district, cafe area
→ Contemporary architecture: Mixed-use buildings, retail spaces
→ City convenience: Metro station, mall, entertainment zone nearby
→ Vibrant atmosphere: Bustling but not chaotic
→ Young, dynamic context: Trendy neighborhood

LIGHTING & MOOD:
→ Energetic lighting (bright daylight or evening street lights)
→ Vibrant color saturation (pop of colors, urban energy)
→ Contemporary color grading (teal & orange cinema look)
→ Modern, stylish aesthetic

STORYTELLING ELEMENTS:
→ Urban convenience narrative (easy parking, quick access)
→ Lifestyle fit (coffee shop, gym, shopping mall glimpse)
→ Practical luxury (stylish yet functional)
→ Social context (young professional lifestyle)

EMOTIONAL TARGET:
→ Persona: Young professionals, urban dwellers, first-time buyers
→ Emotion: Smart choice, contemporary lifestyle, practicality meets style
→ Message: "Perfect for city living"`,

      'premium_location': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE TRANSFORMATION: Refined Exclusivity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENVIRONMENT:
→ Upscale location: Luxury hotel, premium resort, exclusive venue
→ Sophisticated architecture: High-end design, premium materials
→ Elegant surroundings: Manicured landscaping, quality finishes
→ Exclusive context: Golf course, yacht club, or upscale restaurant
→ Refined atmosphere: Subtle luxury, understated elegance

LIGHTING & MOOD:
→ Sophisticated lighting (elegant evening or perfect morning light)
→ Premium color palette: Rich blacks, warm golds, deep blues
→ Cinematic color grading (film-quality look)
→ Depth and dimension (layered lighting)

STORYTELLING ELEMENTS:
→ Prestige indicators (high-end location, quality surroundings)
→ Success achieved (luxury lifestyle context)
→ Quality over flash (refined not flashy)
→ Aspirational yet attainable (preowned luxury appeal)

EMOTIONAL TARGET:
→ Persona: Affluent buyers, luxury seekers, status-conscious professionals
→ Emotion: Prestige, exclusivity, refined taste, quality
→ Message: "Luxury within reach"`,
    };

    return instructions[type];
  }

  private getPlatformStyle(platform: string): string {
    const styles: Record<string, string> = {
      instagram: `
INSTAGRAM AESTHETIC:
→ Highly visual, scroll-stopping impact
→ Vibrant colors with high contrast
→ Square composition with centered subject
→ Lifestyle-focused, aspirational feel
→ Professional yet approachable
→ Hashtag-friendly visual story`,

      facebook: `
FACEBOOK AESTHETIC:
→ Friendly, relatable, trustworthy
→ Warm color tones, inviting atmosphere
→ Family-focused appeal
→ Clear, easy-to-understand visual
→ Trust-building elements
→ Community-oriented feel`,

      linkedin: `
LINKEDIN AESTHETIC:
→ Professional, business-appropriate
→ Clean, corporate aesthetic
→ Credibility and authority focus
→ Subtle, not flashy or promotional
→ Business context elements
→ Success and achievement theme`,

      whatsapp: `
WHATSAPP AESTHETIC:
→ Clear, instantly recognizable
→ Mobile-optimized, uncluttered
→ Direct, conversational visual
→ Action-oriented composition
→ High contrast for small screens
→ Personal, one-to-one communication feel`
    };

    return styles[platform] || styles['instagram'];
  }

  private detectCarType(car: CarData): CarType {
    const model = car.model.toLowerCase();
    const brand = car.brand.toLowerCase();
    
    // SUV detection
    const suvKeywords = ['suv', 'fortuner', 'creta', 'seltos', 'venue', 'brezza', 'xuv', 'safari', 'harrier', 'endeavour', 'scorpio'];
    if (suvKeywords.some(keyword => model.includes(keyword))) {
      return 'suv';
    }
    
    // Luxury brand detection
    const luxuryBrands = ['mercedes', 'bmw', 'audi', 'jaguar', 'porsche', 'lexus', 'volvo', 'land rover'];
    if (luxuryBrands.includes(brand) || car.price > 2000000) {
      return 'luxury';
    }
    
    // Hatchback detection
    const hatchbackKeywords = ['swift', 'i20', 'polo', 'baleno', 'alto', 'wagonr', 'jazz', 'ignis', 'tiago'];
    if (hatchbackKeywords.some(keyword => model.includes(keyword))) {
      return 'hatchback';
    }
    
    // Default: Sedan
    return 'sedan';
  }
}
