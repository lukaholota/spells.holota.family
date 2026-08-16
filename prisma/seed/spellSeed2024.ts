/**
 * KR6.3 Крок 3 — 2024 Spells seed (391 PHB 2024 spells, batched)
 */

import { PrismaClient, Source } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type SpellJson2024 = {
  engName: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  hasRitual: string;
  hasConcentration: string;
  classes: string[];
  description: string;
  ruleset: string;
  source: string;
};

export const seedSpells2024 = async (prisma: PrismaClient) => {
  const raw = readFileSync(
    join(process.cwd(), "data/2024/normalized/spells.json"),
    "utf-8"
  );
  const spells: SpellJson2024[] = JSON.parse(raw);

  console.log(`🔮 Seeding ${spells.length} 2024 spells in parallel chunks…`);
  let upserted = 0;
  let errors = 0;

  const CHUNK_SIZE = 25;
  for (let i = 0; i < spells.length; i += CHUNK_SIZE) {
    const chunk = spells.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async (sp) => {
        const payload = {
          name: sp.name,
          engName: sp.engName,
          level: sp.level,
          school: sp.school,
          castingTime: sp.castingTime,
          range: sp.range,
          components: sp.components,
          duration: sp.duration,
          hasRitual: sp.hasRitual,
          hasConcentration: sp.hasConcentration,
          description: sp.description,
          ruleset: "RULES_2024" as const,
          source: Source.PHB_2024,
        };

        try {
          const savedSpell = await (prisma.spell as any).upsert({
            where: {
              engName_ruleset: {
                engName: sp.engName,
                ruleset: "RULES_2024",
              },
            },
            update: payload,
            create: payload,
          });

          if (sp.classes && sp.classes.length > 0) {
            await (prisma.spellClasses as any).deleteMany({
              where: { spellId: savedSpell.spellId },
            });

            await (prisma.spellClasses as any).createMany({
              data: sp.classes.map((clsName) => ({
                spellId: savedSpell.spellId,
                className: clsName,
                ruleset: "RULES_2024",
              })),
            });
          }

          upserted++;
        } catch (err: unknown) {
          errors++;
          const e = err as { code?: string; message?: string };
          console.error(
            `  ❌ ${sp.engName}: ${e?.code ?? "?"} — ${e?.message ?? err}`
          );
        }
      })
    );
  }

  console.log(`✅ 2024 Spells: ${upserted} upserted, ${errors} errors`);
};
