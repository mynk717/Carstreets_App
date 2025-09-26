// app/lib/prompts/carImagePrompts.ts
import { CAR_STREETS_PROFILE } from '../../data/carStreetsProfile';

export interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
}

export interface ImagePromptParams {
  car: CarData;
  platform: 'instagram' | 'facebook' | 'linkedin';
  imageUrl?: string;
  contentType?: 'standard' | 'festival' | 'promotional';
  festival?: 'diwali' | 'holi' | 'dussehra' | 'ganesh-chaturthi' | 'navratri';
}

// ✅ PROFESSIONAL AUTOMOTIVE PHOTOGRAPHY PROMPTS
export function getCarEnhancementPrompt(params: ImagePromptParams): string {
  const { car, platform, imageUrl, contentType = 'standard', festival } = params;
  const baseCarInfo = `${car.year} ${car.brand} ${car.model}`;
  const price = `₹${car.price || 'Price on Request'}`;
  const profile = CAR_STREETS_PROFILE;
  
  // Festival-specific prompts
  if (contentType === 'festival' && festival) {
    return getFestivalPrompt(params);
  }
  
  if (imageUrl) {
    // ENHANCEMENT MODE - Transform existing Cloudinary images
    switch (platform) {
      case 'instagram':
        return `Professional Instagram automotive photography enhancement:
        - Enhance lighting and contrast naturally without over-processing
        - Remove background distractions while maintaining realistic environment
        - Add subtle "CarStreets Verified ✓" watermark in bottom corner
        - Integrate modern price display "${price}" with contemporary typography
        - Apply professional automotive color grading (realistic, not oversaturated)
        - Square 1:1 crop following rule of thirds composition
        - Maintain authentic car condition - enhance, don't falsify
        - Mobile-optimized visual clarity for Instagram feed`;
        
      case 'facebook':
        return `Facebook trust-building car listing enhancement:
        - Natural lighting correction and professional shadow balance
        - Clean background removal of distractions (litter, harsh reflections only)
        - Add trust-building "Certified Pre-Owned • Inspection Available" badge
        - Clear, family-friendly price display "${price}" in readable font
        - Subtle "${profile.operations.key_personnel[0]}'s CarStreets, Raipur" branding
        - Maintain realistic representation for customer trust
        - Professional but approachable visual presentation
        - Emphasize transparency and quality assurance`;
        
      case 'linkedin':
        return `Corporate LinkedIn automotive marketing enhancement:
        - Executive-level professional photography standards
        - Clean, sophisticated background suitable for business professionals
        - Investment-focused price presentation "${price}" as asset value
        - "CarStreets - Premium Pre-Owned Vehicles" corporate branding
        - 16:9 aspect ratio optimized for LinkedIn business feed
        - Emphasize quality, reliability, and professional service
        - Corporate color scheme integration (blue/grey professional tones)
        - Business-appropriate visual messaging`;
    }
  } else {
    // GENERATION MODE - Create complete scenes
    switch (platform) {
      case 'instagram':
        return `Instagram-worthy automotive lifestyle photography:
        ${baseCarInfo} in modern Raipur showroom with contemporary design
        - Natural lighting with professional automotive photography setup
        - Clean, minimalist background emphasizing the vehicle
        - CarStreets branding integrated organically into scene
        - Price "${price}" displayed in modern, mobile-friendly format
        - Authentic Indian automotive retail environment
        - Square format optimized for Instagram engagement
        - Professional but accessible visual appeal`;
        
      case 'facebook':
        return `Facebook family-focused car dealership scene:
        ${baseCarInfo} at CarStreets Kushalapur location with welcoming atmosphere
        - Family-friendly showroom environment with trust-building elements
        - Transparent pricing "${price}" prominently but tastefully displayed
        - "Quality Pre-Owned Cars • ${profile.operations.operating_hours}" information
        - Honest representation building customer confidence
        - Professional documentation and certification visible
        - Community-focused, local business atmosphere`;
        
      case 'linkedin':
        return `Professional automotive business presentation:
        ${baseCarInfo} at CarStreets corporate facility in business context
        - Executive handshake or consultation scene suggesting professionalism
        - Premium vehicle presentation emphasizing investment value "${price}"
        - Corporate documentation and quality assurance processes visible
        - Raipur business district context with professional environment
        - 16:9 landscape format for LinkedIn business feed
        - Emphasize expertise, reliability, and business-grade service`;
    }
  }
  
  return `Professional CarStreets automotive marketing image for ${baseCarInfo}`;
}

