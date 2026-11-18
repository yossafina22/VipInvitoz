-- Formalize columns previously pushed to shared Neon via `prisma db:push`
-- (see commit 9374631 "MVP port"). Uses IF NOT EXISTS so `migrate deploy`
-- is idempotent against the live DB where these columns already exist, while
-- still provisioning them on a fresh clone / fresh database.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
