"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { deleteBlogAction } from "@/app/[locale]/blogs/actions";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  locale: string;
  blogId: string;
  redirectPath?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export default function DeleteBlogButton({
  locale,
  blogId,
  redirectPath,
  variant = "destructive",
  size = "sm",
  className,
}: Props) {
  const router = useRouter();
  const t = useTranslations("blogs");
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const deleteLabel = (() => {
    const map: Record<string, string> = {
      de: "Löschen",
      es: "Eliminar",
      fr: "Supprimer",
      it: "Elimina",
      en: "Delete",
    };
    return map[locale] ?? map.en;
  })();

  const cancelLabel = (() => {
    const map: Record<string, string> = {
      de: "Abbrechen",
      es: "Cancelar",
      fr: "Annuler",
      it: "Annulla",
      en: "Cancel",
    };
    return map[locale] ?? map.en;
  })();

  const handleDelete = () => {
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteBlogAction(locale, blogId);
      if (result?.error) {
        toast.error(result.error);
        setDialogOpen(false);
        return;
      }

      toast.success(result?.success ?? t("blogGeloescht"));
      setDialogOpen(false);
      if (result?.redirectPath || redirectPath) {
        router.push(result.redirectPath ?? redirectPath ?? "/");
      }
      router.refresh();
    });
  };

  return (
    <>
      <Button
        onClick={handleDelete}
        variant={variant}
        size={size}
        isLoading={isPending}
        className={className}
      >
        {t("deleteBlogButton")}
      </Button>
      <ConfirmDialog
        open={dialogOpen}
        title={t("deleteBlogButton")}
        description={t("blogLoeschenBestaetigung")}
        confirmLabel={deleteLabel}
        cancelLabel={cancelLabel}
        onCancel={() => setDialogOpen(false)}
        onConfirm={confirmDelete}
        isConfirming={isPending}
      />
    </>
  );
}
