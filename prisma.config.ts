import { defineConfig } from "prisma/config";
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env file!");
}

// shadowDatabaseUrl тут навмисно немає: він потрібен лише `prisma migrate`, якого в проєкті
// немає за Р2. Налаштований — це заряджена рушниця, бо вказує на справжню базу.
export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});
