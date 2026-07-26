"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isConfirming = false,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;
    const focusable = confirmBtnRef.current ?? cancelBtnRef.current;
    focusable?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusTargets = [confirmBtnRef.current, cancelBtnRef.current].filter(Boolean) as HTMLElement[];
      if (focusTargets.length === 0) return;
      const currentIndex = focusTargets.findIndex((el) => el === document.activeElement);
      if (event.shiftKey) {
        const next = focusTargets[(currentIndex - 1 + focusTargets.length) % focusTargets.length];
        next.focus();
        event.preventDefault();
      } else {
        const next = focusTargets[(currentIndex + 1) % focusTargets.length];
        next.focus();
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActive?.focus();
    };
  }, [open, onCancel]);

  if (typeof document === "undefined") return null;
  if (!open) return null;

  const confirmBaseClasses =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition focus:outline-none hover:cursor-pointer";
  const confirmVariant = isConfirming
    ? "bg-red-600 text-white opacity-90"
    : "bg-red-600 text-white hover:bg-red-700";

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="w-full max-w-md animate-in fade-in zoom-in rounded-2xl border border-border bg-[hsl(var(--bg))] p-6 shadow-2xl outline-none dark:bg-surface"
      >
        <div className="space-y-3">
          <h2 id={titleId} className="text-lg font-semibold text-text">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="text-sm text-muted">
              {description}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              ref={cancelBtnRef}
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold text-text shadow-sm transition hover:bg-surface hover:cursor-pointer"
              data-focusable="true"
              disabled={isConfirming}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              ref={confirmBtnRef}
              onClick={onConfirm}
              className={`${confirmBaseClasses} ${confirmVariant}`}
              data-focusable="true"
              disabled={isConfirming}
            >
              {isConfirming ? `${confirmLabel}…` : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
