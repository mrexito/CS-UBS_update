import type { Metadata } from "next";
import React from "react";

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
