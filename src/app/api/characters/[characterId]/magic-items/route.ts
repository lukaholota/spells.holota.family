import { NextRequest, NextResponse } from "next/server";
import { attachMagicItem, removeOneMagicItem } from "@/server/db/character-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const { magicItemId } = await request.json();

    if (!characterId || !magicItemId) {
      return NextResponse.json({ error: "Missing characterId or magicItemId" }, { status: 400 });
    }

    const persIdInt = parseInt(characterId, 10);
    const magicItemIdInt = parseInt(magicItemId, 10);

    // Create the PersMagicItem link
    await attachMagicItem(persIdInt, magicItemIdInt);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding magic item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ characterId: string }> }
) {
  try {
    const { characterId } = await params;
    const { magicItemId } = await request.json();

    if (!characterId || !magicItemId) {
      return NextResponse.json({ error: "Missing characterId or magicItemId" }, { status: 400 });
    }

    const persIdInt = parseInt(characterId, 10);
    const magicItemIdInt = parseInt(magicItemId, 10);

    // Delete ONE instance of this item
    await removeOneMagicItem(persIdInt, magicItemIdInt);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting magic item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
