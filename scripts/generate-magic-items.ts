/**
 * Generate static magicItems.json from Prisma database
 * Run: npx tsx scripts/generate-magic-items.ts
 */

import { PrismaClient, Ruleset } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const OUTPUT_PATH = join(process.cwd(), 'src/lib/generated/magicItems.json');

// KR6.3: hardcoded until the edition switch (O6 Крок 5) lets pers.ruleset drive this.
export const ACTIVE_RULESET: Ruleset = "RULES_2014";

export function buildMagicItemsForGenerationQuery() {
  return {
    where: { ruleset: ACTIVE_RULESET },
    orderBy: [{ name: 'asc' as const }],
    // Select all fields we need for the UI and search
    select: {
      magicItemId: true,
      name: true,
      itemType: true,
      rarity: true,
      requiresAttunement: true,
      engName: true,
      description: true,
      shortDescription: true,
      weaponProficiencies: true,
      weaponProficienciesSpecial: true,
      bonusToAC: true,
      bonusToRangedDamage: true,
      bonusToSavingThrows: true,
      noArmorOrShieldForACBonus: true,
      givesSpells: {
        select: {
          spellId: true,
          name: true,
          engName: true,
          level: true,
        },
      },
    },
  };
}

async function main() {
  console.log('🔮 Generating magicItems.json from database...');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const magicItems = await prisma.magicItem.findMany(buildMagicItemsForGenerationQuery());

    // Transform to stable format if needed, but mostly direct dump
    const data = magicItems.map((item) => ({
      ...item,
      // Ensure JSON fields are handled correctly if they are null
      weaponProficiencies: item.weaponProficiencies ?? undefined,
      weaponProficienciesSpecial: item.weaponProficienciesSpecial ?? undefined,
      bonusToSavingThrows: item.bonusToSavingThrows ?? undefined,
    }));

    // Ensure directory exists
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });

    // Write JSON file
    writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');

    console.log(`✅ Generated ${data.length} magic items to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('❌ Failed to generate magic items:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

