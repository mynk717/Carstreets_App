import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking for NULL dealerId records...\n')

  // Check cars
  const carsWithNullDealer = await prisma.car.findMany({
    where: { dealerId: null },
    select: { id: true, title: true, dealerId: true },
  })
  console.log(`Cars with NULL dealerId: ${carsWithNullDealer.length}`)
  if (carsWithNullDealer.length > 0) {
    console.log('Sample:', carsWithNullDealer.slice(0, 3))
  }

  // Check content calendar
  const contentWithNullDealer = await prisma.contentCalendar.findMany({
    where: { dealerId: null },
    select: { id: true, platform: true, dealerId: true },
  })
  console.log(`\nContent Calendar with NULL dealerId: ${contentWithNullDealer.length}`)
  if (contentWithNullDealer.length > 0) {
    console.log('Sample:', contentWithNullDealer.slice(0, 3))
  }

  // Check dealer exists
  const dealers = await prisma.dealer.findMany()
  console.log(`\n✅ Total Dealers in database: ${dealers.length}`)
  dealers.forEach(d => {
    console.log(`  - ${d.subdomain} (${d.id})`)
  })

  // Check for invalid dealerId references
  const allContent = await prisma.contentCalendar.findMany({
    select: { id: true, dealerId: true },
  })
  
  const dealerIds = new Set(dealers.map(d => d.id))
  const invalidRefs = allContent.filter(c => c.dealerId && !dealerIds.has(c.dealerId))
  
  console.log(`\n⚠️  Content with invalid dealerId references: ${invalidRefs.length}`)
  if (invalidRefs.length > 0) {
    console.log('Sample:', invalidRefs.slice(0, 3))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
