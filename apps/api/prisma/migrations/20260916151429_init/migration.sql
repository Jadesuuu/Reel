-- CreateEnum
CREATE TYPE "Source" AS ENUM ('HN');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('STALE_APPLICATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "remote_only" BOOLEAN NOT NULL DEFAULT true,
    "role_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "include_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exclude_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_salary_usd" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingest_runs" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "external_thread_id" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "comments_seen" INTEGER NOT NULL DEFAULT 0,
    "postings_created" INTEGER NOT NULL DEFAULT 0,
    "postings_updated" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "ingest_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postings" (
    "id" TEXT NOT NULL,
    "source" "Source" NOT NULL,
    "external_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "location" TEXT,
    "remote" "RemoteType" NOT NULL DEFAULT 'UNKNOWN',
    "salary_text" TEXT,
    "salary_min_usd" INTEGER,
    "salary_max_usd" INTEGER,
    "stack_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "apply_url" TEXT,
    "raw_html" TEXT NOT NULL,
    "raw_text" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "posting_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "posting_id" TEXT,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "url" TEXT,
    "stage" "Stage" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "stage_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_events" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "from_stage" "Stage",
    "to_stage" "Stage" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "kind" "ReminderKind" NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "job_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "criteria_user_id_key" ON "criteria"("user_id");

-- CreateIndex
CREATE INDEX "ingest_runs_started_at_idx" ON "ingest_runs"("started_at");

-- CreateIndex
CREATE INDEX "postings_fingerprint_idx" ON "postings"("fingerprint");

-- CreateIndex
CREATE INDEX "postings_posted_at_idx" ON "postings"("posted_at");

-- CreateIndex
CREATE INDEX "postings_thread_id_idx" ON "postings"("thread_id");

-- CreateIndex
CREATE UNIQUE INDEX "postings_source_external_id_key" ON "postings"("source", "external_id");

-- CreateIndex
CREATE INDEX "matches_user_id_dismissed_score_idx" ON "matches"("user_id", "dismissed", "score");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user_id_posting_id_key" ON "matches"("user_id", "posting_id");

-- CreateIndex
CREATE INDEX "applications_user_id_stage_idx" ON "applications"("user_id", "stage");

-- CreateIndex
CREATE INDEX "stage_events_application_id_created_at_idx" ON "stage_events"("application_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reminders_job_id_key" ON "reminders"("job_id");

-- CreateIndex
CREATE INDEX "reminders_application_id_idx" ON "reminders"("application_id");

-- AddForeignKey
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_posting_id_fkey" FOREIGN KEY ("posting_id") REFERENCES "postings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_events" ADD CONSTRAINT "stage_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
