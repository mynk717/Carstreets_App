// scripts/set-dealer-password.ts
import { prisma } from '../app/lib/prisma';
import bcrypt from 'bcryptjs';

async function setPassword() {
  const email = 'carstreetsmynk@gmail.com';
  const password = 'Skoda@321';

  const passwordHash = await bcrypt.hash(password, 12);

  const updated = await prisma.dealer.update({
    where: { email },
    data: { passwordHash }
  });

  console.log('✅ Password set for dealer:', updated.email);
  console.log('You can now login with:', password);
  
  process.exit(0);
}

setPassword().catch(console.error);
