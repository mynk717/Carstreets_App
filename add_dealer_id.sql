ALTER TABLE "ContentCalendar" ADD COLUMN IF NOT EXISTS "dealerId" VARCHAR(191);
CREATE INDEX IF NOT EXISTS idx_ContentCalendar_dealerId ON "ContentCalendar" ("dealerId");

ALTER TABLE "FestivalContent" ADD COLUMN IF NOT EXISTS "dealerId" VARCHAR(191);
CREATE INDEX IF NOT EXISTS idx_FestivalContent_dealerId ON "FestivalContent" ("dealerId");

ALTER TABLE "SocialMediaToken" ADD COLUMN IF NOT EXISTS "dealerId" VARCHAR(191);
CREATE INDEX IF NOT EXISTS idx_SocialMediaToken_dealerId ON "SocialMediaToken" ("dealerId");

ALTER TABLE "SocialPost" ADD COLUMN IF NOT EXISTS "dealerId" VARCHAR(191);
CREATE INDEX IF NOT EXISTS idx_SocialPost_dealerId ON "SocialPost" ("dealerId");

ALTER TABLE "WhatsAppContact" ADD COLUMN IF NOT EXISTS "dealerId" VARCHAR(191);
CREATE INDEX IF NOT EXISTS idx_WhatsAppContact_dealerId ON "WhatsAppContact" ("dealerId");

UPDATE "ContentCalendar" SET "dealerId" = 'carstreets' WHERE "dealerId" IS NULL;
UPDATE "FestivalContent" SET "dealerId" = 'carstreets' WHERE "dealerId" IS NULL;
UPDATE "SocialMediaToken" SET "dealerId" = 'carstreets' WHERE "dealerId" IS NULL;
UPDATE "SocialPost" SET "dealerId" = 'carstreets' WHERE "dealerId" IS NULL;
UPDATE "WhatsAppContact" SET "dealerId" = 'carstreets' WHERE "dealerId" IS NULL;
