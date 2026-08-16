import { prisma } from "@/lib/prisma";

export type ClassSubclassFeature = {
  subclassFeatureId: number;
  levelGranted: number;
  feature: {
    featureId: number;
    name: string;
    description: string;
  };
};

export type ClassSubclass = {
  subclassId: number;
  name: string;
  description: string | null;
  languages: string[];
  languagesToChooseCount: number;
  toolProficiencies: string[];
  toolToChooseCount: number | null;
  primaryCastingStat: string | null;
  spellcastingType: string;
  features: ClassSubclassFeature[];
};

export async function loadClassSubclasses(classId: number): Promise<ClassSubclass[]> {
  return prisma.subclass.findMany({
    where: { classId },
    select: {
      subclassId: true,
      name: true,
      description: true,
      languages: true,
      languagesToChooseCount: true,
      toolProficiencies: true,
      toolToChooseCount: true,
      primaryCastingStat: true,
      spellcastingType: true,
      features: {
        select: {
          subclassFeatureId: true,
          levelGranted: true,
          feature: { select: { featureId: true, name: true, description: true } },
        },
      },
    },
    orderBy: [{ subclassId: "asc" }],
  });
}
