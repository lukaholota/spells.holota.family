import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listCharacterSpellIndex } from "@/server/db/character-api";
import { findUserIdByEmail } from "@/server/db/users";

/**
 * GET /api/characters
 * Returns the current user's characters with their spell IDs
 */
export async function GET() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await findUserIdByEmail(session.user.email);

  if (userId === null) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await listCharacterSpellIndex(userId);

  return NextResponse.json(result);
}
