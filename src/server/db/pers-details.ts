import { prisma } from "@/lib/prisma";

export type PersDetailsUpdate = {
  customProficiencies?: string;
  customLanguagesKnown?: string;
  customEquipment?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  backstory?: string;
  notes?: string;
  alignment?: string;
  xp?: number;
  cp?: string;
  ep?: string;
  sp?: string;
  gp?: string;
  pp?: string;
};

export async function updatePersDetails(persId: number, data: PersDetailsUpdate): Promise<void> {
  await prisma.pers.update({ where: { persId }, data });
}
