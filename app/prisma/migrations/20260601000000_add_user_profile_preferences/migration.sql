ALTER TABLE "users"
ADD COLUMN "profile_visibility" VARCHAR(20) NOT NULL DEFAULT 'public',
ADD COLUMN "show_email" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "show_wallet_address" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "email_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "push_notifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "marketing_notifications" BOOLEAN NOT NULL DEFAULT false;
