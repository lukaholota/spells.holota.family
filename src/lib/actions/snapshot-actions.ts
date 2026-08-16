"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  activatePersSnapshot,
  createPersSnapshot,
  findSnapshotActivationTarget,
  listPersSnapshots,
} from "@/server/db/snapshots";
import { findUserIdByEmail } from "@/server/db/users";

export async function createCharacterSnapshot(persId: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  try {
    const snapshotId = await createPersSnapshot(persId);
    if (snapshotId === null) return { error: "Character not found" };

    return { success: true, snapshotId };
  } catch (error) {
    console.error("Snapshot creation failed:", error);
    return { error: "Failed to create character snapshot" };
  }
}

export async function getSnapshots(persId: number) {
  const session = await auth();
  if (!session?.user?.email) return [];

  return listPersSnapshots(persId);
}

export async function activateSnapshot(snapshotId: number) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  try {
    const snapshot = await findSnapshotActivationTarget(snapshotId);
    if (!snapshot || !snapshot.parentPersId) return { error: "Snapshot not found" };

    const userId = await findUserIdByEmail(session.user.email);
    if (snapshot.userId !== userId) return { error: "Forbidden" };

    await activatePersSnapshot(snapshotId);
    revalidatePath("/char/home");
    return { success: true };
  } catch (error) {
    console.error("Snapshot activation failed:", error);
    return { error: "Failed to activate snapshot" };
  }
}
