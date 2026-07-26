"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { LoginResult } from "./actions";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button, buttonClassNames } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("login");
  return (
    <Button type="submit" className="w-full" isLoading={pending} disabled={pending}>
      {pending ? t("anmeldungLäuft") : t("anmelden")}
    </Button>
  );
}

export default function LoginFormClient({ action }: { action: (prevState: LoginResult, formData: FormData) => Promise<LoginResult> }) {
  const params = useParams<{ locale: string }>();
  const t = useTranslations("login");
  const localePrefix = params?.locale ? `/${params.locale}` : "";
  const [state, formAction] = useActionState<LoginResult, FormData>(async (prevState, formData) => action(prevState, formData), {
    error: null,
    redirectTo: undefined,
  });

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  useEffect(() => {
    if (!state?.redirectTo) return;

    // Force a full reload to ensure all server-rendered parts (navbar) see the fresh session
    window.location.href = state.redirectTo;
  }, [state?.redirectTo]);

  return (
    <form className="space-y-5" action={formAction}>
      <Input
        id="emailOrUsername"
        name="emailOrUsername"
        placeholder={t("EmailOBenutzername")}
        label={t("EmailOBenutzername")}
        required
      />
      <Input
        id="password"
        name="password"
        type="password"
        placeholder="••••••••"
        label={t("passwort")}
        required
      />
      <div className="space-y-3">
        <SubmitButton />
        <Link
          href={localePrefix ? `${localePrefix}/auth/register` : "/auth/register"}
          className={buttonClassNames({
            variant: "secondary",
            size: "md",
            className: "w-full justify-center",
          })}
        >
          {t("registrieren")}
        </Link>
      </div>
    </form>
  );
}
