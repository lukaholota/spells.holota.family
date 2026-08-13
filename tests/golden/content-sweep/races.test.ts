import path from "node:path";
import { afterAll, beforeEach, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../../user-data";
import { normalizeForGolden, readFullPers } from "../../helpers/normalize-golden";
import { compareOrWriteAggregatedGolden } from "../../helpers/aggregated-golden";
import { minimalForm } from "../../helpers/build-form";
import { Classes, BackgroundCategory } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";

const GOLDEN_PATH = path.join(__dirname, "races.json");

beforeEach(resetUserData);
afterAll(disconnectDatabase);

/**
 * Broad, not deep: every one of the 66 seeded races creates a character without crashing, race
 * mechanically fixed, class/background held constant. Proves no race has a dangling FK, malformed
 * JSON, or otherwise breaks createCharacter — not that every ability/trait nuance is correct
 * (that's the curated KR2.1 matrix's job for representative shapes). One aggregated golden file,
 * not 66, so a diff during O3 is reviewable in one place.
 */
it("усі 66 рас створюють персонажа без падіння", async () => {
  const [cls, background, races] = await Promise.all([
    prisma.class.findFirstOrThrow({ where: { name: Classes.FIGHTER_2014 } }),
    prisma.background.findFirstOrThrow({ where: { name: BackgroundCategory.SOLDIER } }),
    prisma.race.findMany({ orderBy: { raceId: "asc" } }),
  ]);

  const aggregated: Record<string, unknown> = {};

  for (const race of races) {
    const user = await prisma.user.create({
      data: { email: `race-sweep-${race.raceId}@sweep.test`, name: "Sweep" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const form = minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
    const result = await createCharacter(form);

    if ("error" in result) {
      throw new Error(
        `Раса ${race.name} (raceId=${race.raceId}) провалила createCharacter: ${result.error}` +
          ("details" in result ? ` — ${JSON.stringify(result.details)}` : ""),
      );
    }

    const pers = await readFullPers(result.persId);
    aggregated[race.name] = normalizeForGolden(pers);
  }

  compareOrWriteAggregatedGolden(GOLDEN_PATH, aggregated);
}, 180_000);
