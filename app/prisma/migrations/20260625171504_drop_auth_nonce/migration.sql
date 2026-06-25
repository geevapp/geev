-- DropIndex
DROP INDEX IF EXISTS "auth_nonces_expires_at_idx";

-- DropIndex
DROP INDEX IF EXISTS "auth_nonces_nonce_idx";

-- DropIndex
DROP INDEX IF EXISTS "auth_nonces_nonce_key";

-- DropTable
DROP TABLE IF EXISTS "auth_nonces";
