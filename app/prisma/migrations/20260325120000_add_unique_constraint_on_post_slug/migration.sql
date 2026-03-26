-- Normalize slugs to match app rules before adding uniqueness
UPDATE "posts"
SET "slug" = LEFT(
  TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(LOWER(TRIM("slug")), '[^a-z0-9-]+', '-', 'g'), '-+', '-', 'g')),
  50
);

UPDATE "posts"
SET "slug" = 'post-' || SUBSTR(MD5("id"::TEXT), 1, 8)
WHERE "slug" = '' OR "slug" IS NULL;

-- Deduplicate: append id fragment for rows after the first per slug
WITH "ranked" AS (
  SELECT "id", "slug",
    ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "created_at") AS "rn"
  FROM "posts"
)
UPDATE "posts" AS p
SET "slug" = LEFT(
  TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(LOWER(TRIM(
    p."slug" || '-' || LEFT(REPLACE(p."id"::TEXT, '-', ''), 8)
  )), '[^a-z0-9-]+', '-', 'g'), '-+', '-', 'g')),
  50
)
FROM "ranked" AS r
WHERE p."id" = r."id" AND r."rn" > 1;

-- Align column type with Prisma @db.VarChar(50)
ALTER TABLE "posts" ALTER COLUMN "slug" SET DATA TYPE VARCHAR(50);

-- Unique constraint on slug
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");
