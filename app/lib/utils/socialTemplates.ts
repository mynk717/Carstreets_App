// /app/lib/utils/socialTemplates.ts
export const PLATFORM_SPECS = {
  instagram: {
    dimensions: '1080x1080',
    model: 'gemini-2.5-flash-image-preview',
    style: 'vibrant, lifestyle-focused',
    promptSuffix: 'Square format, mobile-optimized, high engagement visual'
  },
  facebook: {
    dimensions: '1080x1080', 
    model: 'gemini-2.5-flash-image-preview',
    style: 'professional, trustworthy',
    promptSuffix: 'Facebook-ready, clean automotive photography'
  },
  linkedin: {
    dimensions: '1200x627',
    model: 'dall-e-3', // Better for professional context
    style: 'corporate, professional',
    promptSuffix: 'Landscape format, business-focused presentation'
  }
};
