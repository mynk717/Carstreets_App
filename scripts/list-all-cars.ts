import { prisma } from '@/lib/prisma'

async function main() {
  const result = await prisma.car.updateMany({
    where: {
      dealerId: 'cmge1qglb0000zqf08w6xdflz' // CarStreets
    },
    data: {
      carStreetsListed: true
    }
  })
  
  console.log(`✅ Listed ${result.count} cars on CarStreets storefront`)
}

main().finally(() => prisma.$disconnect())
