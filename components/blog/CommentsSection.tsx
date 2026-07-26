"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  createCommentAction,
  deleteCommentAction,
  type CommentFormState,
} from "@/app/[locale]/blogs/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const COMMENT_MAX_LENGTH = 500;

type CommentUser = {
  id: string;
  username: string | null;
  email: string | null;
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser | null;
};

type Role = "USER" | "ADMIN" | "EDITOR";

export type CommentsSectionProps = {
  locale: string;
  postId: string;
  comments: CommentItem[];
  isAuthenticated: boolean;
  blogOwnerId?: string;
  currentUserId?: string;
  currentUserRole?: Role;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" isLoading={pending} disabled={pending} className="w-full sm:w-auto">
      {label}
    </Button>
  );
}

export function CommentsSection({
  locale,
  postId,
  comments,
  isAuthenticated,
  blogOwnerId,
  currentUserId,
  currentUserRole,
}: CommentsSectionProps) {
  const t = useTranslations("blogs");
  const router = useRouter();
  const [content, setContent] = useState("");
  const createComment = createCommentAction.bind(null, locale, postId);
  const [state, formAction] = useActionState<CommentFormState, FormData>(createComment, {
    error: null,
    success: null,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);

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

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success(state.success);
      setContent("");
      router.refresh();
    }
  }, [router, state?.error, state?.success]);

  const formatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }),
    [locale]
  );

  const commentCountLabel = t("kommentarAnzahl", { count: comments.length });
  const counterId = `comment-counter-${postId}`;
  const remaining = COMMENT_MAX_LENGTH - content.length;
  const isNearLimit = remaining <= 50;
  const counterClasses = isNearLimit ? "text-danger" : "text-muted";

  const canDeleteComment = (comment: CommentItem, blogOwnerId?: string, currentUserId?: string, role?: Role) => {
    if (!currentUserId) return false;
    if (comment.user?.id === currentUserId) return true;
    if (blogOwnerId && blogOwnerId === currentUserId) return true;
    if (role === "ADMIN" || role === "EDITOR") return true;
    return false;
  };

  const requestDelete = (commentId: string) => {
    setConfirmCommentId(commentId);
  };

  const handleDelete = async () => {
    if (!confirmCommentId) return;
    setDeletingId(confirmCommentId);
    try {
      const result = await deleteCommentAction(locale, postId, confirmCommentId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result?.success ?? t("kommentarGeloescht"));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("kommentarLoeschenFehlgeschlagen"));
    } finally {
      setDeletingId(null);
      setConfirmCommentId(null);
    }
  };

  return (
    <section id="comments" aria-label={commentCountLabel} className="space-y-6">
      <div>
        <p className="eyebrow">{t("kommentareTitel")}</p>
        <h2 className="text-2xl font-semibold text-text">
          {t("kommentareHeading", { count: comments.length })}
        </h2>
      </div>

      <div className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">{t("nochKeineKommentare")}</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => {
              const showDelete = canDeleteComment(comment, blogOwnerId, currentUserId, currentUserRole);
              const isPending = deletingId === comment.id;
              return (
                <li
                  key={comment.id}
                  className="surface-card border border-border/70 p-5 shadow-sm transition hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    {comment.user ? (
                      <Link
                        href={`/${locale}/users/${comment.user.id}`}
                        className="font-semibold text-primary transition hover:text-primary-hover hover:underline"
                      >
                        {comment.user.username ?? comment.user.email ?? t("anonymerAutor")}
                      </Link>
                    ) : (
                      <span className="font-semibold text-text">{t("anonymerAutor")}</span>
                    )}
                    <div className="flex items-center gap-3">
                      <time dateTime={comment.createdAt}>{formatter.format(new Date(comment.createdAt))}</time>
                      {showDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => requestDelete(comment.id)}
                          disabled={isPending}
                          className="text-danger"
                        >
                          {isPending ? t("wirdGespeichertLoading") : t("kommentarLoeschenLabel")}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text">{comment.content}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="surface-card border border-border/80 p-5 shadow-sm">
        {isAuthenticated ? (
          <form action={formAction} className="space-y-3">
            <label className="block text-sm font-medium text-text" htmlFor="comment-content">
              {t("kommentarLabel")}
            </label>
            <textarea
              id="comment-content"
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, COMMENT_MAX_LENGTH))}
              minLength={3}
              maxLength={COMMENT_MAX_LENGTH}
              required
              aria-describedby={counterId}
              className="min-h-[140px] w-full rounded-2xl border border-border/70 bg-surface-2 px-4 py-3 text-sm text-text shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder={t("kommentarPlaceholder")}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted">{t("commentMaxChars", { max: COMMENT_MAX_LENGTH })}</span>
              <span id={counterId} className={`font-semibold ${counterClasses}`}>
                {content.length} / {COMMENT_MAX_LENGTH}
              </span>
            </div>
            <SubmitButton label={t("kommentarSenden")} />
          </form>
        ) : (
          <div className="space-y-3 text-sm text-muted">
            <p>{t("bitteAnmeldenKommentar")}</p>
            <Link href={`/${locale}/auth/login`} className="inline-flex text-primary hover:text-primary-hover">
              {t("zumLogin")}
            </Link>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmCommentId)}
        title={t("kommentarLoeschenLabel")}
        description={t("kommentarLoeschenBestaetigung")}
        confirmLabel={deleteLabel}
        cancelLabel={cancelLabel}
        onCancel={() => {
          setConfirmCommentId(null);
          setDeletingId(null);
        }}
        onConfirm={handleDelete}
        isConfirming={Boolean(deletingId)}
      />
    </section>
  );
}
