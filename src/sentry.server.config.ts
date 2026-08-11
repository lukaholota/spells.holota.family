import * as Sentry from "@sentry/nextjs";

import { sharedSentryOptions } from "@/lib/monitoring/sentry-options";

// DSN серверний береться з рантайму (char.env), а не з NEXT_PUBLIC_*: його можна змінити
// перезапуском контейнера, без перезбірки образу.
//
// `includeLocalVariables` навмисно не вмикається: він чіпляє значення локальних змінних до
// кадрів стека, а серед них бувають email і вміст персонажів — це суперечило б sendDefaultPii: false.
Sentry.init({
  ...sharedSentryOptions,
  dsn: process.env.SENTRY_DSN,
});
