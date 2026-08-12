import { notFound } from "next/navigation";

import { isPostHogCheckAllowed } from "@/lib/monitoring/posthog-check-access";

import { PostHogCheckControls } from "./posthog-check-controls";

export const dynamic = "force-dynamic";

export default async function PostHogCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!isPostHogCheckAllowed(token)) notFound();

  return <PostHogCheckControls />;
}
