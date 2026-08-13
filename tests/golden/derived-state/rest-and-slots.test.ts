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
import { longRest, shortRest } from "@/lib/actions/rest-actions";
import { restorePactSlot, restoreSpellSlot } from "@/lib/actions/spell-slots";

const GOLDEN_PATH = path.join(__dirname, "rest-and-slots.json");
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "1";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("KR2.4 — golden для слотів і відпочинку", () => {
  it("фіксує відновлення стандартних і пактових слотів, включно з short/long rest", async () => {
    const wizardId = await createOwnedCharacter("wizard-slots", Classes.WIZARD_2014, BackgroundCategory.SAGE);
    const warlockId = await createOwnedCharacter("warlock-pact", Classes.WARLOCK_2014, BackgroundCategory.SAGE);
    const fighterId = await createOwnedCharacter("fighter-long-rest-BUG", Classes.FIGHTER_2014, BackgroundCategory.SOLDIER);

    await prisma.pers.update({
      where: { persId: wizardId },
      data: { currentSpellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    });
    await prisma.pers.update({
      where: { persId: warlockId },
      data: { currentPactSlots: 0 },
    });
    await prisma.pers.update({
      where: { persId: fighterId },
      data: { level: 2, currentSpellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
    });

    await restoreSpellSlot(wizardId, 1);
    const wizardAfterFirstRestore = await readSlotState(wizardId);
    await restoreSpellSlot(wizardId, 1);
    const wizardAfterSecondRestore = await readSlotState(wizardId);

    await restorePactSlot(warlockId);
    const warlockAfterPactRestore = await readSlotState(warlockId);
    await shortRest(warlockId, []);
    const warlockAfterShortRest = await readSlotState(warlockId);

    await longRest(fighterId);
    const fighterAfterLongRest = await readSlotState(fighterId);

    const actual = {
      wizard: { afterFirstRestore: wizardAfterFirstRestore, afterSecondRestore: wizardAfterSecondRestore },
      warlock: { afterPactRestore: warlockAfterPactRestore, afterShortRest: warlockAfterShortRest },
      fighter: {
        afterLongRest: fighterAfterLongRest,
        KNOWN_BUG: "BUG-010",
      },
    };

    if (UPDATE_GOLDEN) {
      fs.mkdirSync(path.dirname(GOLDEN_PATH), { recursive: true });
      fs.writeFileSync(GOLDEN_PATH, JSON.stringify(actual, null, 2) + "\n");
      return;
    }

    if (!fs.existsSync(GOLDEN_PATH)) {
      throw new Error("Golden відсутній. Згенеруйте його через UPDATE_GOLDEN=1.");
    }

    expect(actual).toEqual(JSON.parse(fs.readFileSync(GOLDEN_PATH, "utf-8")));
  }, 30_000);
});

async function createOwnedCharacter(id: string, className: Classes, backgroundName: BackgroundCategory): Promise<number> {
  const user = await prisma.user.upsert({
    where: { email: "derived-state@golden.test" },
    create: { email: "derived-state@golden.test", name: "Golden Test User" },
    update: {},
  });
  vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

  const [race, characterClass, background] = await Promise.all([
    raceByName(Races.HUMAN_2014),
    classByName(className),
    backgroundByName(backgroundName),
  ]);
  const result = await createCharacter(
    minimalForm({ raceId: race.raceId, classId: characterClass.classId, backgroundId: background.backgroundId }),
  );
  if ("error" in result) throw new Error(`${id}: createCharacter повернув ${result.error}`);
  return result.persId;
}

async function readSlotState(persId: number) {
  return prisma.pers.findUniqueOrThrow({
    where: { persId },
    select: {
      level: true,
      currentSpellSlots: true,
      currentPactSlots: true,
      currentHitDice: true,
      currentHp: true,
      tempHp: true,
      deathSaveSuccesses: true,
      deathSaveFailures: true,
      isDead: true,
    },
  });
}
