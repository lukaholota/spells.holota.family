import { SpellOrigin } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CharacterSpellIndexEntry = {
  characterId: number;
  name: string;
  spellIds: number[];
};

export async function listCharacterSpellIndex(userId: number): Promise<CharacterSpellIndexEntry[]> {
  const characters = await prisma.pers.findMany({
    where: { userId },
    select: {
      persId: true,
      name: true,
      persSpells: { select: { spellId: true } },
    },
  });

  return characters.map((character) => ({
    characterId: character.persId,
    name: character.name,
    spellIds: character.persSpells.map((persSpell) => persSpell.spellId),
  }));
}

export async function findCharacterOwnerId(persId: number): Promise<number | null> {
  const character = await prisma.pers.findUnique({ where: { persId }, select: { userId: true } });
  return character?.userId ?? null;
}

export async function spellExists(spellId: number): Promise<boolean> {
  return (await prisma.spell.findUnique({ where: { spellId }, select: { spellId: true } })) !== null;
}

export async function isSpellAttached(persId: number, spellId: number): Promise<boolean> {
  return (await prisma.persSpell.findUnique({ where: { persId_spellId: { persId, spellId } } })) !== null;
}

export async function attachManualSpell(persId: number, spellId: number): Promise<void> {
  await prisma.persSpell.create({
    data: { persId, spellId, learnedAtLevel: 0, origin: SpellOrigin.MANUAL },
  });
}

export async function removeSpellFromCharacter(persId: number, spellId: number): Promise<void> {
  await prisma.persSpell.deleteMany({ where: { persId, spellId } });
}

export async function attachMagicItem(persId: number, magicItemId: number): Promise<void> {
  await prisma.persMagicItem.create({
    data: { persId, magicItemId, isEquipped: false, isAttuned: false },
  });
}

export async function removeOneMagicItem(persId: number, magicItemId: number): Promise<void> {
  const itemToDelete = await prisma.persMagicItem.findFirst({ where: { persId, magicItemId } });
  if (itemToDelete) {
    await prisma.persMagicItem.delete({ where: { persMagicItemId: itemToDelete.persMagicItemId } });
  }
}
