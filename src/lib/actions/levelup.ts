"use server";

import { auth } from "@/lib/auth";
import { parseLevelUpInput } from "@/lib/zod/schemas/levelUpSchema";
import { executeLevelUp, getLevelUpInfo as getPersistedLevelUpInfo } from "@/server/db/levelup-persistence";

export async function getLevelUpInfo(persId: number) {
  return getPersistedLevelUpInfo(persId);
}

export async function levelUpCharacter(persId: number, input: unknown) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  return executeLevelUp(persId, parseLevelUpInput(input));
}
