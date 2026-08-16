import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  attachManualSpell,
  findCharacterOwnerId,
  isSpellAttached,
  removeSpellFromCharacter,
  spellExists,
} from "@/server/db/character-api";
import { findUserIdByEmail } from "@/server/db/users";

/**
 * POST /api/characters/[characterId]/spells
 * Add a spell to a character
 * Body: { spellId: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;
  const persId = Number(characterId);
  
  if (!Number.isFinite(persId)) {
    return NextResponse.json({ error: "Invalid character ID" }, { status: 400 });
  }

  const body = await request.json();
  const { spellId } = body;

  if (typeof spellId !== "number") {
    return NextResponse.json({ error: "Invalid spell ID" }, { status: 400 });
  }

  // Verify user owns this character
  const userId = await findUserIdByEmail(session.user.email);

  if (userId === null) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const characterOwnerId = await findCharacterOwnerId(persId);

  if (characterOwnerId === null || characterOwnerId !== userId) {
    return NextResponse.json({ error: "Character not found or access denied" }, { status: 403 });
  }

  // Check if spell exists
  const spellFound = await spellExists(spellId);

  if (!spellFound) {
    return NextResponse.json({ error: "Spell not found" }, { status: 404 });
  }

  // Check if already attached
  const existing = await isSpellAttached(persId, spellId);

  if (existing) {
    return NextResponse.json({ 
      success: true, 
      added: false, 
      message: "Spell already attached" 
    });
  }

  // Add spell to character
  await attachManualSpell(persId, spellId);

  return NextResponse.json({ success: true, added: true });
}

/**
 * DELETE /api/characters/[characterId]/spells
 * Remove a spell from a character
 * Body: { spellId: number }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;
  const persId = Number(characterId);
  
  if (!Number.isFinite(persId)) {
    return NextResponse.json({ error: "Invalid character ID" }, { status: 400 });
  }

  const body = await request.json();
  const { spellId } = body;

  if (typeof spellId !== "number") {
    return NextResponse.json({ error: "Invalid spell ID" }, { status: 400 });
  }

  // Verify user owns this character
  const userId = await findUserIdByEmail(session.user.email);

  if (userId === null) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const characterOwnerId = await findCharacterOwnerId(persId);

  if (characterOwnerId === null || characterOwnerId !== userId) {
    return NextResponse.json({ error: "Character not found or access denied" }, { status: 403 });
  }

  // Remove spell from character
  await removeSpellFromCharacter(persId, spellId);

  return NextResponse.json({ success: true, removed: true });
}
