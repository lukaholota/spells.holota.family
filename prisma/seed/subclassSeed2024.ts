/**
 * KR6.3 Крок 3 — 2024 Subclasses seed
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type SubclassFeature2024 = {
  level: number;
  name: string;
  description?: string;
};

type SubclassJson2024 = {
  ruleset: string;
  className: string;
  engName: string;
  name: string;
  taglineEng?: string;
  flavorTextEng?: string;
  tagline?: string;
  flavorText?: string;
  features?: SubclassFeature2024[];
  source: string;
};

function toSubclassEnum(engName: string): string {
  return engName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const seedSubclasses2024 = async (prisma: PrismaClient) => {
  const raw = readFileSync(
    join(process.cwd(), "data/2024/normalized/subclasses.json"),
    "utf-8"
  );
  const subclasses: SubclassJson2024[] = JSON.parse(raw);

  console.log(`✨ Seeding ${subclasses.length} 2024 subclasses…`);
  let upserted = 0;
  let errors = 0;

  for (const sc of subclasses) {
    const classEnum = `${sc.className.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_2024`;
    const classRecord = await (prisma.class as any).findFirst({
      where: { name: classEnum, ruleset: "RULES_2024" },
      select: { classId: true },
    });

    if (!classRecord) {
      console.error(`  ❌ Parent class not found for ${sc.engName}: ${classEnum}`);
      errors++;
      continue;
    }

    const scEnum = toSubclassEnum(sc.engName);
    const description = sc.flavorText || sc.flavorTextEng || sc.name;

    const payload = {
      classId: classRecord.classId,
      name: scEnum as any,
      ruleset: "RULES_2024" as const,
      description,
      grantsSpells: false,
      languagesToChooseCount: 0,
      toolProficiencies: [],
      armorProficiencies: [],
    };

    try {
      await (prisma.subclass as any).upsert({
        where: {
          classId_name: {
            classId: classRecord.classId,
            name: scEnum as any,
          },
        },
        update: payload,
        create: payload,
      });
      upserted++;
    } catch (err: unknown) {
      errors++;
      const e = err as { code?: string; message?: string };
      console.error(
        `  ❌ ${sc.engName} (${scEnum}): ${e?.code ?? "?"} — ${e?.message ?? err}`
      );
    }
  }

  console.log(`✅ 2024 Subclasses: ${upserted} upserted, ${errors} errors`);
};
