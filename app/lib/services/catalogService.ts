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
        availability: 'in_stock',
      },
    });

    const baseUrl = dealer.customDomain
      ? `https://${dealer.customDomain}`
      : `https://${dealer.subdomain}.carstreets.com`;

    const items: CatalogItem[] = cars.map((car) => {
      // Parse images
      let images: string[] = [];
      if (Array.isArray(car.images)) {
        images = car.images as string[];
      } else if (typeof car.images === 'string') {
        try {
          const parsed = JSON.parse(car.images);
          images = Array.isArray(parsed) ? parsed : [car.images];
        } catch {
          images = [car.images];
        }
      }

      return {
        id: car.id,
        title: `${car.year} ${car.brand} ${car.model}${car.variant ? ` ${car.variant}` : ''}`,
        description: car.description || `${car.year} ${car.brand} ${car.model} with ${car.kmDriven.toLocaleString()} km driven`,
        availability: car.availability === 'in_stock' ? 'in stock' : 'out of stock',
        condition: car.condition === 'new' ? 'new' : 'used',
        price: `${car.price} INR`,
        link: `${baseUrl}/cars/${car.id}`,
        image_link: images[0] || '',
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
    <title>CarStreets Vehicle Catalog</title>
    <link>https://carstreets.com</link>
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

      if (!dealer?.metaAccessToken) {
        throw new Error('Meta access token not configured');
      }

      const { items } = await this.generateCatalogFromInventory(dealerId);

      // Batch upload to Meta Catalog
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${dealer.facebookCatalogId}/batch`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${dealer.metaAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: items.map((item) => ({
              method: 'UPDATE',
              retailer_id: item.id,
              data: item,
            })),
          }),
        }
      );

      const result = await response.json();

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
      // Log sync error
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
