import { NextResponse } from "next/server";

import { isDatabaseReachable } from "@/server/db/health";

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
