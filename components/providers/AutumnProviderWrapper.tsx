"use client";

import { AutumnProvider } from "autumn-js/react";

export default function AutumnProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AutumnProvider betterAuthUrl={process.env.NEXT_PUBLIC_BETTER_AUTH_URL}>
      {children}
    </AutumnProvider>
  );
}

