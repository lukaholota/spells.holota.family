"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import GoogleOneTap from "@/lib/components/auth/GoogleOneTap";
import { Toaster } from "@/components/ui/sonner";
import { PostHogProvider } from "@/lib/monitoring/posthog-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GoogleOneTap />
      <PostHogProvider />
      {children}
      <Toaster position="top-right" richColors closeButton />
    </SessionProvider>
  );
}
