// Візард Sentry створює публічні /sentry-example-page і /api/sentry-example-api, які кидають
// помилку кожному охочому. На сайті з реальними користувачами це відкритий кран у безкоштовну
// квоту (~5 тис. подій/міс): вичерпавши її, Sentry почне відкидати справжні помилки. Тому
// перевірочні маршрути закриті токеном, а без нього їх узагалі не існує.
export function isSentryCheckAllowed(token: string | undefined) {
  const expected = process.env.SENTRY_CHECK_TOKEN;

  return Boolean(expected) && token === expected;
}
