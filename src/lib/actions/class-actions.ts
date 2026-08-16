"use server";

import { loadClassSubclasses } from "@/server/db/class-content";

export async function getSubclassesByClassId(classId: number) {
  const normalizedClassId = Number(classId);
  if (!Number.isFinite(normalizedClassId) || normalizedClassId <= 0) return [];

  return loadClassSubclasses(normalizedClassId);
}
