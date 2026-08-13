import type { PersFormData } from "@/lib/zod/schemas/persCreateSchema";
import type { LevelUpFormData } from "../../helpers/levelup-form";

export interface LevelUpSequence {
  id: string;
  /** Why this sequence is in the matrix — which branch/axis it holds. Required, not decorative. */
  why: string;
  /** Character level to stop at (createCharacter always starts at 1). */
  maxLevel: number;
  startForm(): Promise<PersFormData>;
  /** Extra payload for the levelUpCharacter call that brings the character to `nextLevel`. classId is mandatory, everything else is merged onto minimalLevelUpForm's defaults. */
  buildLevelUpData(nextLevel: number): Promise<{ classId: number } & Partial<LevelUpFormData>>;
}
