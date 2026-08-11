import * as Sentry from "@sentry/nextjs";

import { sharedSentryOptions } from "@/lib/monitoring/sentry-options";

Sentry.init({
  ...sharedSentryOptions,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
