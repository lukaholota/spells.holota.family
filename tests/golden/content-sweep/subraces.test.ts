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

const GOLDEN_PATH = path.join(__dirname, "subraces.json");

beforeEach(resetUserData);
afterAll(disconnectDatabase);

it("усі 17 підрас створюють персонажа без падіння (кожна зі своєю расою-батьком)", async () => {
  const [cls, background, subraces] = await Promise.all([
    prisma.class.findFirstOrThrow({ where: { name: Classes.WIZARD_2014 } }),
    prisma.background.findFirstOrThrow({ where: { name: BackgroundCategory.SAGE } }),
    prisma.subrace.findMany({ orderBy: { subraceId: "asc" } }),
  ]);

  const aggregated: Record<string, unknown> = {};

  for (const subrace of subraces) {
    const user = await prisma.user.create({
      data: { email: `subrace-sweep-${subrace.subraceId}@sweep.test`, name: "Sweep" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const form = minimalForm({
      raceId: subrace.raceId,
      subraceId: subrace.subraceId,
      classId: cls.classId,
      backgroundId: background.backgroundId,
    });
    const result = await createCharacter(form);

    if ("error" in result) {
      throw new Error(
        `Підраса ${subrace.name} (subraceId=${subrace.subraceId}) провалила createCharacter: ${result.error}` +
          ("details" in result ? ` — ${JSON.stringify(result.details)}` : ""),
      );
    }

    const pers = await readFullPers(result.persId);
    aggregated[subrace.name] = normalizeForGolden(pers);
  }

  compareOrWriteAggregatedGolden(GOLDEN_PATH, aggregated);
}, 60_000);
