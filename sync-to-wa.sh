#!/bin/bash
echo "🔄 Syncing Prisma schema from MotoYard to wa-mktgdime..."

# Push from MotoYard
echo "1️⃣ Pushing schema to database..."
npx prisma db push
npx prisma generate

# Copy to wa-mktgdime
echo "2️⃣ Copying schema to wa-mktgdime..."
cp prisma/schema.prisma ~/wa-mktgdime/prisma/

# Generate client in wa-mktgdime
echo "3️⃣ Generating Prisma client in wa-mktgdime..."
cd ~/wa-mktgdime
npx prisma generate

echo "✅ Sync complete!"
