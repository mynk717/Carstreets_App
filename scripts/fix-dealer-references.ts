import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Fixing invalid dealerId references...\n')

  // Get the CarStreets dealer
  const carstreets = await prisma.dealer.findUnique({
    where: { subdomain: 'carstreets' },
  })

  if (!carstreets) {
    console.error('❌ CarStreets dealer not found!')
    return
  }

  console.log(`✅ Found CarStreets dealer: ${carstreets.id}\n`)

  // Fix ContentCalendar records with 'carstreets' string instead of ID
  const fixedContent = await prisma.$executeRaw`
    UPDATE "ContentCalendar"
    SET "dealerId" = ${carstreets.id}
    WHERE "dealerId" = 'carstreets'
  `
  console.log(`✅ Fixed ${fixedContent} ContentCalendar records`)

  // Fix Cars if any
  const fixedCars = await prisma.$executeRaw`
    UPDATE "cars"
    SET "dealerId" = ${carstreets.id}
    WHERE "dealerId" = 'carstreets'
  `
  console.log(`✅ Fixed ${fixedCars} Car records`)

  // Fix other tables
  const fixedTokens = await prisma.$executeRaw`
    UPDATE "SocialMediaToken"
    SET "dealerId" = ${carstreets.id}
    WHERE "dealerId" = 'carstreets'
  `
  console.log(`✅ Fixed ${fixedTokens} SocialMediaToken records`)

  const fixedPosts = await prisma.$executeRaw`
    UPDATE "SocialPost"
    SET "dealerId" = ${carstreets.id}
    WHERE "dealerId" = 'carstreets'
  `
  console.log(`✅ Fixed ${fixedPosts} SocialPost records`)

  const fixedContacts = await prisma.$executeRaw`
    UPDATE "WhatsAppContact"
    SET "dealerId" = ${carstreets.id}
    WHERE "dealerId" = 'carstreets'
  `
  console.log(`✅ Fixed ${fixedContacts} WhatsAppContact records`)

  const fixedFestival = await prisma.$executeRaw`
    UPDATE "FestivalContent"
    SET "dealerId" = ${carstreets.id}
    WHERE "dealerId" = 'carstreets'
  `
  console.log(`✅ Fixed ${fixedFestival} FestivalContent records`)

  console.log('\n🎉 All references fixed!')

  // Verify
  const invalidContent = await prisma.contentCalendar.findMany({
    where: { dealerId: 'carstreets' as any },
  })
  console.log(`\n✅ Remaining invalid references: ${invalidContent.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
