"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { deleteUserAction } from "@/app/[locale]/users/actions";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Props = {
  locale: string;
  userId: string;
  redirectPath?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export default function DeleteUserButton({
  locale,
  userId,
  redirectPath,
  variant = "destructive",
  size = "sm",
  className,
}: Props) {
  const router = useRouter();
  const t = useTranslations("user");
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const deleteLabel = (() => {
    try {
      const map: Record<string, string> = {
        de: "Löschen",
        es: "Eliminar",
        fr: "Supprimer",
        it: "Elimina",
        en: "Delete",
      };
      return map[locale] ?? map.en;
    } catch {
      return "Löschen";
    }
  })();

  const cancelLabel = (() => {
    try {
      const map: Record<string, string> = {
        de: "Abbrechen",
        es: "Cancelar",
        fr: "Annuler",
        it: "Annulla",
        en: "Cancel",
      };
      return map[locale] ?? map.en;
    } catch {
      return "Abbrechen";
    }
  })();

  const handleDelete = () => setDialogOpen(true);

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteUserAction(locale, userId);
      if (result?.error) {
        toast.error(result.error);
        setDialogOpen(false);
        return;
      }

      toast.success(result?.success ?? t("accountDeleted"));
      const destination = result?.redirectTo ?? redirectPath ?? "/";
      setDialogOpen(false);
      if (result?.shouldSignOut) {
        router.replace(destination);
        await signOut({ redirect: false });
        router.refresh();
        return;
      }
      router.replace(destination);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleDelete}
        isLoading={isPending}
      >
        {t("deleteAccountButton")}
      </Button>
      <ConfirmDialog
        open={dialogOpen}
        title={t("deleteAccountButton")}
        description={t("deleteAccountConfirm")}
        confirmLabel={deleteLabel}
        cancelLabel={cancelLabel}
        onCancel={() => setDialogOpen(false)}
        onConfirm={confirmDelete}
        isConfirming={isPending}
      />
    </>
  );
}