// ✅ FESTIVAL POSTER GENERATION
export function getFestivalPrompt(params: ImagePromptParams): string {
  const { car, platform, festival, imageUrl } = params;
  const baseCarInfo = `${car.year} ${car.brand} ${car.model}`;
  const price = `₹${car.price || 'Price on Request'}`;
  
  const festivalThemes = {
    'diwali': {
      elements: 'Traditional diyas, rangoli patterns, golden lighting, prosperity symbols',
      offer: 'Diwali Special Offers',
      message: 'Bring home prosperity this Diwali'
    },
    'holi': {
      elements: 'Vibrant colors, festive atmosphere, spring celebration',
      offer: 'Holi Colorful Deals',
      message: 'Add colors to your journey'
    },
    'dussehra': {
      elements: 'Victory celebration, traditional decorations, success symbols',
      offer: 'Victorious Dussehra Deals',
      message: 'Victory in every journey'
    },
    'ganesh-chaturthi': {
      elements: 'Lord Ganesh blessings, prosperity symbols, traditional decorations',
      offer: 'Ganesh Chaturthi Blessings',
      message: 'Blessed journeys ahead'
    },
    'navratri': {
      elements: 'Nine nights celebration, traditional colors, dance and joy',
      offer: 'Navratri Celebration Offers',
      message: 'Dance your way to your dream car'
    }
  };
  
  const theme = festivalThemes[festival!];
  
  if (imageUrl) {
    return `Transform this car photograph into a ${festival} festival promotional poster:
    - ${theme.elements} integrated naturally around the ${baseCarInfo}
    - "${theme.offer}" text prominently displayed
    - "${theme.message}" motivational tagline
    - Price "${price}" in festive typography
    - "CarStreets Raipur" branding with cultural respect
    - Platform-optimized for ${platform} (${platform === 'linkedin' ? '16:9' : '1:1'})
    - Professional automotive photography maintaining car authenticity
    - Culturally appropriate and respectful festival representation`;
  } else {
    return `${festival.charAt(0).toUpperCase() + festival.slice(1)} festival automotive promotional poster:
    ${baseCarInfo} displayed in festive ${festival} celebration setting
    - ${theme.elements} creating beautiful cultural context
    - CarStreets showroom decorated for ${festival} festivities
    - "${theme.offer}" and "${theme.message}" messaging
    - Festive price display "${price}" with cultural design elements
    - Professional automotive photography with festival enhancement
    - Raipur local cultural context and authentic celebration atmosphere`;
  }
}

// ✅ TRUST-BUILDING ELEMENTS
export function addAutomotiveCertification(platform: string): string {
  const certifications = {
    instagram: 'CarStreets Verified ✓ • Quality Assured',
    facebook: 'Certified Pre-Owned • Inspection Report Available • Trusted Dealer',
    linkedin: 'Premium Vehicle Certification • CarStreets Quality Assured • Professional Service'
  };
  
  return certifications[platform as keyof typeof certifications] || 'CarStreets Certified';
}

// ✅ PROMPT QUALITY METRICS
export function getPromptMetrics(prompt: string): {
  length: number;
  keywordDensity: number;
  hasCallToAction: boolean;
  hasPricing: boolean;
  hasBranding: boolean;
} {
  return {
    length: prompt.length,
    keywordDensity: (prompt.match(/CarStreets|automotive|professional|quality/gi) || []).length,
    hasCallToAction: /offer|deal|available|contact/i.test(prompt),
    hasPricing: /₹|price|cost/i.test(prompt),
    hasBranding: /CarStreets|Raipur/i.test(prompt)
  };
}
