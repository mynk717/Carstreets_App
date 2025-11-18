import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TenantType = 'dealer' | 'business';

export class TenantService {
  /**
   * Get WhatsApp config for either dealer or business
   */
  static async getWhatsAppConfig(tenantId: string, tenantType: TenantType) {
    if (tenantType === 'dealer') {
      return await prisma.dealer.findUnique({
        where: { id: tenantId },
        select: {
          whatsappPhoneNumberId: true,
          whatsappApiToken: true,
          whatsappBusinessAccountId: true
        }
      });
    } else {
      return await prisma.business.findUnique({
        where: { id: tenantId },
        select: {
          whatsappPhoneNumberId: true,
          whatsappApiToken: true,
          whatsappBusinessAccountId: true
        }
      });
    }
  }

  /**
   * Get tenant by subdomain (works for both)
   */
  static async getTenantBySubdomain(subdomain: string): Promise<{ id: string; type: TenantType } | null> {
    // Try dealer first
    const dealer = await prisma.dealer.findUnique({
      where: { subdomain },
      select: { id: true }
    });
    
    if (dealer) {
      return { id: dealer.id, type: 'dealer' };
    }

    // Try business
    const business = await prisma.business.findUnique({
      where: { subdomain },
      select: { id: true }
    });

    if (business) {
      return { id: business.id, type: 'business' };
    }

    return null;
  }
}
