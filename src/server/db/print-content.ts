import { prisma } from "@/lib/prisma";

export type PrintableSpell = {
  spellId: number;
  name: string;
  level: number;
  school: string | null;
  castingTime: string;
  range: string;
  duration: string;
  components: string | null;
  description: string;
  source: string;
};

export type PrintableMagicItem = {
  name: string;
  description: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "VERY_RARE" | "LEGENDARY" | "ARTIFACT";
  itemType: "ARMOR" | "POTION" | "RING" | "ROD" | "SCROLL" | "STAFF" | "WAND" | "WEAPON" | "WONDROUS_ITEM";
  requiresAttunement: boolean;
};

export async function loadPrintableSpells(spellIds: number[]): Promise<PrintableSpell[]> {
  const spells = await prisma.spell.findMany({
    where: { spellId: { in: spellIds } },
    orderBy: [{ level: "asc" }, { name: "asc" }],
    select: {
      spellId: true,
      name: true,
      level: true,
      school: true,
      castingTime: true,
      range: true,
      duration: true,
      components: true,
      description: true,
      source: true,
    },
  });

  return spells.map((spell) => ({ ...spell, source: String(spell.source) }));
}

export async function loadPrintableMagicItems(magicItemIds: number[]): Promise<PrintableMagicItem[]> {
  return prisma.magicItem.findMany({
    where: { magicItemId: { in: magicItemIds } },
    orderBy: { name: "asc" },
    select: {
      name: true,
      description: true,
      rarity: true,
      itemType: true,
      requiresAttunement: true,
    },
  });
}
