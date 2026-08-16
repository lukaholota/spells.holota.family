import { prisma } from "@/lib/prisma";
import type { Ruleset } from "@prisma/client";

// KR6.3: hardcoded until the edition switch (O6 Крок 5) lets pers.ruleset drive this.
const ACTIVE_RULESET: Ruleset = "RULES_2014";

export type PersLevelUpTarget = {
  classId: number;
  level: number;
  class: { name: string };
};

export type ProgressionFeature = {
  mechanicType: string;
  mechanicMetadata: unknown;
};

export type ProgressionSubclass = {
  id: number;
  name: string;
  description: string | null;
};

export type FightingStyleOption = {
  id: number;
  name: string;
  description: string;
};

export async function findPersLevelUpTarget(persId: number): Promise<PersLevelUpTarget | null> {
  return prisma.pers.findUnique({
    where: { persId },
    select: {
      classId: true,
      level: true,
      class: { select: { name: true } },
    },
  });
}

export async function loadProgressionFeatures(classId: number, levelGranted: number): Promise<ProgressionFeature[]> {
  return prisma.classFeature.findMany({
    where: { classId, levelGranted },
    select: { mechanicType: true, mechanicMetadata: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function loadProgressionSubclasses(classId: number): Promise<ProgressionSubclass[]> {
  const subclasses = await prisma.subclass.findMany({
    where: { classId },
    select: { subclassId: true, name: true, description: true },
  });

  return subclasses.map((subclass) => ({
    id: subclass.subclassId,
    name: String(subclass.name),
    description: subclass.description,
  }));
}

export async function loadFightingStyleOptions(): Promise<FightingStyleOption[]> {
  return prisma.fightingStyle.findMany({
    where: { ruleset: ACTIVE_RULESET },
    select: { id: true, name: true, description: true },
  });
}
