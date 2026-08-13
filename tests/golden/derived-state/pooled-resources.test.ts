import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../../user-data";
import { minimalForm } from "../../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../../helpers/seed-lookup";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";
import { spendFeatureUse, restoreFeatureUse } from "@/lib/actions/feature-uses";
import { longRest, shortRest } from "@/lib/actions/rest-actions";

const GOLDEN_PATH = path.join(__dirname, "pooled-resources.json");
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "1";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("KR2.4 — golden для pooled feature resources", () => {
  it("фіксує KI на short rest та Sorcery Points на long rest", async () => {
    const [quickenedHealing, quickenedSpell] = await Promise.all([
      prisma.feature.findUniqueOrThrow({ where: { engName: "Quickened Healing" } }),
      prisma.feature.findUniqueOrThrow({ where: { engName: "Quickened Spell" } }),
    ]);

    const monk = await exercisePool(
      await createOwnedCharacter("monk", Classes.MONK_2014, 4),
      quickenedHealing.featureId,
      "KI",
      "short",
    );
    const sorcerer = await exercisePool(
      await createOwnedCharacter("sorcerer", Classes.SORCERER_2014, 3),
      quickenedSpell.featureId,
      "SORCERY_POINTS",
      "long",
    );
    const actual = {
      monk,
      sorcerer: {
        ...sorcerer,
        expectedPoolMaximum: 3,
        KNOWN_BUG: "BUG-011",
      },
    };

    if (UPDATE_GOLDEN) {
      fs.writeFileSync(GOLDEN_PATH, JSON.stringify(actual, null, 2) + "\n");
      return;
    }

    expect(actual).toEqual(JSON.parse(fs.readFileSync(GOLDEN_PATH, "utf-8")));
  }, 30_000);
});

async function createOwnedCharacter(emailPrefix: string, className: Classes, level: number): Promise<number> {
  const user = await prisma.user.create({
    data: { email: `${emailPrefix}-pooled-resources@golden.test`, name: "Golden Test User" },
  });
  vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

  const [race, characterClass, background] = await Promise.all([
    raceByName(Races.HUMAN_2014),
    classByName(className),
    backgroundByName(BackgroundCategory.SAGE),
  ]);
  const result = await createCharacter(
    minimalForm({ raceId: race.raceId, classId: characterClass.classId, backgroundId: background.backgroundId }),
  );
  if ("error" in result) throw new Error(`${emailPrefix}: createCharacter повернув ${result.error}`);

  await prisma.pers.update({ where: { persId: result.persId }, data: { level } });
  return result.persId;
}

async function exercisePool(
  persId: number,
  featureId: number,
  poolKey: string,
  rest: "short" | "long",
) {
  const spent = await spendFeatureUse({ persId, featureId });
  const afterSpend = await readPool(persId, poolKey);
  const restored = await restoreFeatureUse({ persId, featureId });
  const afterManualRestore = await readPool(persId, poolKey);

  await spendFeatureUse({ persId, featureId });
  const restResult = rest === "short" ? await shortRest(persId, []) : await longRest(persId);

  return {
    feature: await prisma.feature.findUniqueOrThrow({ where: { featureId }, select: { engName: true, usePrice: true } }),
    spent,
    afterSpend,
    restored,
    afterManualRestore,
    restResult,
    afterRest: await readPool(persId, poolKey),
  };
}

function readPool(persId: number, poolKey: string) {
  return prisma.persResourcePool.findUniqueOrThrow({
    where: { persId_poolKey: { persId, poolKey } },
    select: { poolKey: true, usesRemaining: true },
  });
}
