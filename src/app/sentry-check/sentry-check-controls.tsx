"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

// DSN читається саме тут, у клієнтському компоненті, а не на сервері. У цьому весь сенс
// перевірки: на сервері змінна є завжди (вона в char.env), а питання в тому, чи вшив її
// `next build` у клієнтський бандл. Саме на цій різниці проєкт уже одного разу зламав One Tap.
function findDsnHost(dsn: string | undefined) {
  if (!dsn) return "НЕМАЄ — NEXT_PUBLIC_SENTRY_DSN не потрапив у клієнтський бандл";

  try {
    return new URL(dsn).host;
  } catch {
    return "нечитабельне значення";
  }
}

export function SentryCheckControls() {
  const [shouldFailOnRender, setShouldFailOnRender] = useState(false);

  if (shouldFailOnRender) {
    throw new Error("Sentry перевірка: навмисна клієнтська помилка рендера");
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8 font-sans">
      <h1 className="text-2xl font-bold">Перевірка Sentry</h1>

      <p className="text-sm text-slate-400">
        DSN у клієнтському бандлі: <code>{findDsnHost(process.env.NEXT_PUBLIC_SENTRY_DSN)}</code>
      </p>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          onClick={() => {
            throw new Error("Sentry перевірка: навмисна клієнтська помилка в обробнику");
          }}
        >
          Помилка в обробнику події — має долетіти глобальним перехопленням SDK
        </Button>

        <Button variant="outline" onClick={() => setShouldFailOnRender(true)}>
          Помилка рендера — має долетіти через error.tsx
        </Button>
      </div>
    </div>
  );
}
