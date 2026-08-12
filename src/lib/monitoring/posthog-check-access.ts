// Той самий запобіжник, що й у Sentry (sentry-check-access.ts): без токена перевірочний
// маршрут узагалі не існує, щоб не давати кожному охочому смикати квоту.
export function isPostHogCheckAllowed(token: string | undefined) {
  const expected = process.env.POSTHOG_CHECK_TOKEN;

  return Boolean(expected) && token === expected;
}
