-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Market_slug_key" ON "Market"("slug");

-- Backfill existing markets with slugs derived from their titles
UPDATE "Market" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE("title", '[^\w\s-]', '', 'g'), '\s+', '-', 'g'), '-+', '-', 'g')) WHERE "slug" IS NULL;

-- Handle duplicate slugs by appending a random suffix
DO $$
DECLARE
    rec RECORD;
    counter INT := 1;
BEGIN
    FOR rec IN
        SELECT "id", "slug" FROM (
            SELECT "id", "slug",
                   ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "createdAt") AS rn
            FROM "Market"
            WHERE "slug" IS NOT NULL
        ) sub WHERE rn > 1
    LOOP
        UPDATE "Market" SET "slug" = rec."slug" || '-' || counter || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4)
        WHERE "id" = rec."id";
        counter := counter + 1;
    END LOOP;
END $$;
