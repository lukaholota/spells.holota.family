import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Без цього Next може оптимізувати роут у статику, і він віддавав би 200 навіть із мертвою
// базою — тобто відтворив би рівно ту сліпу зону, заради якої його й додано (див. KR1.5).
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseOk = await isDatabaseReachable();

  return NextResponse.json(
    { status: databaseOk ? "ok" : "degraded", database: databaseOk },
    { status: databaseOk ? 200 : 503 },
  );
}

async function isDatabaseReachable() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
