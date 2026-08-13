import path from "node:path";
import { afterAll, beforeEach, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../../user-data";
import { normalizeForGolden, readFullPers } from "../../helpers/normalize-golden";
import { compareOrWriteAggregatedGolden } from "../../helpers/aggregated-golden";
import { minimalForm } from "../../helpers/build-form";
import { Classes, BackgroundCategory, Races } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";

const GOLDEN_PATH = path.join(__dirname, "dragonborn-ancestry.json");

beforeEach(resetUserData);
afterAll(disconnectDatabase);

/**
 * Spotlight case, not a generic sweep: Dragonborn has exactly one fixed trait (Draconic
 * Resistance) plus a 10-option "Родовід дракона" (Draconic Ancestry) RaceChoiceOption group —
 * each color should connect to its OWN breath-weapon/resistance feature via
 * RaceChoiceOptionTrait, not the same one for all ten. This is exactly the "100500 different
 * dragonborn, do they all actually differ" concern — proves each of the 10 picks produces a
 * DIFFERENT feature set, not a copy-pasted one.
 */
it("усі 10 родоводів дракона дають РІЗНИЙ набір фіч (не однаковий для всіх)", async () => {
  const [cls, background, race] = await Promise.all([
    prisma.class.findFirstOrThrow({ where: { name: Classes.FIGHTER_2014 } }),
    prisma.background.findFirstOrThrow({ where: { name: BackgroundCategory.SOLDIER } }),
    prisma.race.findFirstOrThrow({ where: { name: Races.DRAGONBORN_2014 } }),
  ]);
  const ancestries = await prisma.raceChoiceOption.findMany({
    where: { raceId: race.raceId, choiceGroupName: "Родовід дракона" },
    orderBy: { optionId: "asc" },
  });

  if (ancestries.length !== 10) {
    throw new Error(`Очікував 10 родоводів дракона, знайшов ${ancestries.length} — сіди змінились, оновити тест.`);
  }

  const aggregated: Record<string, unknown> = {};

  for (const ancestry of ancestries) {
    const user = await prisma.user.create({
      data: { email: `dragonborn-sweep-${ancestry.optionId}@sweep.test`, name: "Sweep" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const form = minimalForm({
      raceId: race.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      raceChoiceSelections: { "0": ancestry.optionId },
    });
    const result = await createCharacter(form);

    if ("error" in result) {
      throw new Error(
        `Родовід ${ancestry.optionName} (optionId=${ancestry.optionId}) провалив createCharacter: ${result.error}` +
          ("details" in result ? ` — ${JSON.stringify(result.details)}` : ""),
      );
    }

    const pers = await readFullPers(result.persId);
    aggregated[ancestry.optionName] = normalizeForGolden(pers);
  }

  const featureSets = Object.entries(aggregated).map(([name, data]) => [name, JSON.stringify((data as any).features)]);
  const distinctFeatureSets = new Set(featureSets.map(([, features]) => features));
  if (distinctFeatureSets.size !== 10) {
    const grouped = featureSets.reduce<Record<string, string[]>>((acc, [name, features]) => {
      (acc[features] ??= []).push(name);
      return acc;
    }, {});
    const duplicates = Object.values(grouped).filter((names) => names.length > 1);
    throw new Error(
      `Очікував 10 РІЗНИХ наборів фіч (по одному на родовід), отримав лише ${distinctFeatureSets.size} унікальних.\n` +
        `Родоводи з однаковим набором фіч: ${JSON.stringify(duplicates)}`,
    );
  }

  compareOrWriteAggregatedGolden(GOLDEN_PATH, aggregated);
}, 30_000);
