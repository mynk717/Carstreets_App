const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWhatsAppStatus() {
  const dealerId = 'cmge1qglb0000zqf08w6xdflz'; // CarStreets dealer ID

  try {
    // Check dealer WhatsApp credentials
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      select: {
        businessName: true,
        subdomain: true,
        whatsappBusinessAccountId: true,
        whatsappBusinessNumber: true,
        whatsappApiToken: true,
        whatsappBusinessVerified: true,
      },
    });

    if (!dealer) {
      console.log('❌ Dealer not found!');
      return;
    }

    console.log('📊 WhatsApp Connection Status for:', dealer.businessName);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const isConnected = !!(dealer.whatsappBusinessAccountId && dealer.whatsappApiToken);
    
    console.log('🔗 Connection Status:', isConnected ? '✅ CONNECTED' : '❌ NOT CONNECTED');
    console.log('\n📋 Credentials:');
    console.log('  WABA ID:', dealer.whatsappBusinessAccountId || '❌ Not set');
    console.log('  Phone Number:', dealer.whatsappBusinessNumber || '❌ Not set');
    console.log('  Access Token:', dealer.whatsappApiToken ? '✅ Set' : '❌ Not set');
    console.log('  Verified:', dealer.whatsappBusinessVerified ? '✅ Yes' : '❌ No');

    // Check contacts count
    const contactsCount = await prisma.whatsAppContact.count({
      where: { dealerId },
    });
    console.log('\n📞 WhatsApp Contacts:', contactsCount);

    // Check templates count
    const templatesCount = await prisma.whatsAppTemplate.count({
      where: { dealerId },
    });
    console.log('📝 Message Templates:', templatesCount);

    // Check template statuses
    if (templatesCount > 0) {
      const templates = await prisma.whatsAppTemplate.findMany({
        where: { dealerId },
        select: { name: true, status: true, language: true },
      });
      
      console.log('\n📄 Templates:');
      templates.forEach((t, idx) => {
        console.log(`  ${idx + 1}. ${t.name} [${t.language}] - ${t.status}`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!isConnected) {
      console.log('\n🔧 Next Steps:');
      console.log('1. Go to: https://business.facebook.com/wa/manage/home');
      console.log('2. Select WhatsApp Account');
      console.log('3. Copy WABA ID and Phone Number');
      console.log('4. Generate System User Access Token with whatsapp_business_messaging permission');
      console.log('5. Update in dashboard: /dealers/' + dealer.subdomain + '/dashboard/settings');
    } else {
      console.log('\n✅ WhatsApp is connected! You can:');
      console.log('• Add contacts: /dealers/' + dealer.subdomain + '/dashboard/whatsapp/contacts');
      console.log('• Create templates: /dealers/' + dealer.subdomain + '/dashboard/whatsapp/templates');
      console.log('• Send messages from dashboard');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkWhatsAppStatus();
