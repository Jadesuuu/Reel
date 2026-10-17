-- AlterTable
ALTER TABLE "postings" ADD COLUMN     "zone_terms" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "postings" ADD COLUMN     "zone_overlap" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "postings" ADD COLUMN     "hire_signals" TEXT[] DEFAULT ARRAY[]::TEXT[];
