"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";

export const App = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isEmbed =
    (pathname.startsWith("/spells") || pathname.startsWith("/magic-items")) &&
    searchParams.get("origin") === "character";

  return (
    <main
      className={
        "col-start-1 h-dvh row-start-1 flex w-screen md:w-full flex-col items-center md:pb-0 " +
        (isEmbed ? "pb-0 " : "pb-28 ") +
        (isEmbed ? "md:col-start-1 md:col-span-2" : "md:col-start-2")
      }
    >
      { children }
    </main>
  )
}
