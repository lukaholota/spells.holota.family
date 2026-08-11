import * as Sentry from "@sentry/nextjs";

// Помилку, що сталася на сервері, Next віддає в клієнтську межу помилок уже без стека —
// лишається тільки `digest` і загальний текст. Сама помилка при цьому вже поїхала в Sentry
// через `onRequestError` в instrumentation.ts, зі справжнім стеком. Якщо ловити її ще й тут,
// на кожну серверну поломку виходить друга, беззмістовна подія — і подвійна витрата квоти.
export function reportBoundaryError(error: Error & { digest?: string }) {
  if (error.digest) return;

  Sentry.captureException(error);
}
