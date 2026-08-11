import { NextResponse } from "next/server";

import { isSentryCheckAllowed } from "@/lib/monitoring/sentry-check-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? undefined;

  if (!isSentryCheckAllowed(token)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  throw new Error("Sentry перевірка: навмисна серверна помилка");
}
