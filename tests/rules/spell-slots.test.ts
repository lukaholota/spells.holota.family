import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races, SpellcastingType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../user-data";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, raceByName } from "../helpers/seed-lookup";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";
import { longRest } from "@/lib/actions/rest-actions";
import { calculateCasterLevel, type SpellcastingPersLike } from "@/lib/logic/spell-logic";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("KR2.5 — spell slots за PHB 2014", () => {
  // PHB 2014, с. 164 «Multiclassing → Spell Slots».
  it("повний кастер додає всі рівні класу", () => {
    expect(casterLevelFor({ level: 20, spellcastingType: SpellcastingType.FULL })).toBe(20);
  });

  // PHB 2014, с. 164 «Multiclassing → Spell Slots».
  it("половинний і третинний кастери округлюються вниз до сумування", () => {
    const pers = {
      level: 14,
      class: { name: Classes.PALADIN_2014, spellcastingType: SpellcastingType.HALF },
      subclass: null,
      multiclasses: [
        {
          classLevel: 6,
          class: { name: Classes.FIGHTER_2014, spellcastingType: SpellcastingType.NONE },
          subclass: { spellcastingType: SpellcastingType.THIRD },
        },
        {
          classLevel: 3,
          class: { name: Classes.WIZARD_2014, spellcastingType: SpellcastingType.FULL },
          subclass: null,
        },
      ],
    } satisfies SpellcastingPersLike;

    expect(calculateCasterLevel(pers).casterLevel).toBe(7);
  });

  // PHB 2014, с. 164-165 «Multiclassing → Spell Slots»; BUG-010.
  it.fails("некастер не відновлює стандартні слоти після long rest", async () => {
    const persId = await createOwnedFighter();
    await prisma.pers.update({
      where: { persId },
      data: { level: 2, currentSpellSlots: emptySpellSlots() },
    });

    await longRest(persId);

    const pers = await prisma.pers.findUniqueOrThrow({
      where: { persId },
      select: { currentSpellSlots: true },
    });
    expect(pers.currentSpellSlots).toEqual(emptySpellSlots());
  });
});

function casterLevelFor({ level, spellcastingType }: { level: number; spellcastingType: SpellcastingType }) {
  return calculateCasterLevel({
    level,
    class: { name: Classes.WIZARD_2014, spellcastingType },
    subclass: null,
    multiclasses: [],
  }).casterLevel;
}

async function createOwnedFighter(): Promise<number> {
  const user = await prisma.user.upsert({
    where: { email: "rules-tests@holota.family" },
    create: { email: "rules-tests@holota.family", name: "Rules Test User" },
    update: {},
  });
  vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

  const [race, characterClass, background] = await Promise.all([
    raceByName(Races.HUMAN_2014),
    classByName(Classes.FIGHTER_2014),
    backgroundByName(BackgroundCategory.SOLDIER),
  ]);
  const result = await createCharacter(
    minimalForm({ raceId: race.raceId, classId: characterClass.classId, backgroundId: background.backgroundId }),
  );
  if ("error" in result) throw new Error(`createCharacter повернув ${result.error}`);
  return result.persId;
}

function emptySpellSlots() {
  return Array<number>(9).fill(0);
}
