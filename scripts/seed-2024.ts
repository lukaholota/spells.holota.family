/**
 * KR6.3 Step 3 — Master 2024 Seed Script
 *
 * Runs all 2024 seeders against the configured database in dependency order:
 * 1. Feats 2024 (75)
 * 2. Backgrounds 2024 (16 new)
 * 3. Update 15 existing *_2024 backgrounds in-place (background_id preserved)
 * 4. Species / Races 2024 (10)
 * 5. Classes 2024 (13)
 * 6. Subclasses 2024 (48)
 * 7. Weapons 2024 (38)
 * 8. Spells 2024 (391)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { seedFeats2024 } from "../prisma/seed/featSeed2024";
import { seedBackgrounds2024 } from "../prisma/seed/backgroundSeed2024";
import { update15ExistingBackgrounds2024 } from "../prisma/seed/update15ExistingBackgrounds2024";
import { seedRaces2024 } from "../prisma/seed/raceSeed2024";
import { seedClasses2024 } from "../prisma/seed/classSeed2024";
import { seedSubclasses2024 } from "../prisma/seed/subclassSeed2024";
import { seedWeapons2024 } from "../prisma/seed/weaponSeed2024";
import { seedSpells2024 } from "../prisma/seed/spellSeed2024";

import * as dotenv from "dotenv";
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://char_app:IbuhoOUvoCL4AghzpULV0OrVjRtYzv1bSW7xWveb@127.0.0.1:5454/spells_test?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const dbName = new URL(connectionString).pathname.replace(/^\//, "");
  console.log(`🚀 Starting KR6.3 2024 Content Seeding for database "${dbName}"…\n`);

  const startTime = Date.now();

  await seedFeats2024(prisma);
  await seedBackgrounds2024(prisma);
  await update15ExistingBackgrounds2024(prisma);
  await seedRaces2024(prisma);
  await seedClasses2024(prisma);
  await seedSubclasses2024(prisma);
  await seedWeapons2024(prisma);
  await seedSpells2024(prisma);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 All 2024 content seeded successfully in ${durationSec}s!`);
}

main()
  .catch((e) => {
    console.error("FATAL Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
