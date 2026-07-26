"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { buttonClassNames } from "@/components/ui/button";

export function GoogleSignInButton() {
  const handleClick = () => {
    signIn("google"); // Trigger sign-in via Google using NextAuth
  };
  const t = useTranslations("login");

  // Render a button with an embedded Google logo and sign-in text
  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonClassNames({ variant: "secondary", size: "md", className: "w-full gap-3 cursor-pointer" })}
    >
      <Image src="/google.png" alt={t("googleLogoAlt")} width={18} height={18} />
      <span>{t("signInWithGoogle")}</span>
    </button>
  );
}

export function GithubSignInButton() {
  const handleClick = () => {
    signIn("github"); // Trigger sign-in via GitHub using NextAuth
  };
  const t = useTranslations("login");

  // Render a button with an embedded GitHub logo and sign-in text
  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonClassNames({ variant: "secondary", size: "md", className: "w-full gap-3 cursor-pointer" })}
    >
      <Image src="/github.png" alt={t("githubLogoAlt")} width={18} height={18} />
      <span>{t("signInWithGitHub")}</span>
    </button>
  );
}
