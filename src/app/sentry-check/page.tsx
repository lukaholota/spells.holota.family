import { notFound } from "next/navigation";

import { isSentryCheckAllowed } from "@/lib/monitoring/sentry-check-access";

import { SentryCheckControls } from "./sentry-check-controls";

export const dynamic = "force-dynamic";

export default async function SentryCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!isSentryCheckAllowed(token)) notFound();

  return <SentryCheckControls />;
}
