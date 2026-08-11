import * as Sentry from "@sentry/nextjs";

import { sharedSentryOptions } from "@/lib/monitoring/sentry-options";

// Edge-рантайм зараз не використовується — middleware в проєкті немає. Файл існує, щоб
// перший же доданий middleware не опинився поза моніторингом мовчки.
Sentry.init({
  ...sharedSentryOptions,
  dsn: process.env.SENTRY_DSN,
});
