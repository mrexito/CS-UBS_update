"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import type { QuillOptions } from "quill";
import "quill/dist/quill.snow.css"; // Quill snow styles
import type { BlogFormState } from "./actions";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";





type QuillConstructor = typeof import("quill")["default"];
type QuillInstance = InstanceType<QuillConstructor>;
type ImageResizeModule = new (quill: QuillInstance, options: unknown) => unknown;

let quillInitPromise: Promise<QuillConstructor> | null = null;

async function loadQuillWithImageResize() {
	if (quillInitPromise) return quillInitPromise;

	quillInitPromise = (async () => {
		const Quill = (await import("quill")).default;
		if (typeof window !== "undefined") {
			const win = window as typeof window & {
				Quill?: QuillConstructor;
				__imageResizeRegistered?: boolean;
			};
			win.Quill = win.Quill || Quill;
		}

		const imageResizeImport = (Quill as QuillConstructor & { imports?: Record<string, unknown> }).imports?.["modules/imageResize"] as
			| { __fromApp?: boolean }
			| undefined;
		const alreadyRegistered =
			typeof window !== "undefined" && (window as typeof window & { __imageResizeRegistered?: boolean }).__imageResizeRegistered
				? true
				: !!imageResizeImport?.__fromApp;

		if (!alreadyRegistered) {
			const ImageResize = (await import("../../../lib/quill-image-resize-no-toolbar")).default as ImageResizeModule;
			Quill.register("modules/imageResize", ImageResize);
			const mod = (Quill as QuillConstructor & { imports?: Record<string, unknown> }).imports?.["modules/imageResize"] as
				| { __fromApp?: boolean }
				| undefined;
			if (mod) mod.__fromApp = true;
			if (typeof window !== "undefined") {
				(window as typeof window & { __imageResizeRegistered?: boolean }).__imageResizeRegistered = true;
			}
		}

		return Quill;
	})();

	return quillInitPromise;
}

type Props = {
	action: (prevState: BlogFormState, formData: FormData) => Promise<BlogFormState>;
	initialTitle?: string;
	initialContent?: string;
	isEdit?: boolean;
};

const editorModules: QuillOptions["modules"] = {
	toolbar: [
		[{ header: [1, 2, 3, false] }],
		["bold", "italic", "underline", "strike", "blockquote"],
		[{ list: "ordered" }, { list: "bullet" }],
		[{ align: [] }],
		["link", "image"],
		["clean"],
	],
	imageResize: {
		modules: ["Resize", "DisplaySize"],
	},
};


const editorFormats = ["header", "bold", "italic", "underline", "strike", "blockquote", "list", "align", "link", "image"];

function QuillEditor({ value, onChange }: { value: string; onChange: (val: string) => void }) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const quillRef = useRef<QuillInstance | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [uploading, setUploading] = useState(false);
	const initialValueRef = useRef(value);
	const t = useTranslations("blogs");

	async function uploadImage(file: File) {
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/blogs/upload", { method: "POST", body: fd });
			const data = (await res.json()) as { url?: string; error?: string };
			if (!res.ok || !data.url) {
				throw new Error(data.error || t("uploadFehlgeschlagen"));
			}

			const quill = quillRef.current;
			if (quill) {
				const range = quill.getSelection(true);
				const insertIndex = range ? range.index : quill.getLength();
				quill.insertEmbed(insertIndex, "image", data.url, "user");
				quill.setSelection(insertIndex + 1);
				onChange(quill.root.innerHTML);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : t("errorBildUpload");
			console.error(err);
			toast.error(message);
		} finally {
			setUploading(false);
		}
	}

	const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		event.target.value = "";
		if (!file) return;
		await uploadImage(file);
	};
	

	useEffect(() => {
		let mounted = true;
		const containerEl = containerRef.current;
		(async () => {
			const Quill = await loadQuillWithImageResize();
			if (!mounted || !containerEl) return;

			quillRef.current = new Quill(containerEl, {
				theme: "snow",
				modules: editorModules,
				formats: editorFormats,
				placeholder: t("wasMöchtestDuTeilen"),
			});

			const quillInstance = quillRef.current;
			if (!quillInstance) return;

			const toolbar = quillInstance.getModule("toolbar") as
				| { addHandler: (name: string, handler: () => void) => void }
				| undefined;
			if (toolbar) {
				toolbar.addHandler("image", () => {
					fileInputRef.current?.click();
				});
			}

			quillInstance.root.innerHTML = initialValueRef.current || "";
			quillInstance.on("text-change", () => {
				onChange(quillInstance.root.innerHTML);
			});
		})();

		return () => {
			mounted = false;
			const instance = quillRef.current;
			if (instance) {
				instance.off("text-change");
				instance.disable();
			}
			quillRef.current = null;
			if (containerEl) {
				containerEl.innerHTML = "";
			}
		};
	}, [onChange, t]);

	useEffect(() => {
		if (!quillRef.current) return;
		const currentHtml = quillRef.current.root.innerHTML;
		if (value !== currentHtml) {
			quillRef.current.root.innerHTML = value || "";
		}
	}, [value]);

	return (
		<>
			<div ref={containerRef} className="h-full" />
			<input
				type="file"
				accept="image/*"
				ref={fileInputRef}
				onChange={handleFileChange}
				className="hidden"
			/>
			{uploading && <p className="mt-1 text-xs text-muted">{t("imageUploading")}</p>}
		</>
	);
}

function SubmitButton() {
	const { pending } = useFormStatus();
	const t = useTranslations("blogs");
	const d = useTranslations("buttons");
	return (
		<Button type="submit" isLoading={pending} disabled={pending} className="w-full sm:w-auto">
			{pending ? t("wirdGespeichertLoading") : d("speichern")}
		</Button>
	);
}

export default function BlogFormClient({ action, initialTitle = "", initialContent = "", isEdit = false }: Props) {
	const formRef = useRef<HTMLFormElement | null>(null);
	const [content, setContent] = useState(initialContent);
	const [state, formAction] = useActionState<BlogFormState, FormData>(action, {
		error: null,
		success: null,
		redirectPath: null,
	});
	const router = useRouter();
	const t = useTranslations("blogs");

	useEffect(() => {
		if (state?.error) {
			toast.error(state.error);
		}
		if (state?.success) {
			toast.success(state.success);
		}
	}, [state?.error, state?.success]);

	useEffect(() => {
		if (state?.redirectPath) {
			router.push(state.redirectPath);
			return;
		}
		if (!state?.success || isEdit) return;
		if (formRef.current) {
			formRef.current.reset();
		}
		setContent("");
	}, [state?.success, state?.redirectPath, isEdit, router]);

	return (
		<form ref={formRef} action={formAction} className="surface-card space-y-5 border border-border/70 shadow-sm">
			<Input name="title" defaultValue={initialTitle} placeholder={t("titlePlaceholder")} label={t("title")} />
			<div className="space-y-2">
				<label className="block text-sm font-medium text-text">{t("inhalt")}</label>
				<input type="hidden" name="content" value={content} />
				<div className="min-h-[320px] rounded-2xl border border-border/70 bg-surface p-5 shadow-sm">
					<QuillEditor value={content} onChange={setContent} />
				</div>
			</div>

			<SubmitButton />
		</form>
	);
}
