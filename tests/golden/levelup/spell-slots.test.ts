import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { levelUpSequences } from "../../fixtures/levelup-sequences";
import type { GoldenPers } from "../../helpers/normalize-golden";

const GOLDEN_DIR = path.join(__dirname);
const SLOT_GOLDEN_PATH = path.join(GOLDEN_DIR, "spell-slots.json");
const UPDATE_GOLDEN = process.env.UPDATE_GOLDEN === "1";

describe("KR2.3 — читабельний golden-зріз слотів заклинань", () => {
  it("виділяє стандартні й пактові слоти з уже перевірених levelup golden-файлів", () => {
    const progression = Object.fromEntries(
      levelUpSequences
        .map((sequence) => [sequence.id, readSlotProgression(sequence.id)] as const)
        .filter(([, snapshots]) => snapshots.some((snapshot) => snapshot.standard.length > 0 || snapshot.pact > 0)),
    );

    if (UPDATE_GOLDEN || !fs.existsSync(SLOT_GOLDEN_PATH)) {
      fs.writeFileSync(SLOT_GOLDEN_PATH, JSON.stringify(progression, null, 2) + "\n");
      return;
    }

    expect(JSON.parse(fs.readFileSync(SLOT_GOLDEN_PATH, "utf-8"))).toEqual(progression);
  });
});

function readSlotProgression(sequenceId: string) {
  const snapshots = JSON.parse(fs.readFileSync(path.join(GOLDEN_DIR, `${sequenceId}.json`), "utf-8")) as GoldenPers[];
  return snapshots.map((snapshot) => ({
    level: snapshot.level,
    standard: trimTrailingZeroes(snapshot.spellSlots.current),
    pact: snapshot.spellSlots.pact,
  }));
}

function trimTrailingZeroes(slots: number[]) {
  const lastNonZeroIndex = slots.findLastIndex((slot) => slot !== 0);
  return lastNonZeroIndex === -1 ? [] : slots.slice(0, lastNonZeroIndex + 1);
}
