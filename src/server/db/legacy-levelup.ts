import { prisma } from "@/lib/prisma";

export async function findPersLevel(persId: number): Promise<number | null> {
  const pers = await prisma.pers.findUnique({ where: { persId }, select: { level: true } });
  return pers?.level ?? null;
}

export async function updatePersSubclass(persId: number, subclassId: number): Promise<void> {
  await prisma.pers.update({ where: { persId }, data: { subclassId } });
}

export async function updatePersLevel(persId: number, level: number): Promise<void> {
  await prisma.pers.update({ where: { persId }, data: { level } });
}
