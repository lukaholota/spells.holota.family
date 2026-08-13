import path from "node:path";
import { afterAll, beforeEach, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../../user-data";
import { normalizeForGolden, readFullPers } from "../../helpers/normalize-golden";
import { compareOrWriteAggregatedGolden } from "../../helpers/aggregated-golden";
import { minimalForm } from "../../helpers/build-form";
import { flexibleGroupsFromAsi, pickAbilitiesForGroups } from "../../helpers/asi-shapes";
import { Classes, BackgroundCategory } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";

const GOLDEN_PATH = path.join(__dirname, "variants.json");

beforeEach(resetUserData);
afterAll(disconnectDatabase);

it("усі 26 варіантів раси створюють персонажа без падіння (кожен зі своєю расою-батьком)", async () => {
  const [cls, background, variants] = await Promise.all([
    prisma.class.findFirstOrThrow({ where: { name: Classes.FIGHTER_2014 } }),
    prisma.background.findFirstOrThrow({ where: { name: BackgroundCategory.SOLDIER } }),
    prisma.raceVariant.findMany({ orderBy: { raceVariantId: "asc" } }),
  ]);

  const aggregated: Record<string, unknown> = {};

  for (const variant of variants) {
    const user = await prisma.user.create({
      data: { email: `variant-sweep-${variant.raceVariantId}@sweep.test`, name: "Sweep" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    // Fill flexible ASI choices where present so the variant's mechanism actually fires,
    // instead of leaving racialBonusChoiceSchema empty and only proving "doesn't crash".
    const groups = flexibleGroupsFromAsi(variant.overridesRaceASI, "basic");

    const form = minimalForm({
      raceId: variant.raceId,
      raceVariantId: variant.raceVariantId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      racialBonusChoiceSchema: groups.length ? { basicChoices: pickAbilitiesForGroups(groups), tashaChoices: [] } : undefined,
    });
    const result = await createCharacter(form);

    if ("error" in result) {
      throw new Error(
        `Варіант ${variant.name} (raceVariantId=${variant.raceVariantId}) провалив createCharacter: ${result.error}` +
          ("details" in result ? ` — ${JSON.stringify(result.details)}` : ""),
      );
    }

    const pers = await readFullPers(result.persId);
    aggregated[variant.name] = normalizeForGolden(pers);
  }

  compareOrWriteAggregatedGolden(GOLDEN_PATH, aggregated);
}, 90_000);
