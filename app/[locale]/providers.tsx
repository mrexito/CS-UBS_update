"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default function Providers({ children, session }: { children: ReactNode; session: Session | null }) {
  return (
    <ThemeProvider>
      <SessionProvider session={session} refetchOnWindowFocus={false}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className: "rounded-lg border border-border bg-surface text-text shadow-lg",
            style: { padding: "12px 14px" },
            success: {
              iconTheme: { primary: "hsl(var(--success))", secondary: "hsl(var(--bg))" },
            },
            error: {
              iconTheme: { primary: "hsl(var(--danger))", secondary: "hsl(var(--bg))" },
            },
          }}
        />
      </SessionProvider>
    </ThemeProvider>
  );
}