import path from "node:path";
import { afterAll, beforeEach, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../../user-data";
import { normalizeForGolden, readFullPers } from "../../helpers/normalize-golden";
import { compareOrWriteAggregatedGolden } from "../../helpers/aggregated-golden";
import { minimalForm } from "../../helpers/build-form";
import { Classes, Races } from "@prisma/client";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";

const GOLDEN_PATH = path.join(__dirname, "backgrounds.json");

beforeEach(resetUserData);
afterAll(disconnectDatabase);

it("усі 90 походжень створюють персонажа без падіння (без backgroundFeatId — окремо вже покрито REWARDED)", async () => {
  const [cls, race, backgrounds] = await Promise.all([
    prisma.class.findFirstOrThrow({ where: { name: Classes.CLERIC_2014 } }),
    prisma.race.findFirstOrThrow({ where: { name: Races.HUMAN_2014 } }),
    prisma.background.findMany({ orderBy: { backgroundId: "asc" } }),
  ]);

  const aggregated: Record<string, unknown> = {};

  for (const background of backgrounds) {
    const user = await prisma.user.create({
      data: { email: `background-sweep-${background.backgroundId}@sweep.test`, name: "Sweep" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const form = minimalForm({ raceId: race.raceId, classId: cls.classId, backgroundId: background.backgroundId });
    const result = await createCharacter(form);

    if ("error" in result) {
      throw new Error(
        `Походження ${background.name} (backgroundId=${background.backgroundId}) провалило createCharacter: ${result.error}` +
          ("details" in result ? ` — ${JSON.stringify(result.details)}` : ""),
      );
    }

    const pers = await readFullPers(result.persId);
    aggregated[background.name] = normalizeForGolden(pers);
  }

  compareOrWriteAggregatedGolden(GOLDEN_PATH, aggregated);
}, 180_000);
