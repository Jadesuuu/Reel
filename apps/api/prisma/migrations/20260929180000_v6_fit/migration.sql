-- AlterTable
ALTER TABLE "postings" ADD COLUMN     "level" TEXT;

-- AlterTable
ALTER TABLE "criteria" ADD COLUMN     "nearby_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "criteria" ADD COLUMN     "levels" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "matches_seen_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "matches_user_id_created_at_idx" ON "matches"("user_id", "created_at");
