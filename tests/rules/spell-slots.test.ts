import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races, SpellcastingType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../user-data";
import { minimalForm } from "../helpers/build-form";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName } from "../helpers/seed-lookup";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";
import { levelUpCharacter } from "@/lib/actions/levelup";
import { longRest } from "@/lib/actions/rest-actions";
import { calculateCasterLevel, type SpellcastingPersLike } from "@/lib/logic/spell-logic";
import { minimalLevelUpForm } from "../helpers/levelup-form";

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

describe("KR2.5 — multiclass proficiencies за PHB 2014", () => {
  // PHB 2014, с. 164 «Multiclassing → Proficiencies»; BUG-006.
  it.fails("Wizard → Fighter отримує скорочений набір володінь", async () => {
    const persId = await createOwnedCharacter(Classes.WIZARD_2014, BackgroundCategory.SAGE);
    const fighter = await classByName(Classes.FIGHTER_2014);
    const [duelingId] = await classChoiceOptionIdsAtLevel(
      fighter.classId,
      1,
      (choice) => choice.optionNameEng === "Dueling",
    );

    const before = await readCustomProficiencies(persId);
    expect(before).not.toContain("Середні обладунки");
    expect(before).not.toContain("Бойова зброя");

    const result = await levelUpCharacter(
      persId,
      minimalLevelUpForm({
        classId: fighter.classId,
        levelUpPath: "MULTICLASS",
        classChoiceSelections: { "Бойовий стиль": duelingId },
      }),
    );
    expect(result).toEqual({ success: true });

    const after = await readCustomProficiencies(persId);
    expect(after).toContain("Середні обладунки");
    expect(after).toContain("Щит");
    expect(after).toContain("Бойова зброя");
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
  return createOwnedCharacter(Classes.FIGHTER_2014, BackgroundCategory.SOLDIER);
}

async function createOwnedCharacter(className: Classes, backgroundName: BackgroundCategory): Promise<number> {
  const user = await prisma.user.upsert({
    where: { email: "rules-tests@holota.family" },
    create: { email: "rules-tests@holota.family", name: "Rules Test User" },
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
  if ("error" in result) throw new Error(`createCharacter повернув ${result.error}`);
  return result.persId;
}

function emptySpellSlots() {
  return Array<number>(9).fill(0);
}

async function readCustomProficiencies(persId: number) {
  const pers = await prisma.pers.findUniqueOrThrow({
    where: { persId },
    select: { customProficiencies: true },
  });
  return pers.customProficiencies;
}
