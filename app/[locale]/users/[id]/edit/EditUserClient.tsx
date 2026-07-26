"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";
import type { UpdateUserState } from "./actions";
import Image from "next/image";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Button, buttonMotionClasses } from "@/components/ui/button";

const BIO_MAX_LENGTH = 500;


type UserFormData = {
  id: string;
  username: string;
  email: string;
  image: string;
  bio: string;
};

type Props = {
  user: UserFormData;
  action: (prevState: UpdateUserState, formData: FormData) => Promise<UpdateUserState>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("userEdit");
  const d = useTranslations("buttons");
  return (
    <Button type="submit" className="w-full" disabled={pending} isLoading={pending}>
      {pending ? `${t("speichere")}...` : d("speichern")}
    </Button>
  );
}

export default function EditUserForm({ user, action }: Props) {
  const t = useTranslations("userEdit"); 
  const d = useTranslations("user");
  const [preview, setPreview] = useState(user.image || "");
  const [bio, setBio] = useState(user.bio || "");
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useActionState<UpdateUserState, FormData>(async (prev, formData) => {
    return action(prev, formData);
  }, {
    error: null,
    success: null,
    redirectTo: null,
  });

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state?.error, state?.success]);

  useEffect(() => {
    if (!state?.redirectTo) return;

    window.location.href = state.redirectTo;
  }, [state?.redirectTo]);

  return (
    <form
      action={formAction}
      className="surface-card space-y-5 bg-[hsl(var(--bg))] dark:bg-surface"
    >
      <Input
        name="username"
        defaultValue={user.username}
        placeholder={t("usernamePlaceholder")}
        label={t("benutzername")}
      />
      <Input name="email" type="email" defaultValue={user.email} placeholder={d("email")} label={d("email")} />
      <div>
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          label={t("neuesPasswort")}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className={`mt-2 inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold text-primary hover:text-primary-hover ${buttonMotionClasses}`}
        >
          {showPassword ? t("passwortVerbergen") : t("passwortAnzeigen")}
        </button>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium text-text">{t("profilbild")}</p>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24">
            {preview ? (
              <Image
                id="profile-image-preview"
                src={preview}
                alt={t("profileImagePreviewAlt")}
                fill
                sizes="96px"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full border border-border bg-surface-2 text-sm text-text">
                {t("keinBild")}
              </div>
            )}
          </div>
          <CldUploadWidget
            uploadPreset="ChangeUserProfilePicture"
            signatureEndpoint="/api/auth/sign-cloudinary-params"
            onSuccess={(result: CloudinaryUploadWidgetResults | undefined) => {
              const info = result?.info;
              if (info && typeof info === "object" && "secure_url" in info && typeof info.secure_url === "string") {
                setPreview(info.secure_url);
              }
            }}
          >
            {({ open }) => (
              <Button type="button" variant="secondary" onClick={() => open()}>
                {t("bildHochladen")}
              </Button>
            )}
          </CldUploadWidget>
        </div>
        <input type="hidden" id="image-input" name="image" value={preview} readOnly />
      </div>
      <div>
        <label className="text-sm font-medium text-text" htmlFor="bio-field">
          {t("bio")}
        </label>
        <textarea
          id="bio-field"
          name="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value.slice(0, BIO_MAX_LENGTH))}
          maxLength={BIO_MAX_LENGTH}
          className="mt-2 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-text shadow-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={t("überDich")}
          rows={4}
        />
        <div className="mt-1 flex justify-end text-xs text-muted">
          <span className={bio.length >= BIO_MAX_LENGTH - 50 ? "font-semibold text-danger" : ""}>
            {bio.length} / {BIO_MAX_LENGTH}
          </span>
        </div>
      </div>

      <SubmitButton />
    </form>
  );
}
