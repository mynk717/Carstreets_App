import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting dealer data migration...')

  // Create CarStreets dealer
  const carstreets = await prisma.dealer.upsert({
    where: { subdomain: 'carstreets' },
    update: {},
    create: {
      name: 'CarStreets',
      email: 'info@carstreets.com',
      subdomain: 'carstreets',
      businessName: 'CarStreets Auto Solutions',
      location: 'Raipur, Chhattisgarh',
      description: 'Premium used cars in Raipur',
      plan: 'pro',
      subscriptionStatus: 'active',
    },
  })

  console.log('✅ CarStreets dealer created:', carstreets.id)

  // Update all existing cars
  const carsResult = await prisma.car.updateMany({
    where: { dealerId: null },
    data: { dealerId: carstreets.id },
  })
  console.log(`✅ Updated ${carsResult.count} cars`)

  // Update all content calendar
  const contentResult = await prisma.contentCalendar.updateMany({
    where: { dealerId: null },
    data: { dealerId: carstreets.id },
  })
  console.log(`✅ Updated ${contentResult.count} content items`)

  // Update social media tokens
  const tokensResult = await prisma.socialMediaToken.updateMany({
    where: { dealerId: null },
    data: { dealerId: carstreets.id },
  })
  console.log(`✅ Updated ${tokensResult.count} social tokens`)

  // Update social posts
  const postsResult = await prisma.socialPost.updateMany({
    where: { dealerId: null },
    data: { dealerId: carstreets.id },
  })
  console.log(`✅ Updated ${postsResult.count} social posts`)

  // Update WhatsApp contacts
  const contactsResult = await prisma.whatsAppContact.updateMany({
    where: { dealerId: null },
    data: { dealerId: carstreets.id },
  })
  console.log(`✅ Updated ${contactsResult.count} WhatsApp contacts`)

  // Update festival content
  const festivalResult = await prisma.festivalContent.updateMany({
    where: { dealerId: null },
    data: { dealerId: carstreets.id },
  })
  console.log(`✅ Updated ${festivalResult.count} festival contents`)

  console.log('\n🎉 Migration completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
