import { prisma } from "@/lib/prisma";

export type MagicItemUpdates = {
  isEquipped?: boolean;
  isAttuned?: boolean;
};

export async function findMagicItemPersId(persMagicItemId: number): Promise<number | null> {
  const item = await prisma.persMagicItem.findUnique({
    where: { persMagicItemId },
    select: { persId: true },
  });

  return item?.persId ?? null;
}

export function updatePersMagicItem(persMagicItemId: number, updates: MagicItemUpdates) {
  return prisma.persMagicItem.update({
    where: { persMagicItemId },
    data: updates,
  });
}

export function deletePersMagicItem(persMagicItemId: number) {
  return prisma.persMagicItem.delete({ where: { persMagicItemId } });
}

export async function hasMagicItemLink(persId: number, magicItemId: number): Promise<boolean> {
  const link = await prisma.persMagicItem.findFirst({
    where: { persId, magicItemId },
    select: { persMagicItemId: true },
  });

  return link !== null;
}

export function removeMagicItemLinks(persId: number, magicItemId: number) {
  return prisma.persMagicItem.deleteMany({ where: { persId, magicItemId } });
}

export function addMagicItemLink(persId: number, magicItemId: number) {
  return prisma.persMagicItem.create({
    data: { persId, magicItemId, isEquipped: false, isAttuned: false },
  });
}
