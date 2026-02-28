"use server";

import { prisma } from "@/lib/prisma";

export async function getSubclassesByClassId(classId: number) {
  const normalizedClassId = Number(classId);
  if (!Number.isFinite(normalizedClassId) || normalizedClassId <= 0) return [];

  return prisma.subclass.findMany({
    where: { classId: normalizedClassId },
    include: {
      features: {
        include: {
          feature: true,
        },
      },
    },
    orderBy: [{ subclassId: "asc" }],
  });
}
