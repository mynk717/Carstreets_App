import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env file
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Check WhatsApp Business Account and Phone Number Status
const WABA_ID = '1080466230659385';
const PHONE_NUMBER_ID = '777418242131073';
const ACCESS_TOKEN = 
  process.env.WHATSAPP_API_TOKEN || 
  process.env.WHATSAPP_ACCESS_TOKEN ||
  process.env.MOTOYARD_WHATSAPP_PLATFORM_TOKEN;

async function checkWhatsAppStatus() {
  console.log('🔍 Checking WhatsApp Business Account Status...\n');
  
  if (!ACCESS_TOKEN) {
    console.error('❌ No access token found in environment variables.');
    console.error('Checked: WHATSAPP_API_TOKEN, WHATSAPP_ACCESS_TOKEN, MOTOYARD_WHATSAPP_PLATFORM_TOKEN');
    process.exit(1);
  }
  
  console.log(`🔑 Using token: ${ACCESS_TOKEN.substring(0, 20)}...`);
  console.log('');
  
  try {
    // 1. Check WABA Status
    console.log('1️⃣ Checking WABA (Business Account)...');
    const wabaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WABA_ID}?fields=id,name,currency,timezone_id,message_template_namespace,account_review_status,business_verification_status`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );
    
    const wabaData = await wabaResponse.json();
    
    if (wabaData.error) {
      console.log('❌ WABA Error:', wabaData.error.message);
      console.log('   Error Code:', wabaData.error.code);
      console.log('   Error Type:', wabaData.error.type);
    } else {
      console.log('✅ WABA Status:');
      console.log(`   - ID: ${wabaData.id}`);
      console.log(`   - Name: ${wabaData.name || 'N/A'}`);
      console.log(`   - Currency: ${wabaData.currency || 'N/A'}`);
      console.log(`   - Timezone: ${wabaData.timezone_id || 'N/A'}`);
      console.log(`   - Account Review: ${wabaData.account_review_status || 'N/A'}`);
      console.log(`   - Business Verification: ${wabaData.business_verification_status || 'N/A'}`);
    }
    
    console.log('\n');
    
    // 2. Check Phone Number Status
    console.log('2️⃣ Checking Phone Number...');
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}?fields=id,verified_name,display_phone_number,quality_rating,messaging_limit_tier,status,certificate,code_verification_status`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );
    
    const phoneData = await phoneResponse.json();
    
    if (phoneData.error) {
      console.log('❌ Phone Number Error:', phoneData.error.message);
      console.log('   Error Code:', phoneData.error.code);
    } else {
      console.log('✅ Phone Number Status:');
      console.log(`   - ID: ${phoneData.id}`);
      console.log(`   - Verified Name: ${phoneData.verified_name || 'N/A'}`);
      console.log(`   - Display Number: ${phoneData.display_phone_number || 'N/A'}`);
      console.log(`   - Quality Rating: ${phoneData.quality_rating || 'N/A'}`);
      console.log(`   - Messaging Limit: ${phoneData.messaging_limit_tier || 'N/A'}`);
      console.log(`   - Status: ${phoneData.status || 'N/A'}`);
      console.log(`   - Certificate: ${phoneData.certificate || 'N/A'}`);
      console.log(`   - Code Verification: ${phoneData.code_verification_status || 'N/A'}`);
    }
    
    console.log('\n');
    
    // 3. Check Templates
    console.log('3️⃣ Checking Templates...');
    const templatesResponse = await fetch(
      `https://graph.facebook.com/v18.0/${WABA_ID}/message_templates?fields=name,status,category,language`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );
    
    const templatesData = await templatesResponse.json();
    
    if (templatesData.error) {
      console.log('❌ Templates Error:', templatesData.error.message);
    } else {
      const templates = templatesData.data || [];
      console.log(`✅ Templates: ${templates.length} found`);
      templates.forEach((t: any) => {
        console.log(`   - ${t.name} (${t.status}) - ${t.category} [${t.language}]`);
      });
    }
    
    console.log('\n✅ Status check complete!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkWhatsAppStatus();
