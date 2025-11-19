#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MOTOYARD STRUCTURE AUDIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📁 1. DEALER & CAR PAGE STRUCTURE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find app -type f \( -name "page.tsx" -o -name "layout.tsx" \) | grep -E "dealer|car" | sort | while read file; do
  echo "  📄 $file"
done

echo ""
echo "🗄️  2. PRISMA SCHEMA - DEALER MODEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
awk '/model Dealer \{/,/^\}/' prisma/schema.prisma | head -60

echo ""
echo "🗄️  3. PRISMA SCHEMA - CAR MODEL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
awk '/model Car \{/,/^\}/' prisma/schema.prisma | head -60

echo ""
echo "☁️  4. CLOUDINARY CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -i "cloudinary\|cloud_name\|upload_preset" .env.local 2>/dev/null || echo "  ⚠️  No Cloudinary config found in .env.local"

echo ""
echo "🖼️  5. IMAGE FIELDS IN SCHEMA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "logo|image|photo|avatar" prisma/schema.prisma | grep -v "//.*" | head -20

echo ""
echo "🔍 6. EXISTING METADATA IMPLEMENTATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -l "generateMetadata" app/**/*.tsx 2>/dev/null | while read file; do
  echo "  📄 $file"
  grep -A 3 "export async function generateMetadata" "$file" | head -4
  echo ""
done

echo ""
echo "🚗 7. CAR DETAIL PAGE LOCATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
find app -type f -name "page.tsx" | xargs grep -l "car.*detail\|vehicle.*detail" 2>/dev/null || \
find app/dealers -type d -name "[id]" -o -name "[carId]" 2>/dev/null || \
echo "  ⚠️  Searching manually..."
ls -la app/dealers/*/cars/ 2>/dev/null || echo "  ℹ️  No cars subdirectory found"

echo ""
echo "📊 8. IMAGE HANDLING IN COMPONENTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Images array access:"
grep -r "images\[" app/dealers --include="*.tsx" | head -5
echo ""
echo "  Logo usage:"
grep -r "\.logo" app/dealers --include="*.tsx" | head -5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AUDIT COMPLETE ✓"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
