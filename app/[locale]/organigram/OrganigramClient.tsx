"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { OrgChart as OrgChartType } from "d3-org-chart";
import type { OrgChartEntry } from "@/lib/orgChart";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { CldUploadWidget } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";

const escapeHtml = (value?: string | null) =>
  (value ?? "")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("&", "&amp;");

type DivisionOption = { id: string; name: string };
type NodeType = "DIVISION" | "PERSON";
type ChartNode = {
  id: string;
  parentId: string | null;
  name: string;
  roleTitle?: string;
  department?: string;
  description?: string;
  photoUrl?: string;
  userId?: string;
  linkedUserId?: string;
  createdById?: string;
  nodeType: NodeType;
};

type Copy = {
  addYourselfHeading: string;
  alreadyRegistered: string;
  departmentLabel: string;
  departmentPlaceholder: string;
  functionLabel: string;
  functionPlaceholder: string;
  parentLabel: string;
  submitLabel: string;
  loginPrompt: string;
  success: string;
  error: string;
  deleteHeading: string;
  deleteSelfLabel: string;
  deleteAdminLabel: string;
  deleteSelectPlaceholder: string;
  deleteConfirm: string;
  deleteSuccess: string;
  deleteError: string;
  nameLabel?: string;
  photoLabel?: string;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  createTitle?: string;
  parentNone?: string;
  saveLabel?: string;
  cancelLabel?: string;
  editLabel?: string;
  viewDetails?: string;
  cycleError?: string;
  uploadLabel?: string;
};

type Props = {
  initialNodes: OrgChartEntry[];
  divisions: DivisionOption[];
  copy: Copy;
  canSelfRegister: boolean;
  alreadyRegistered: boolean;
  locale: string;
  selfNodeId?: string;
  isAdmin?: boolean;
  currentUserId?: string;
};

type FormState = {
  name: string;
  roleTitle: string;
  department: string;
  description: string;
  parentId: string;
  photoUrl: string;
};

const DEFAULT_NODE_PHOTO =
  "https://res.cloudinary.com/dymwgac6m/image/upload/v1765210908/296fe121-5dfa-43f4-98b5-db50019738a7_bxzq63.jpg";

const photoUrlSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().url().max(512).optional());

const nodeSchema = z.object({
  name: z.string().min(2).max(120),
  roleTitle: z.string().min(2).max(160),
  department: z.string().max(160).optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
  photoUrl: photoUrlSchema,
});

