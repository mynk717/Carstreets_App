export interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location?: string;
  features?: string[];
  images?: string[];
}

export function generateCarPrompt(
  carData: CarData, 
  userPrompt: string, 
  platform: string, 
  style: string = 'photorealistic'
): string {
  const aspectRatio = platform === 'instagram' || platform === 'facebook' 
    ? 'Square image (1:1 aspect ratio)' 
    : 'Landscape format (16:9 aspect ratio)';
    
  const location = carData.location || 'Raipur, Chhattisgarh';
  
  const basePrompt = `A ${style} photograph showcasing a ${carData.year} ${carData.make} ${carData.model} priced at ₹${carData.price}. 
Located in ${location}. ${userPrompt}. 
Professional automotive photography with clean composition. ${aspectRatio}.
CarStreets watermark in bottom right corner.`;

  return basePrompt;
}

export const PLATFORM_SPECS = {
  instagram: {
    dimensions: '1080x1080',
    aspectRatio: '1:1',
    style: 'vibrant, lifestyle-focused',
    promptSuffix: 'Square format, mobile-optimized, high engagement visual'
  },
  facebook: {
    dimensions: '1080x1080', 
    aspectRatio: '1:1',
    style: 'professional, trustworthy',
    promptSuffix: 'Facebook-ready, clean automotive photography'
  },
  linkedin: {
    dimensions: '1200x627',
    aspectRatio: '16:9',
    style: 'corporate, professional',
    promptSuffix: 'Landscape format, business-focused presentation'
  }
};

export const CONTENT_TEMPLATES = {
  lifestyle: (carData: CarData) => 
    `A lifestyle scene featuring a ${carData.year} ${carData.make} ${carData.model} 
     parked outside a modern cafe in Raipur's New Market area. Golden hour lighting 
     with soft shadows. Professional automotive photography.`,
     
  technical: (carData: CarData) => 
    `A clean, studio-lit product photograph of a ${carData.year} ${carData.make} ${carData.model}.
     Professional automotive photography with detailed specifications overlay. Clean background.`,
     
  promotional: (carData: CarData) => 
    `Create a dynamic promotional image for a ${carData.year} ${carData.make} ${carData.model}
     available at CarStreets. Include price ₹${carData.price} in bold text.
     Eye-catching design with CarStreets branding.`
};
