"use client";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import { PageSection } from "@/components/layout/PageSection";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type PageProps = { params: { locale: string } };

const RegisterPage = ({ params }: PageProps) => {
  void params;
  const t = useTranslations("register");
  const ref = useRef<HTMLFormElement>(null);
  const { status } = useSession(); // Retrieves session data and status from authentication
  const router = useRouter(); // Initialize router for navigation
  const routeParams = useParams<{ locale: string }>();
  const localePrefix = routeParams?.locale ? `/${routeParams.locale}` : "";
  const homePath = localePrefix || "/";

  // Effect that redirects user when authenticated
  useEffect(() => {
    // Redirect to home if the user is already authenticated
    if (status === "authenticated") {
      router.push(homePath);
    }
  }, [status, router, homePath]);

  // State for managing user input and form submission status
  const [userInfo, setUserInfo] = useState({
    username: "",
    email: "",
    password: "",
  }); // State for storing user input
  const [pending, setPending] = useState(false); // State for managing loading status

  // Handles changes in form inputs and updates state
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value, // Updates the corresponding field in the userInfo object
    });
  };

  // Handles form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission behavior
    // Validate user input
    if (!userInfo.username || !userInfo.email || !userInfo.password) {
      toast.error(t("errors.fillAllFields"));
      return;
    }

    const payload = {
      username: userInfo.username.trim(),
      email: userInfo.email.trim().toLowerCase(),
      password: userInfo.password.trim(),
    };

    if (!payload.password) {
      toast.error(t("errors.passwordRequired"));
      return;
    }

    try {
      setPending(true); // Indicate the start of a registration process
      // API call to register the user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (ref.current) {
          ref.current.reset(); // Reset form if the reference is valid
        }
        toast.success(t("success.registered"));
        const target = localePrefix ? `${localePrefix}/auth/login` : "/auth/login";
        // Force a hard navigation so the app state (navbar/session-aware parts) is fresh after registration
        window.location.href = target;
      } else {
        const errorData = await res.json(); // Parse error message from the response
        toast.error(errorData?.message ?? t("errors.failed"));
      }
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setPending(false); // Reset pending status
    }
  };

  return (
    <PageSection className="py-12">
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className="surface-card mx-auto w-full max-w-xl space-y-6 p-8"
      >
        <div className="space-y-2 text-center">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1 className="text-3xl font-semibold text-text">{t("title")}</h1>
          <p className="text-sm text-muted">{t("lead")}</p>
        </div>

        <Input
          id="username"
          name="username"
          label={t("fields.username.label")}
          placeholder={t("fields.username.placeholder")}
          value={userInfo.username}
          onChange={handleChange}
          required
        />
        <Input
          id="email"
          name="email"
          type="email"
          label={t("fields.email.label")}
          placeholder={t("fields.email.placeholder")}
          value={userInfo.email}
          onChange={handleChange}
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label={t("fields.password.label")}
          placeholder={t("fields.password.placeholder")}
          value={userInfo.password}
          onChange={handleChange}
          required
        />

        <Button disabled={pending} isLoading={pending} className="w-full" type="submit">
          {pending ? t("submit.loading") : t("submit.label")}
        </Button>
      </form>
    </PageSection>
  );
};

export default RegisterPage;
