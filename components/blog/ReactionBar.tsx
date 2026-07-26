"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import type { ReactionType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { toggleReactionAction } from "@/app/[locale]/blogs/actions";

export type ReactionBarProps = {
  locale: string;
  postId: string;
  initialLikeCount: number;
  initialDislikeCount: number;
  initialUserReaction: ReactionType | null;
  isAuthenticated: boolean;
};

export function ReactionBar({
  locale,
  postId,
  initialLikeCount,
  initialDislikeCount,
  initialUserReaction,
  isAuthenticated,
}: ReactionBarProps) {
  const t = useTranslations("blogs");
  const router = useRouter();
  const [counts, setCounts] = useState(() => ({
    like: initialLikeCount ?? 0,
    dislike: initialDislikeCount ?? 0,
  }));
  const [userReaction, setUserReaction] = useState<ReactionType | null>(initialUserReaction);
  const [isPending, startTransition] = useTransition();
  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  useEffect(() => {
    setCounts({ like: initialLikeCount ?? 0, dislike: initialDislikeCount ?? 0 });
    setUserReaction(initialUserReaction);
  }, [initialDislikeCount, initialLikeCount, initialUserReaction]);

  const applyOptimisticReaction = (
    currentReaction: ReactionType | null,
    nextReaction: ReactionType,
    currentCounts: { like: number; dislike: number }
  ) => {
    let { like, dislike } = currentCounts;
    let reaction: ReactionType | null = nextReaction;

    if (currentReaction === nextReaction) {
      if (nextReaction === "LIKE") {
        like = Math.max(0, like - 1);
      } else {
        dislike = Math.max(0, dislike - 1);
      }
      reaction = null;
    } else if (nextReaction === "LIKE") {
      like += 1;
      if (currentReaction === "DISLIKE") {
        dislike = Math.max(0, dislike - 1);
      }
    } else {
      dislike += 1;
      if (currentReaction === "LIKE") {
        like = Math.max(0, like - 1);
      }
    }

    return { like, dislike, reaction };
  };

  const buttons = useMemo(
    () => [
      { type: "LIKE" as ReactionType, count: counts.like, label: t("like") },
      { type: "DISLIKE" as ReactionType, count: counts.dislike, label: t("dislike") },
    ],
    [counts.dislike, counts.like, t]
  );

  const handleReaction = (nextReaction: ReactionType) => {
    if (!isAuthenticated) {
      toast.error(t("bitteAnmelden"));
      return;
    }

    const previousState = { counts, userReaction };
    const optimistic = applyOptimisticReaction(userReaction, nextReaction, counts);
    setCounts({ like: optimistic.like, dislike: optimistic.dislike });
    setUserReaction(optimistic.reaction ?? null);

    startTransition(() => {
      toggleReactionAction(locale, postId, nextReaction)
        .then((result) => {
          if (result.error) {
            setCounts(previousState.counts);
            setUserReaction(previousState.userReaction);
            toast.error(result.error);
            return;
          }

          if (typeof result.likeCount === "number" && typeof result.dislikeCount === "number") {
            setCounts({ like: result.likeCount, dislike: result.dislikeCount });
          }
          setUserReaction(result.userReaction ?? null);
          router.refresh();
        })
        .catch((error) => {
          console.error("toggleReactionAction", error);
          setCounts(previousState.counts);
          setUserReaction(previousState.userReaction);
          toast.error(t("reactionFehlgeschlagen"));
        });
    });
  };

  const baseButtonClasses =
    "group flex-1 min-w-[9rem] justify-between rounded-2xl border px-4 py-2 text-left text-sm font-semibold tracking-wide shadow-sm transition-all duration-150 sm:text-base";
  const iconBaseClasses = "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-colors";

  return (
    <div className="flex flex-wrap gap-4" aria-live="polite">
      {buttons.map(({ type, count, label }) => {
        const isActive = userReaction === type;
        return (
          <Button
            key={type}
            type="button"
            size="lg"
            variant="secondary"
            disabled={isPending || !isAuthenticated}
            aria-pressed={isActive}
            aria-label={`${label}: ${formatter.format(count)}`}
            onClick={() => handleReaction(type)}
            data-state={isActive ? "active" : "inactive"}
            className={`${baseButtonClasses} ${
              isActive
                ? "border-primary/70 bg-primary/10 text-primary ring-2 ring-primary/40"
                : "border-border/60 bg-surface-2 text-muted hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface hover:text-text"
            } ${
              !isAuthenticated
                ? "cursor-not-allowed opacity-70"
                : "focus-visible:ring-primary/60"
            }`}
            title={!isAuthenticated ? t("bitteAnmelden") : `${label} (${formatter.format(count)})`}
          >
            <span className="flex w-full items-center justify-between gap-3">
              <span className="flex items-center gap-3">
                <span
                  className={`${iconBaseClasses} ${
                    isActive
                      ? "bg-primary text-bg shadow-[0_8px_24px_rgba(17,25,40,0.25)]"
                      : "bg-surface text-text shadow-inner"
                  }`}
                  aria-hidden="true"
                >
                  {type === "LIKE" ? "👍" : "👎"}
                </span>
                <span className={isActive ? "text-primary" : "text-text"}>{label}</span>
              </span>
              <span className={`font-black tracking-tight ${isActive ? "text-primary" : "text-text"}`}>
                {formatter.format(count)}
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}
