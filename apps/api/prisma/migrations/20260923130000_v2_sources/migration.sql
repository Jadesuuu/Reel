-- AlterEnum
ALTER TYPE "Source" ADD VALUE 'REMOTIVE';
ALTER TYPE "Source" ADD VALUE 'REMOTEOK';
ALTER TYPE "Source" ADD VALUE 'ARBEITNOW';
ALTER TYPE "Source" ADD VALUE 'HIMALAYAS';
ALTER TYPE "Source" ADD VALUE 'JOBICY';
ALTER TYPE "Source" ADD VALUE 'WEWORKREMOTELY';
ALTER TYPE "Source" ADD VALUE 'GREENHOUSE';
ALTER TYPE "Source" ADD VALUE 'LEVER';
ALTER TYPE "Source" ADD VALUE 'ASHBY';

-- RenameColumn (hand-written: a drop/add would lose every existing row's value)
ALTER TABLE "ingest_runs" RENAME COLUMN "external_thread_id" TO "board_id";
ALTER TABLE "ingest_runs" RENAME COLUMN "comments_seen" TO "items_seen";
ALTER TABLE "postings" RENAME COLUMN "thread_id" TO "board_id";

-- RenameIndex
ALTER INDEX "postings_thread_id_idx" RENAME TO "postings_board_id_idx";

-- AlterTable
ALTER TABLE "postings" ADD COLUMN "url" TEXT;

-- Backfill: every existing posting is from HN, and its page is the comment permalink
UPDATE "postings" SET "url" = 'https://news.ycombinator.com/item?id=' || "external_id" WHERE "source" = 'HN';

-- CreateTable
CREATE TABLE "source_settings" (
    "source" "Source" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_settings_pkey" PRIMARY KEY ("source")
);

-- CreateTable
CREATE TABLE "watched_boards" (
    "id" TEXT NOT NULL,
    "provider" "Source" NOT NULL,
    "slug" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watched_boards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "watched_boards_provider_slug_key" ON "watched_boards"("provider", "slug");
