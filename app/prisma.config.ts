import 'dotenv/config'

import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx app/database/seed.ts',
    },
    datasource: {
        url: env("DATABASE_URL")
    }
});