-- AlterTable
ALTER TABLE "postings" ADD COLUMN     "region_terms" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "criteria" ADD COLUMN     "region_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
