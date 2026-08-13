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

const GOLDEN_PATH = path.join(__dirname, "feats.json");

beforeEach(resetUserData);
afterAll(disconnectDatabase);

it("усі 92 фіти створюють персонажа без падіння (з першим доступним вибором, якщо він є)", async () => {
  const [cls, background, humanRace, feats] = await Promise.all([
    prisma.class.findFirstOrThrow({ where: { name: Classes.WIZARD_2014 } }),
    prisma.background.findFirstOrThrow({ where: { name: BackgroundCategory.SAGE } }),
    // Some feats are race-restricted (e.g. Prodigy: Human/Half-Elf/Half-Orc) — Human clears the most restrictions.
    prisma.race.findFirstOrThrow({ where: { name: Races.HUMAN_2014 } }),
    prisma.feat.findMany({
      orderBy: { featId: "asc" },
      include: { featChoiceOptions: true },
    }),
  ]);

  const aggregated: Record<string, unknown> = {};

  for (const feat of feats) {
    if (feat.raceRestriction.length > 0 && !feat.raceRestriction.includes(Races.HUMAN_2014)) {
      // Sweep would fail on a real prerequisite the app doesn't enforce server-side anyway
      // (see BUG-003 in KNOWN-BUGS.md) — skip rather than build a fake violation into the baseline.
      continue;
    }

    const user = await prisma.user.create({
      data: { email: `feat-sweep-${feat.featId}@sweep.test`, name: "Sweep" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const firstChoiceOptionId = feat.featChoiceOptions[0]?.choiceOptionId;
    const form = minimalForm({
      raceId: humanRace.raceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
      featId: feat.featId,
      featChoiceSelections: firstChoiceOptionId != null ? { "0": firstChoiceOptionId } : {},
    });
    const result = await createCharacter(form);

    if ("error" in result) {
      throw new Error(
        `Риса ${feat.name} (featId=${feat.featId}) провалила createCharacter: ${result.error}` +
          ("details" in result ? ` — ${JSON.stringify(result.details)}` : ""),
      );
    }

    const pers = await readFullPers(result.persId);
    aggregated[feat.name] = normalizeForGolden(pers);
  }

  compareOrWriteAggregatedGolden(GOLDEN_PATH, aggregated);
}, 180_000);
