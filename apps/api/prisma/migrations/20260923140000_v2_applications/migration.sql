-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('STAGE_CHANGE', 'NOTE');

-- AlterEnum
ALTER TYPE "ReminderKind" ADD VALUE 'FOLLOW_UP';

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "applied_at" TIMESTAMP(3),
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "next_step_at" TIMESTAMP(3),
ADD COLUMN     "salary_text" TEXT,
ADD COLUMN     "via" TEXT;

-- AlterTable
ALTER TABLE "stage_events" ADD COLUMN     "kind" "EventKind" NOT NULL DEFAULT 'STAGE_CHANGE';

-- Backfill: an application that has ever been moved to APPLIED gets that first move as applied_at
UPDATE "applications" a
SET "applied_at" = (
  SELECT MIN(e."created_at") FROM "stage_events" e
  WHERE e."application_id" = a."id" AND e."to_stage" = 'APPLIED'
)
WHERE a."applied_at" IS NULL;

-- Backfill: applications created from an HN posting were found via Hacker News
UPDATE "applications" SET "via" = 'Hacker News'
WHERE "via" IS NULL AND "posting_id" IN (SELECT "id" FROM "postings" WHERE "source" = 'HN');
