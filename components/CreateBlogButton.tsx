"use client";

import toast from "react-hot-toast";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { buttonClassNames } from "@/components/ui/button";

type Props = {
  isLoggedIn: boolean;
};

export default function CreateBlogButton({ isLoggedIn }: Props) {
  const t = useTranslations("blogs");
  if (isLoggedIn) {
    return (
      <Link href="/blogs/new" className={buttonClassNames({ variant: "secondary", size: "md", className: "px-5" })}>
        {t("newBlogButton")}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toast(t("anmeldenUmBlogErstellen"))}
      className={buttonClassNames({ variant: "secondary", size: "md", className: "px-5" })}
    >
      {t("newBlogButton")}
    </button>
  );
}
