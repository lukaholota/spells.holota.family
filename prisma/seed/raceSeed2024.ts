/**
 * KR6.3 Крок 3 — 2024 Species/Races seed
 */

import { PrismaClient, Source, Size } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Trait2024 = {
  engName: string;
  name: string;
  descriptionEng: string;
};

type Species2024 = {
  ruleset: string;
  engName: string;
  name: string;
  shortDescription: string;
  description: string;
  creatureType: string;
  size: string[];
  speed: number;
  ASI: Record<string, unknown>;
  traits: Trait2024[];
  source: string;
};

function speciesNameToEnum(engName: string): string {
  return `${engName.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_2024`;
}

export const seedRaces2024 = async (prisma: PrismaClient) => {
  const raw = readFileSync(
    join(process.cwd(), "data/2024/normalized/species.json"),
    "utf-8"
  );
  const species: Species2024[] = JSON.parse(raw);

  console.log(`🐾 Seeding ${species.length} 2024 species…`);
  let upserted = 0;
  let errors = 0;

  for (const sp of species) {
    const nameEnum = speciesNameToEnum(sp.engName);

    const payload = {
      name: nameEnum as any,
      ruleset: "RULES_2024" as const,
      source: Source.PHB_2024,
      size: sp.size as Size[],
      speed: sp.speed,
      ASI: {},
      languagesToChooseCount: 0,
    };

    try {
      await (prisma.race as any).upsert({
        where: { name_ruleset: { name: nameEnum, ruleset: "RULES_2024" } },
        update: payload,
        create: payload,
      });
      upserted++;
    } catch (err: unknown) {
      errors++;
      const e = err as { code?: string; message?: string };
      console.error(
        `  ❌ ${sp.engName} (${nameEnum}): ${e?.code ?? "?"} — ${e?.message ?? err}`
      );
    }
  }

  console.log(`✅ 2024 Species/Races: ${upserted} upserted, ${errors} errors`);
};
