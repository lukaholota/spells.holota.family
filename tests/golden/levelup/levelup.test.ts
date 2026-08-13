import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BackgroundCategory, Classes, Races } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { disconnectDatabase, resetUserData } from "../../user-data";
import { levelUpSequences } from "../../fixtures/levelup-sequences";
import { runLevelUpSequence } from "../../helpers/run-levelup-sequence";
import { normalizeForGolden, readFullPers, type GoldenPers } from "../../helpers/normalize-golden";
import { minimalForm } from "../../helpers/build-form";
import { minimalLevelUpForm } from "../../helpers/levelup-form";
import { backgroundByName, classByName, classChoiceOptionIdsAtLevel, raceByName } from "../../helpers/seed-lookup";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), unstable_cache: (fn: any) => fn }));

import { auth } from "@/lib/auth";
import { createCharacter } from "@/lib/actions/character";
import { levelUpCharacter } from "@/lib/actions/levelup";

const GOLDEN_DIR = path.join(__dirname);
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "1";

beforeEach(resetUserData);
afterAll(disconnectDatabase);

describe("KR2.3 — golden-тести levelUpCharacter (масив знімків по рівнях 1..N)", () => {
  for (const sequence of levelUpSequences) {
    it(`${sequence.id}: ${sequence.why}`, async () => {
      const user = await prisma.user.create({
        data: { email: `${sequence.id}@golden.test`, name: "Golden Test User" },
      });
      vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

      const snapshots = await runLevelUpSequence(sequence);

      const goldenPath = path.join(GOLDEN_DIR, `${sequence.id}.json`);
      if (UPDATE_GOLDEN || !fs.existsSync(goldenPath)) {
        fs.writeFileSync(goldenPath, JSON.stringify(snapshots, null, 2) + "\n");
        return;
      }

      const golden = JSON.parse(fs.readFileSync(goldenPath, "utf-8")) as GoldenPers[];
      compareLevelByLevel(sequence.id, snapshots, golden);
    }, 180_000);
  }
});

/** Compares golden snapshots one level at a time and fails on the first mismatch, so a
 * divergence at level 3 reports level 3 — not a 20-file diff dump. */
function compareLevelByLevel(sequenceId: string, actual: GoldenPers[], golden: GoldenPers[]) {
  if (actual.length !== golden.length) {
    throw new Error(
      `${sequenceId}: кількість знімків розійшлася — golden має ${golden.length} (рівні 1..${golden.length}), отримали ${actual.length}.`,
    );
  }
  for (let i = 0; i < golden.length; i++) {
    const level = i + 1;
    try {
      expect(actual[i]).toEqual(golden[i]);
    } catch (err) {
      throw new Error(`${sequenceId}: розійшлося на рівні ${level}.\n${(err as Error).message}`);
    }
  }
}

describe("KR2.3 — Class.multiclassReqs перевіряється лише клієнтом", () => {
  it("Fighter STR15/CHA8 → MULTICLASS у Paladin (вимагає STR13 І CHA13) сервер приймає без перевірки", async () => {
    const user = await prisma.user.create({
      data: { email: "multiclass-reqs@golden.test", name: "Golden Test User" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const [race, fighterClass, paladinClass, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.FIGHTER_2014),
      classByName(Classes.PALADIN_2014),
      backgroundByName(BackgroundCategory.SOLDIER),
    ]);

    const created = await createCharacter(
      minimalForm({ raceId: race.raceId, classId: fighterClass.classId, backgroundId: background.backgroundId }),
    );
    if ("error" in created) throw new Error(created.error);

    const startingPers = await readFullPers(created.persId);
    expect(startingPers.cha).toBeLessThan(13);

    const result = await levelUpCharacter(
      created.persId,
      minimalLevelUpForm({ classId: paladinClass.classId, levelUpPath: "MULTICLASS" }),
    );

    expect(result).toEqual({ success: true });

    const afterMulticlass = normalizeForGolden(await readFullPers(created.persId));
    expect(afterMulticlass.multiclasses).toEqual([{ class: "PALADIN_2014", subclass: null, classLevel: 1 }]);
  });
});

describe("KR2.3 — Class.armorProficiencies/weaponProficiencies не читаються при мультикласі", () => {
  it("Wizard (без обладунків/бойової зброї) → MULTICLASS у Fighter (PHB 164: мало б дати легкі/середні обладунки, щит, просту й бойову зброю) не додає жодного рядка", async () => {
    const user = await prisma.user.create({
      data: { email: "multiclass-proficiencies@golden.test", name: "Golden Test User" },
    });
    vi.mocked(auth).mockResolvedValue({ user: { email: user.email } } as never);

    const [race, wizardClass, fighterClass, background] = await Promise.all([
      raceByName(Races.HUMAN_2014),
      classByName(Classes.WIZARD_2014),
      classByName(Classes.FIGHTER_2014),
      backgroundByName(BackgroundCategory.SAGE),
    ]);

    const created = await createCharacter(
      minimalForm({ raceId: race.raceId, classId: wizardClass.classId, backgroundId: background.backgroundId }),
    );
    if ("error" in created) throw new Error(created.error);

    const before = await readFullPers(created.persId);

    const [duelingId] = await classChoiceOptionIdsAtLevel(
      fighterClass.classId,
      1,
      (co) => co.optionNameEng === "Dueling",
    );

    const result = await levelUpCharacter(
      created.persId,
      minimalLevelUpForm({
        classId: fighterClass.classId,
        levelUpPath: "MULTICLASS",
        classChoiceSelections: { "Бойовий стиль": duelingId },
      }),
    );
    expect(result).toEqual({ success: true });

    const after = await readFullPers(created.persId);
    expect(after.customProficiencies).toEqual(before.customProficiencies);
  });
});
