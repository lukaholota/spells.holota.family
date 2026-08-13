import { createCharacter } from "@/lib/actions/character";
import { levelUpCharacter } from "@/lib/actions/levelup";
import { minimalLevelUpForm } from "./levelup-form";
import { normalizeForGolden, readFullPers, type GoldenPers } from "./normalize-golden";
import type { LevelUpSequence } from "../fixtures/levelup-sequences/types";

/** snapshots[i] is the golden state at character level i + 1 (snapshots[0] = level 1, straight from createCharacter). */
export async function runLevelUpSequence(sequence: LevelUpSequence): Promise<GoldenPers[]> {
  const persId = await createStartingCharacter(sequence);
  const snapshots: GoldenPers[] = [await snapshotPers(persId)];

  for (let nextLevel = 2; nextLevel <= sequence.maxLevel; nextLevel++) {
    await levelUpToNextLevel(sequence, persId, nextLevel);
    snapshots.push(await snapshotPers(persId));
  }

  return snapshots;
}

async function createStartingCharacter(sequence: LevelUpSequence): Promise<number> {
  const form = await sequence.startForm();
  const result = await createCharacter(form);
  if ("error" in result) {
    throw new Error(
      `createCharacter провалився для послідовності "${sequence.id}": ${result.error}` +
        ("details" in result ? ` — ${JSON.stringify(result.details)}` : ""),
    );
  }
  return result.persId;
}

async function levelUpToNextLevel(sequence: LevelUpSequence, persId: number, nextLevel: number): Promise<void> {
  const extra = await sequence.buildLevelUpData(nextLevel);
  const data = minimalLevelUpForm(extra);
  const result = await levelUpCharacter(persId, data);
  if (result && "error" in result) {
    throw new Error(
      `levelUpCharacter провалився на рівні ${nextLevel} для послідовності "${sequence.id}": ${result.error}`,
    );
  }
}

async function snapshotPers(persId: number): Promise<GoldenPers> {
  return normalizeForGolden(await readFullPers(persId));
}
