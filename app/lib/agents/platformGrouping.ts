export interface PlatformSpec {
    ratio: 'square' | 'story' | 'landscape';
    size: string;
    tone: string;
    hashtags: number;
    maxChars: number;
    template?: boolean;
  }
  
  export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
    instagram: { 
      ratio: 'square', 
      size: '1080x1080',
      tone: 'lifestyle-aspirational',
      hashtags: 15,
      maxChars: 2200
    },
    facebook: { 
      ratio: 'square', 
      size: '1080x1080',
      tone: 'family-friendly-warm',
      hashtags: 5,
      maxChars: 5000
    },
    linkedin: { 
      ratio: 'square', 
      size: '1080x1080',
      tone: 'professional-business',
      hashtags: 3,
      maxChars: 3000
    },
    whatsapp: { 
      ratio: 'square', 
      size: '1080x1080',
      tone: 'direct-conversational',
      template: true,
      hashtags: 0,
      maxChars: 1024
    }
  };
  
  export function groupPlatformsByRatio(platforms: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    
    platforms.forEach(platform => {
      const spec = PLATFORM_SPECS[platform];
      if (!spec) return;
      
      const ratio = spec.ratio;
      if (!groups[ratio]) groups[ratio] = [];
      groups[ratio].push(platform);
    });
    
    return groups;
  }
  
  export function estimateCost(platforms: string[], carCount: number): number {
    const groups = groupPlatformsByRatio(platforms);
    const imageCount = Object.keys(groups).length * carCount;
    return imageCount * 0.04; // ₹0.04 per image
  }
  