export default function OrganigramClient({
  initialNodes,
  divisions,
  copy,
  canSelfRegister,
  alreadyRegistered,
  locale,
  selfNodeId,
  isAdmin,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [nodes, setNodes] = useState<OrgChartEntry[]>(initialNodes);
  const [formState, setFormState] = useState<FormState>(() => ({
    name: "",
    roleTitle: "",
    department: "",
    description: "",
    parentId: divisions[0]?.id ?? "",
    photoUrl: "",
  }));
  const [hasRegistered, setHasRegistered] = useState(alreadyRegistered);
  const [isPending, startTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [selfNodeIdState, setSelfNodeIdState] = useState<string>(selfNodeId ?? "");
  const [deleteTargetId, setDeleteTargetId] = useState<string>(selfNodeId ?? "");
  const [confirmNodeId, setConfirmNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editState, setEditState] = useState<FormState | null>(null);
  const [isSavingEdit, startEditTransition] = useTransition();

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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<OrgChartType<ChartNode> | null>(null);
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const formattedNodes = useMemo<ChartNode[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        parentId: node.parentId ?? null,
        name: node.name,
        department: node.department ?? undefined,
        roleTitle: node.roleTitle ?? undefined,
        description: node.description ?? undefined,
        photoUrl: node.photoUrl ?? undefined,
        userId: node.userId ?? undefined,
        linkedUserId: node.linkedUserId ?? undefined,
        createdById: node.createdById ?? undefined,
        nodeType: node.nodeType as NodeType,
      })),
    [nodes]
  );

  const chartNodes = useMemo<ChartNode[]>(() => {
    const roots = formattedNodes.filter((node) => !node.parentId);
    if (roots.length <= 1) return formattedNodes;

    const virtualRoot: ChartNode = {
      id: "__virtual_root__",
      parentId: null,
      name: "Org Root",
      roleTitle: "",
      department: "",
      description: "",
      photoUrl: "",
      nodeType: "DIVISION",
    };

    const rootIds = new Set(roots.map((r) => r.id));
    return [
      virtualRoot,
      ...formattedNodes.map((node) =>
        rootIds.has(node.id)
          ? {
              ...node,
              parentId: virtualRoot.id,
            }
          : node
      ),
    ];
  }, [formattedNodes]);

  const personNodes = useMemo(() => formattedNodes.filter((node) => node.nodeType === "PERSON"), [formattedNodes]);
  const nodeById = useMemo(() => new Map(formattedNodes.map((n) => [n.id, n])), [formattedNodes]);

  const isDescendant = (candidateParentId: string | null | undefined, nodeId: string) => {
    if (!candidateParentId) return false;
    let current: string | null | undefined = candidateParentId;
    let safety = 0;
    while (current) {
      if (current === nodeId) return true;
      const parent = nodeById.get(current);
      current = parent?.parentId ?? null;
      if (safety++ > 256) return true;
    }
    return false;
  };

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const { OrgChart } = await import("d3-org-chart");
        if (cancelled || !containerRef.current || chartRef.current) return;

        const chart = new OrgChart<ChartNode>();
        chartRef.current = chart;

        chart
          .container(containerRef.current)
          .nodeHeight(() => 180)
          .nodeWidth(() => 280)
          .childrenMargin(() => 60)
          .initialZoom(0.65)
          .compact(false)
          .pagingStep(() => Number.MAX_SAFE_INTEGER)
          .minPagingVisibleNodes(() => Number.MAX_SAFE_INTEGER)
          .onNodeClick((node) => {
            const id = (node.data as ChartNode).id;
            if (id === "__virtual_root__") return; // ignore synthetic root
            setSelectedNodeId(id);
            setEditState(null);
          })
          .nodeContent((d) => {
            const data = d.data as ChartNode;
            const isDivision = data.nodeType === "DIVISION";
            const localeValue = localeRef.current ?? "";
            const profileHref = !isDivision && data.userId ? `/${localeValue}/users/${encodeURIComponent(data.userId)}` : null;
            const nameMarkup = profileHref
              ? `<a class="org-chart-node-link" data-user-id="${escapeHtml(data.userId ?? "")}" href="${profileHref}">${escapeHtml(data.name)}</a>`
              : escapeHtml(data.name);
            const photo = data.photoUrl || DEFAULT_NODE_PHOTO;
            const badgeBackground = isDivision
              ? "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.05))"
              : "hsl(var(--surface-2))";
            const badgeBorder = isDivision ? "rgba(255,255,255,0.55)" : "hsl(var(--border))";
            return `
          <div style="width:260px;height:180px;display:flex;flex-direction:column;justify-content:center;gap:12px;border-radius:18px;border:1px solid hsl(var(--border));padding:16px;background=${
            isDivision ? "hsl(var(--primary))" : "hsl(var(--surface))"
          };color=${isDivision ? "hsl(var(--bg))" : "hsl(var(--text))"};box-shadow:0 18px 35px rgba(15,23,42,0.18);font-family:'Work Sans',sans-serif;overflow:hidden;">
            <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
              <div style="width:56px;height:56px;border-radius:999px;background:${badgeBackground};border:1px solid ${badgeBorder};overflow:hidden;flex-shrink:0;box-shadow:0 10px 25px rgba(15,23,42,0.12);">
                <img src="${photo}" alt="${escapeHtml(data.name)}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
              <div style="min-width:0;">
                <div style="font-size:16px;font-weight:700;line-height:1.2;word-break:break-word;">${nameMarkup}</div>
                <div style="font-size:13px;opacity:0.85;margin-top:2px;line-height:1.35;word-break:break-word;">${escapeHtml(
                  data.roleTitle ?? data.department ?? ""
                )}</div>
              </div>
            </div>
            ${
              data.department
                ? `<div style="margin-top:10px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;line-height:1.2;word-break:break-word;">${escapeHtml(
                    data.department
                  )}</div>`
                : ""
            }
          </div>
        `;
          });

        chart
          .data(chartNodes)
          .render()
          .expandAll()
          .fit({ animate: false });
      } catch (error) {
        console.error("Failed to load org chart library", error);
      }
    })();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        const destroy = (chartRef.current as { destroy?: () => void }).destroy;
        if (typeof destroy === "function") destroy();
      }
      chartRef.current = null;
    };
  }, [chartNodes]);

  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current
      .data(chartNodes)
      .render()
      .expandAll()
      .fit({ animate: false });
  }, [chartNodes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNameClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>(".org-chart-node-link");
      if (!anchor) return;

      event.preventDefault();
      event.stopPropagation();

      const userId = anchor.dataset.userId;
      if (!userId) return;

      const localeValue = localeRef.current ?? "";
      router.push(`/${localeValue}/users/${encodeURIComponent(userId)}`);
    };

    const listenerOptions: AddEventListenerOptions & EventListenerOptions = { capture: true };

    container.addEventListener("click", handleNameClick, listenerOptions);
    return () => container.removeEventListener("click", handleNameClick, listenerOptions);
  }, [router]);

  const handleChange = (
    key: keyof FormState
  ) =>
  (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const resetForm = () =>
    setFormState({
      name: "",
      roleTitle: "",
      department: "",
      description: "",
      parentId: divisions[0]?.id ?? "",
      photoUrl: "",
    });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSelfRegister) return;

    const validation = nodeSchema.safeParse(formState);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? copy.error);
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/org-chart?locale=${encodeURIComponent(locale)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formState.name,
            roleTitle: formState.roleTitle,
            department: formState.department || undefined,
            description: formState.description || undefined,
            parentId: formState.parentId || undefined,
            photoUrl: formState.photoUrl || DEFAULT_NODE_PHOTO,
            linkedUserId: currentUserId,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          toast.error(errorBody.message ?? copy.error);
          return;
        }

        const created: OrgChartEntry = await response.json();
        setNodes((prev) => [...prev, created]);
        setHasRegistered(true);
        setSelfNodeIdState(created.id);
        setDeleteTargetId(created.id);
        resetForm();
        router.refresh();
        toast.success(copy.success);
      } catch (error) {
        console.error(error);
        toast.error(copy.error);
      }
    });
  };

  const confirmDelete = (nodeId: string) => {
    if (!nodeId) return;
    setConfirmNodeId(nodeId);
  };

  const handleDelete = () => {
    if (!confirmNodeId) return;

    startDeleteTransition(async () => {
      try {
        const response = await fetch(
          `/api/org-chart?id=${encodeURIComponent(confirmNodeId)}&locale=${encodeURIComponent(locale)}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          toast.error(errorBody.message ?? copy.deleteError);
          return;
        }

        setNodes((prev) => prev.filter((node) => node.id !== confirmNodeId));
        if (selfNodeIdState === confirmNodeId) {
          setHasRegistered(false);
          setSelfNodeIdState("");
          setDeleteTargetId("");
        }
        if (deleteTargetId === confirmNodeId) {
          setDeleteTargetId("");
        }
        setConfirmNodeId(null);
        router.refresh();
        toast.success(copy.deleteSuccess);
      } catch (error) {
        console.error(error);
        toast.error(copy.deleteError);
      }
    });
  };

  const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) : null;
  const canEditSelected = Boolean(
    selectedNode && (isAdmin || selectedNode.createdById === currentUserId || selectedNode.userId === currentUserId)
  );

  const startEdit = () => {
    if (!selectedNode || !canEditSelected) return;
    setEditState({
      name: selectedNode.name,
      roleTitle: selectedNode.roleTitle ?? "",
      department: selectedNode.department ?? "",
      description: selectedNode.description ?? "",
      parentId: selectedNode.parentId ?? "",
      photoUrl: selectedNode.photoUrl ?? "",
    });
  };

  const saveEdit = () => {
    if (!selectedNode || !editState) return;
    if (isDescendant(editState.parentId, selectedNode.id)) {
      toast.error(copy.cycleError ?? "Invalid parent selection");
      return;
    }
    const validation = nodeSchema.safeParse(editState);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? copy.error);
      return;
    }

    startEditTransition(async () => {
      try {
        const response = await fetch(`/api/org-chart?locale=${encodeURIComponent(locale)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId: selectedNode.id,
            ...editState,
            parentId: editState.parentId || null,
            photoUrl: editState.photoUrl || DEFAULT_NODE_PHOTO,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          toast.error(errorBody.message ?? copy.error);
          return;
        }
        const updated: OrgChartEntry = await response.json();
        setNodes((prev) => prev.map((node) => (node.id === updated.id ? updated : node)));
        setEditState(null);
        toast.success(copy.success);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error(copy.error);
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <style
        dangerouslySetInnerHTML={{
          __html:
            ".org-chart-node-link{color:inherit;text-decoration:none;border-bottom:1px solid transparent;transition:color 0.2s ease,border-color 0.2s ease;} .org-chart-node-link:hover{color:hsl(var(--primary));border-color:hsl(var(--primary));}",
        }}
      />
      <div className="rounded-2xl border border-border bg-[hsl(var(--bg))] p-6 shadow-lg dark:bg-surface">
        <h2 className="text-2xl font-semibold text-text">{copy.createTitle ?? copy.addYourselfHeading}</h2>
        {!canSelfRegister && <p className="mt-3 text-sm text-muted">{copy.loginPrompt}</p>}
        {canSelfRegister && hasRegistered && <p className="mt-3 text-sm text-success">{copy.alreadyRegistered}</p>}
        {canSelfRegister && (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-text">
              {copy.nameLabel ?? copy.addYourselfHeading}
              <input
                type="text"
                value={formState.name}
                onChange={handleChange("name")}
                className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-text">
              {copy.functionLabel}
              <input
                type="text"
                value={formState.roleTitle}
                onChange={handleChange("roleTitle")}
                placeholder={copy.functionPlaceholder}
                className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-text">
              {copy.parentLabel}
              <select
                value={formState.parentId}
                onChange={(event) => setFormState((prev) => ({ ...prev, parentId: event.target.value }))}
                className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{copy.parentNone ?? "No parent (top level)"}</option>
                {formattedNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} · {node.roleTitle ?? node.department ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-text">
              {copy.departmentLabel}
              <input
                type="text"
                value={formState.department}
                onChange={handleChange("department")}
                placeholder={copy.departmentPlaceholder}
                className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="md:col-span-2 flex flex-col text-sm font-medium text-text">
              {copy.descriptionLabel ?? "Description"}
              <textarea
                value={formState.description}
                onChange={handleChange("description")}
                placeholder={copy.descriptionPlaceholder ?? "Optional context"}
                maxLength={500}
                rows={3}
                className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium text-text">
              <span>{copy.photoLabel ?? "Photo"}</span>
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border bg-surface-2">
                  <Image
                    src={formState.photoUrl || DEFAULT_NODE_PHOTO}
                    alt="preview"
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <CldUploadWidget
                  uploadPreset="ChangeUserProfilePicture"
                  signatureEndpoint="/api/auth/sign-cloudinary-params"
                  onSuccess={(result: CloudinaryUploadWidgetResults | undefined) => {
                    const info = result?.info;
                    if (info && typeof info === "object" && "secure_url" in info && typeof info.secure_url === "string") {
                      setFormState((prev) => ({ ...prev, photoUrl: info.secure_url }));
                    }
                  }}
                >
                  {({ open }) => (
                    <Button type="button" variant="secondary" onClick={() => open()}>
                      {copy.uploadLabel ?? "Upload"}
                    </Button>
                  )}
                </CldUploadWidget>
              </div>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full" disabled={isPending} isLoading={isPending}>
                {copy.submitLabel}
              </Button>
            </div>
          </form>
        )}
      </div>

      {(selfNodeIdState || isAdmin) && (
        <div className="rounded-2xl border border-border bg-[hsl(var(--bg))] p-6 shadow-lg dark:bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-text">{copy.deleteHeading}</h3>
            {selfNodeIdState && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => confirmDelete(selfNodeIdState)}
                isLoading={deletePending && deleteTargetId === selfNodeIdState}
              >
                {copy.deleteSelfLabel}
              </Button>
            )}
          </div>
          {isAdmin && (
            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
              <label className="flex w-full flex-col text-sm font-medium text-text md:max-w-sm">
                {copy.deleteAdminLabel}
                <select
                  className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={deleteTargetId}
                  onChange={(event) => setDeleteTargetId(event.target.value)}
                >
                  <option value="">{copy.deleteSelectPlaceholder}</option>
                  {personNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} {node.userId ? `(${node.userId.slice(-4)})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="destructive"
                size="sm"
                disabled={!deleteTargetId}
                onClick={() => confirmDelete(deleteTargetId)}
                isLoading={deletePending && !!deleteTargetId}
              >
                {copy.deleteAdminLabel}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-[hsl(var(--bg))] p-6 shadow-inner dark:bg-surface">
        <div ref={containerRef} className="min-h-[560px] w-full" />
      </div>

      {selectedNode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-[hsl(var(--bg))] p-6 shadow-2xl dark:bg-surface">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-muted">{copy.viewDetails ?? "Node"}</p>
                <h3 className="text-xl font-semibold text-text">{selectedNode.name}</h3>
                <p className="text-sm text-muted">{selectedNode.roleTitle}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNodeId(null)}>
                {copy.cancelLabel ?? cancelLabel}
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-surface-2">
                <Image
                  src={selectedNode.photoUrl || DEFAULT_NODE_PHOTO}
                  alt={selectedNode.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="text-sm text-muted">
                {selectedNode.description || selectedNode.department}
              </div>
            </div>

            {canEditSelected && !editState && (
              <div className="mt-4 flex gap-3">
                <Button size="sm" onClick={startEdit}>
                  {copy.editLabel ?? "Edit"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete(selectedNode.id)}
                  isLoading={deletePending && deleteTargetId === selectedNode.id}
                >
                  {deleteLabel}
                </Button>
              </div>
            )}

            {editState && (
              <div className="mt-4 space-y-3">
                <label className="flex flex-col text-sm font-medium text-text">
                  {copy.nameLabel ?? "Name"}
                  <input
                    type="text"
                    value={editState.name}
                    onChange={(e) => setEditState((prev) => prev && { ...prev, name: e.target.value })}
                    className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-text">
                  {copy.functionLabel}
                  <input
                    type="text"
                    value={editState.roleTitle}
                    onChange={(e) => setEditState((prev) => prev && { ...prev, roleTitle: e.target.value })}
                    className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-text">
                  {copy.parentLabel}
                  <select
                    value={editState.parentId}
                    onChange={(e) => setEditState((prev) => prev && { ...prev, parentId: e.target.value })}
                    className="mt-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">{copy.parentNone ?? "No parent"}</option>
                    {formattedNodes
                      .filter((n) => n.id !== selectedNode.id)
                      .map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name} · {node.roleTitle ?? node.department ?? ""}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium text-text">
                  {copy.descriptionLabel ?? "Description"}
                  <textarea
                    value={editState.description}
                    maxLength={500}
                    onChange={(e) => setEditState((prev) => prev && { ...prev, description: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border bg-surface-2">
                    <Image
                      src={editState.photoUrl || DEFAULT_NODE_PHOTO}
                      alt="preview"
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <CldUploadWidget
                    uploadPreset="ChangeUserProfilePicture"
                    signatureEndpoint="/api/auth/sign-cloudinary-params"
                    onSuccess={(result: CloudinaryUploadWidgetResults | undefined) => {
                      const info = result?.info;
                      if (info && typeof info === "object" && "secure_url" in info && typeof info.secure_url === "string") {
                        setEditState((prev) => (prev ? { ...prev, photoUrl: info.secure_url } : prev));
                      }
                    }}
                  >
                    {({ open }) => (
                      <Button type="button" variant="secondary" onClick={() => open()}>
                        {copy.uploadLabel ?? "Upload"}
                      </Button>
                    )}
                  </CldUploadWidget>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setEditState(null)}>
                    {copy.cancelLabel ?? cancelLabel}
                  </Button>
                  <Button size="sm" onClick={saveEdit} isLoading={isSavingEdit}>
                    {copy.saveLabel ?? copy.submitLabel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmNodeId)}
        title={copy.deleteHeading}
        description={copy.deleteConfirm}
        confirmLabel={deleteLabel}
        cancelLabel={cancelLabel}
        onCancel={() => setConfirmNodeId(null)}
        onConfirm={handleDelete}
        isConfirming={deletePending}
      />
    </div>
  );
}
