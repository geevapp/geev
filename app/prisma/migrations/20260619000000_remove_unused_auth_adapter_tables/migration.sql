-- Credentials auth uses JWT sessions only, so the Auth.js adapter session and
-- verification-token tables are unused and should not remain in the schema.
ALTER TABLE IF EXISTS "verification_tokens" DROP CONSTRAINT IF EXISTS "verification_tokens_userId_fkey";

DROP TABLE IF EXISTS "verification_tokens";
DROP TABLE IF EXISTS "VerificationToken";
