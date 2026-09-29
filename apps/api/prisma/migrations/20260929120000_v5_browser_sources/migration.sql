-- AlterEnum
ALTER TYPE "Source" ADD VALUE 'HIRINGCAFE';
ALTER TYPE "Source" ADD VALUE 'WELLFOUND';
ALTER TYPE "Source" ADD VALUE 'JOBSTREET';
ALTER TYPE "Source" ADD VALUE 'KALIBRR';

-- AlterEnum
ALTER TYPE "RunStatus" ADD VALUE 'WAITING';

-- CreateTable
CREATE TABLE "browser_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),

    CONSTRAINT "browser_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "browser_tokens_user_id_key" ON "browser_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "browser_tokens_token_hash_key" ON "browser_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "browser_tokens" ADD CONSTRAINT "browser_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
