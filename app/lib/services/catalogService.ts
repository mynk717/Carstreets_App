import { prisma } from '@/lib/prisma';

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  availability: 'in stock' | 'out of stock' | 'preorder';
  condition: 'new' | 'used' | 'refurbished';
  price: string;
  link: string;
  image_link: string;
  additional_image_link?: string;
  brand: string;
  product_type: string;
  // Auto-specific fields
  vehicle_type: string;
  year: number;
  make: string;
  model: string;
  mileage?: { value: number; unit: string };
  transmission: string;
  fuel_type: string;
  vin?: string;
  body_style?: string;
  exterior_color?: string;
  interior_color?: string;
}

export class CatalogService {
  /**
   * Generate Meta Commerce catalog from dealer inventory
   * Spec: https://developers.facebook.com/docs/marketing-api/catalog/guides/product-feeds
   */
  async generateCatalogFromInventory(dealerId: string): Promise<{
    items: CatalogItem[];
    totalItems: number;
  }> {
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: { subdomain: true, customDomain: true },
    });

    if (!dealer) throw new Error('Dealer not found');

    const cars = await prisma.car.findMany({
      where: {
        dealerId,
        isVerified: true,
      },
    });

    const baseUrl = dealer.customDomain
      ? `https://${dealer.customDomain}`
      : `https://${dealer.subdomain}.motoyard.mktgdime.com`;

    const items: CatalogItem[] = cars.map((car) => {
     // Parse images - Handle Prisma JsonValue type
let images: string[] = [];

if (car.images) {
  if (Array.isArray(car.images)) {
    images = car.images as string[];
  } else if (typeof car.images === 'object' && car.images !== null) {
    const imageData = car.images as any;
    if (Array.isArray(imageData)) {
      images = imageData;
    } else if (imageData.length !== undefined) {
      images = Array.from(imageData);
    } else {
      images = Object.values(imageData).filter(v => typeof v === 'string') as string[];
    }
  } else if (typeof car.images === 'string') {
    try {
      const parsed = JSON.parse(car.images);
      images = Array.isArray(parsed) ? parsed : [car.images];
    } catch {
      images = [car.images];
    }
  }
}

// ✅ ADD THIS: Clean up markdown-style links
images = images.map(url => {
  // Remove markdown formatting: [url](url) -> url
  const match = url.match(/\[?(https?:\/\/[^\]]+)\]?\(?(https?:\/\/[^\)]+)?\)?/);
  return match ? (match[2] || match[1]) : url;
}).filter(url => url.startsWith('http')); // Only keep valid URLs

      // Prepare images for catalog
      const primaryImage = images[0] || 'https://motoyard.mktgdime.com/placeholder-car.jpg';
      const additionalImages = images.slice(1, 10); // Up to 9 more images

      return {
        id: car.id,
        title: `${car.year} ${car.brand} ${car.model}${car.variant ? ` ${car.variant}` : ''}`,
        description: car.description || `${car.year} ${car.brand} ${car.model} with ${car.kmDriven.toLocaleString()} km driven`,
        availability: car.availability === 'in_stock' ? 'in stock' : 'out of stock',
        condition: car.condition === 'new' ? 'new' : 'used',
        price: `${car.price} INR`,
        link: `${baseUrl}/cars/${car.id}`,
        image_link: primaryImage,
        additional_image_link: additionalImages.length > 0 ? additionalImages.join(',') : undefined,  // ✅ FIXED: Added this line
        brand: car.brand,
        product_type: 'Vehicles & Parts > Vehicles > Motor Vehicles > Cars',
        vehicle_type: 'car',
        year: car.year,
        make: car.brand,
        model: car.model,
        mileage: { value: car.kmDriven, unit: 'km' },
        transmission: car.transmission,
        fuel_type: car.fuelType,
        body_style: car.variant || undefined,
      };
    });

    return {
      items,
      totalItems: items.length,
    };
  }

  /**
   * Generate XML feed for Google Vehicle Ads
   * Spec: https://support.google.com/merchants/answer/7052112
   */
  async generateXMLFeed(dealerId: string): Promise<string> {
    const { items } = await this.generateCatalogFromInventory(dealerId);

    const xmlItems = items
      .map(
        (item) => `
    <item>
      <g:id>${this.escapeXml(item.id)}</g:id>
      <g:title>${this.escapeXml(item.title)}</g:title>
      <g:description>${this.escapeXml(item.description)}</g:description>
      <g:link>${this.escapeXml(item.link)}</g:link>
      <g:image_link>${this.escapeXml(item.image_link)}</g:image_link>
      ${item.additional_image_link ? 
        item.additional_image_link.split(',').map(url => 
          `<g:additional_image_link>${this.escapeXml(url.trim())}</g:additional_image_link>`
        ).join('\n      ') 
        : ''
      }
      <g:availability>${item.availability}</g:availability>
      <g:price>${item.price}</g:price>
      <g:condition>${item.condition}</g:condition>
      <g:brand>${this.escapeXml(item.brand)}</g:brand>
      <g:product_type>${this.escapeXml(item.product_type)}</g:product_type>
      <g:vehicle_type>${item.vehicle_type}</g:vehicle_type>
      <g:year>${item.year}</g:year>
      <g:make>${this.escapeXml(item.make)}</g:make>
      <g:model>${this.escapeXml(item.model)}</g:model>
      <g:mileage>
        <g:value>${item.mileage?.value}</g:value>
        <g:unit>${item.mileage?.unit}</g:unit>
      </g:mileage>
      <g:transmission>${this.escapeXml(item.transmission)}</g:transmission>
      <g:fuel_type>${this.escapeXml(item.fuel_type)}</g:fuel_type>
    </item>`
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MotoYard Vehicle Catalog</title>
    <link>https://motoyard.mktgdime.com</link>
    <description>Vehicle inventory feed</description>
    ${xmlItems}
  </channel>
</rss>`;
  }

  /**
   * Generate CSV feed for Meta Commerce Manager bulk upload
   * Spec: https://www.facebook.com/business/help/120325381656392
   */
  async generateCSVFeed(dealerId: string): Promise<string> {
    const { items } = await this.generateCatalogFromInventory(dealerId);

    const headers = [
      'id',
      'title',
      'description',
      'availability',
      'condition',
      'price',
      'link',
      'image_link',
      'additional_image_link',
      'brand',
      'vehicle_type',
      'year',
      'make',
      'model',
      'mileage',
      'transmission',
      'fuel_type',
    ];

    const rows = items.map((item) =>
      [
        item.id,
        this.escapeCsv(item.title),
        this.escapeCsv(item.description),
        item.availability,
        item.condition,
        item.price,
        item.link,
        item.image_link,
        item.additional_image_link || '',
        item.brand,
        item.vehicle_type,
        item.year,
        item.make,
        item.model,
        `${item.mileage?.value} ${item.mileage?.unit}`,
        item.transmission,
        item.fuel_type,
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Sync catalog to Meta Commerce Manager via Graph API
   * Docs: https://developers.facebook.com/docs/marketing-api/catalog/batch
   */
  async syncToMetaCatalog(dealerId: string): Promise<{
    success: boolean;
    catalogId?: string;
    itemsProcessed: number;
    error?: string;
  }> {
    try {
      const dealer = await prisma.dealer.findUnique({
        where: { id: dealerId },
        select: {
          facebookCatalogId: true,
          metaAccessToken: true,
        },
      });
  
      const accessToken = dealer?.metaAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      
      if (!accessToken) {
        throw new Error('Meta access token not configured');
      }
  
      if (!dealer?.facebookCatalogId) {
        throw new Error('Facebook Catalog ID not configured');
      }
  
      const { items } = await this.generateCatalogFromInventory(dealerId);
      
      console.log('🔍 Sample catalog item:', JSON.stringify(items[0], null, 2));
      console.log(`📊 Total items to sync: ${items.length}`);
  
      // Transform data to Meta's format
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${dealer.facebookCatalogId}/batch`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: items.map((item) => {
              // Parse additional images to array
              const additionalImages = item.additional_image_link 
                ? item.additional_image_link
                    .split(',')
                    .map(url => {
                      const match = url.trim().match(/\[?(https?:\/\/[^\]]+)\]?(?:\((https?:\/\/[^\)]+)\))?/);
                      return match ? (match[2] || match[1]) : url.trim();
                    })
                    .filter(url => url.startsWith('http'))
                : [];
          
              // Extract numeric price
              const priceString = item.price.replace(' INR', '').trim();
          
              return {
                method: 'UPDATE',
                retailer_id: item.id,  // ✅ Outside of data object!
                data: {
                  // ❌ REMOVED: retailer_id (moved to parent)
                  // ❌ REMOVED: google_product_category (not supported)
                  
                  // Required fields only
                  name: item.title,
                  description: item.description,
                  availability: item.availability,
                  condition: item.condition,
                  price: priceString,
                  currency: 'INR',
                  url: item.link,
                  image_url: item.image_link,
                  additional_image_urls: additionalImages,
                  brand: item.brand,
                },
              };
            }),
          }),
          
        }
      );
  
      const result = await response.json();
  
      console.log('📱 Meta API Response:', JSON.stringify(result, null, 2));
  
      // Check for validation errors
      if (result.validation_status) {
        const hasErrors = result.validation_status.some((item: any) => item.errors && item.errors.length > 0);
        if (hasErrors) {
          const errorSummary = result.validation_status
            .filter((item: any) => item.errors && item.errors.length > 0)
            .map((item: any) => `${item.retailer_id}: ${item.errors.map((e: any) => e.message).join(', ')}`)
            .join('\n');
          
          console.error('❌ Meta validation errors:', errorSummary);
          throw new Error(`Meta validation failed:\n${errorSummary}`);
        }
      }
  
      if (!response.ok) {
        throw new Error(result.error?.message || 'Meta API error');
      }
  
      // Update catalog sync status
      await prisma.productCatalog.upsert({
        where: { dealerId_metaCatalogId: { dealerId, metaCatalogId: dealer.facebookCatalogId || '' } },
        create: {
          dealerId,
          metaCatalogId: dealer.facebookCatalogId,
          catalogName: 'Auto Inventory',
          status: 'synced',
          lastSyncedAt: new Date(),
          itemCount: items.length,
        },
        update: {
          status: 'synced',
          lastSyncedAt: new Date(),
          itemCount: items.length,
          syncError: null,
        },
      });
  
      return {
        success: true,
        catalogId: dealer.facebookCatalogId || undefined,
        itemsProcessed: items.length,
      };
    } catch (error: any) {
      console.error('❌ Sync error:', error);
      
      await prisma.productCatalog.updateMany({
        where: { dealerId },
        data: {
          status: 'failed',
          syncError: error.message,
        },
      });
  
      return {
        success: false,
        itemsProcessed: 0,
        error: error.message,
      };
    }
  }
  
  

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeCsv(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
}

export default new CatalogService();
