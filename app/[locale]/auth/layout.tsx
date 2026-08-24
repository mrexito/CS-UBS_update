import type { Metadata } from "next";
import React from "react";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
 

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthSectionLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return children;
}
