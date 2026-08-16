import { prisma } from "@/lib/prisma";

export type PersPrimaryClass = {
  classId: number;
  level: number;
  className: string;
};

export async function findPersPrimaryClass(persId: number): Promise<PersPrimaryClass | null> {
  const pers = await prisma.pers.findUnique({
    where: { persId },
    select: { classId: true, level: true, class: { select: { name: true } } },
  });

  return pers ? { classId: pers.classId, level: pers.level, className: pers.class.name } : null;
}
