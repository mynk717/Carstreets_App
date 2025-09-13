// In your admin route files, add these imports:
import { verifyAdminAuth } from '@/lib/auth/admin'
import { fetchCarById } from '@/lib/database/db'
import { extractOLXMetadata } from '@/lib/scrapers/url-extractor'
import { validateImageUrls } from '@/lib/utils/image-validator'
