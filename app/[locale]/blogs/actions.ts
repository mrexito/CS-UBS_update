"use server";

import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeBlogContent } from "@/lib/sanitizeBlogContent";
import type { Prisma, ReactionType } from "@prisma/client";
import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { BLOG_LIST_TAG, blogDetailTag, userBlogsTag } from "@/lib/cacheTags";

export type BlogFormState = {
	error?: string | null;
	success?: string | null;
	redirectPath?: string | null;
};

export type CommentFormState = {
	error?: string | null;
	success?: string | null;
};

export type DeleteActionState = {
	error?: string | null;
	success?: string | null;
	redirectPath?: string | null;
};

export type ReactionActionResult = {
	error?: string | null;
	success?: string | null;
	likeCount?: number;
	dislikeCount?: number;
	userReaction?: ReactionType | null;
};

const commentSchema = z.object({
	content: z
		.string()
		.transform((value) => value.trim())
		.refine((value) => value.length > 0, { message: "COMMENT_REQUIRED" })
		.refine((value) => value.length >= 3, { message: "COMMENT_TOO_SHORT" })
		.refine((value) => value.length <= 500, { message: "COMMENT_TOO_LONG" }),
});

function extractImages(html: string): string[] {
	const matches = Array.from(html.matchAll(/<img [^>]*src=["']([^"']+)["'][^>]*>/gi));
	return matches.map((m) => m[1]).slice(0, 20); // simple guard
}

const MAX_EXCERPT_LENGTH = 280;

function buildExcerptFromHtml(html: string): string {
	const sanitized = sanitizeBlogContent(html);
	const text = sanitized
		.replace(/<[^>]+>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	return text.length > MAX_EXCERPT_LENGTH ? `${text.slice(0, MAX_EXCERPT_LENGTH)}…` : text;
}

export async function createBlogAction(
	locale: string,
	_prevState: BlogFormState,
	formData: FormData
): Promise<BlogFormState> {
	const session = await auth();
	const t = await getTranslations("blogs");
	if (!session?.user?.id) {
		return { error: t("bitteAnmelden") };
	}

	const title = String(formData.get("title") ?? "").trim();
	const rawContent = String(formData.get("content") ?? "").trim();
	const content = sanitizeBlogContent(rawContent);
	const excerpt = buildExcerptFromHtml(content);
	const images = extractImages(content);

	if (!title || !content) {
		return { error: t("titelUndInhaltAusfüllen") };
	}

	try {
		const data: Prisma.BlogPostCreateInput = {
			title,
			content,
			excerpt,
			images,
			user: { connect: { id: session.user.id } },
		};

		const created = await prisma.blogPost.create({ data });

		await revalidateBlogRoutes(locale, created.id, session.user.id);
		return { success: t("blogErstellt"), redirectPath: `/${locale}/blogs/${created.id}` };
	} catch (err) {
		console.error("createBlogAction error", err);
		return { error: t("blogKonnteNichtErstelltWerden") };
	}
}

export async function updateBlogAction(
	locale: string,
	blogId: string,
	_prevState: BlogFormState,
	formData: FormData
): Promise<BlogFormState> {
	const session = await auth();
	const t = await getTranslations("blogs");
	if (!session?.user?.id) {
		return { error: t("bitteAnmeldenBearbeiten") };
	}

	const title = String(formData.get("title") ?? "").trim();
	const rawContent = String(formData.get("content") ?? "").trim();
	const content = sanitizeBlogContent(rawContent);
	const excerpt = buildExcerptFromHtml(content);
	const images = extractImages(content);

	if (!title || !content) {
		return { error: t("titelUndInhaltAusfüllen") };
	}

	try {
		const blog = await prisma.blogPost.findUnique({ where: { id: blogId } });
		if (!blog) {
			return { error: t("blogNichtGefunden") };
		}
		if (blog.userId !== session.user.id) {
			return { error: t("blogLoeschenKeinZugriff") };
		}

		const data: Prisma.BlogPostUpdateInput = {
			title,
			content,
			excerpt,
			images,
		};
		await prisma.blogPost.update({
			where: { id: blogId },
			data,
		});

		await revalidateBlogRoutes(locale, blogId, blog.userId);
		return { success: t("blogAktualisiert"), redirectPath: `/${locale}/blogs/${blogId}` };
	} catch (err) {
		console.error("updateBlogAction error", err);
		return { error: t("blogKonnteNichtAktualisiertWerden") };
	}
}

export async function deleteBlogAction(locale: string, blogId: string): Promise<DeleteActionState> {
	const session = await auth();
	const t = await getTranslations("blogs");
	if (!session?.user?.id) {
		return { error: t("bitteAnmelden") };
	}

	const blog = await prisma.blogPost.findUnique({
		where: { id: blogId },
		select: { id: true, userId: true },
	});

	if (!blog) {
		return { error: t("blogNichtGefunden") };
	}

	const isOwner = blog.userId === session.user.id;
	const canModerate = session.user.role === "ADMIN" || session.user.role === "EDITOR";
	if (!isOwner && !canModerate) {
		return { error: t("blogLoeschenKeinZugriff") };
	}

	try {
		await prisma.$transaction([
			prisma.blogReaction.deleteMany({ where: { postId: blogId } }),
			prisma.blogComment.deleteMany({ where: { postId: blogId } }),
			prisma.blogPost.delete({ where: { id: blogId } }),
		]);

		await revalidateBlogRoutes(locale, blogId, blog.userId);
		return { success: t("blogGeloescht"), redirectPath: `/${locale}/blogs` };
	} catch (error) {
		console.error("deleteBlogAction error", error);
		return { error: t("blogLoeschenFehlgeschlagen") };
	}
}

async function revalidateBlogRoutes(locale: string, postId: string, authorId: string) {
	revalidateTag(BLOG_LIST_TAG);
	revalidateTag(blogDetailTag(postId));
	if (authorId) {
		revalidateTag(userBlogsTag(authorId));
	}
	revalidatePath(`/${locale}/blogs`);
	revalidatePath(`/${locale}/blogs/${postId}`);
	revalidatePath(`/${locale}/users/${authorId}`);
}

export async function toggleReactionAction(
	locale: string,
	postId: string,
	type: ReactionType
): Promise<ReactionActionResult> {
	const session = await auth();
	const t = await getTranslations("blogs");
	if (!session?.user?.id) {
		return { error: t("bitteAnmelden") };
	}

	const post = await prisma.blogPost.findUnique({
		where: { id: postId },
		select: { id: true, userId: true },
	});

	if (!post) {
		return { error: t("blogNichtGefunden") };
	}

	try {
		const existing = await prisma.blogReaction.findUnique({
			where: { postId_userId: { postId, userId: session.user.id } },
		});

		let userReaction: ReactionType | null = null;

		if (!existing) {
			await prisma.$transaction([
				prisma.blogReaction.create({
					data: { postId, userId: session.user.id, type },
				}),
				prisma.blogPost.update({
					where: { id: postId },
					data: {
						likeCount: { increment: type === "LIKE" ? 1 : 0 },
						dislikeCount: { increment: type === "DISLIKE" ? 1 : 0 },
					},
				}),
			]);
			userReaction = type;
		} else if (existing.type === type) {
			await prisma.$transaction([
				prisma.blogReaction.delete({ where: { id: existing.id } }),
				prisma.blogPost.update({
					where: { id: postId },
					data: {
						likeCount: { decrement: type === "LIKE" ? 1 : 0 },
						dislikeCount: { decrement: type === "DISLIKE" ? 1 : 0 },
					},
				}),
			]);
			userReaction = null;
		} else {
			await prisma.$transaction([
				prisma.blogReaction.update({
					where: { id: existing.id },
					data: { type },
				}),
				prisma.blogPost.update({
					where: { id: postId },
					data: {
						likeCount: {
							increment: type === "LIKE" ? 1 : -1,
						},
						dislikeCount: {
							increment: type === "DISLIKE" ? 1 : -1,
						},
					},
				}),
			]);
			userReaction = type;
		}

		await revalidateBlogRoutes(locale, postId, post.userId);

		const counts = await prisma.blogPost.findUnique({
			where: { id: postId },
			select: { likeCount: true, dislikeCount: true },
		});

		return {
			success: t("reactionAktualisiert"),
			likeCount: counts?.likeCount ?? 0,
			dislikeCount: counts?.dislikeCount ?? 0,
			userReaction,
		};
	} catch (error) {
		console.error("toggleReactionAction error", error);
		return { error: t("reactionFehlgeschlagen") };
	}
}

export async function createCommentAction(
	locale: string,
	postId: string,
	_prev: CommentFormState,
	formData: FormData
): Promise<CommentFormState> {
	const session = await auth();
	const t = await getTranslations("blogs");
	if (!session?.user?.id) {
		return { error: t("bitteAnmelden") };
	}

	const parseResult = commentSchema.safeParse({ content: formData.get("content") ?? "" });
	if (!parseResult.success) {
		const issue = parseResult.error.issues[0]?.message;
		const messageMap: Record<string, string> = {
			COMMENT_REQUIRED: t("kommentarPflicht"),
			COMMENT_TOO_SHORT: t("kommentarZuKurz"),
			COMMENT_TOO_LONG: t("kommentarZuLang"),
		};
		return { error: issue ? messageMap[issue] ?? t("kommentarFehler") : t("kommentarFehler") };
	}

	const post = await prisma.blogPost.findUnique({
		where: { id: postId },
		select: { userId: true },
	});

	if (!post) {
		return { error: t("blogNichtGefunden") };
	}

	try {
		await prisma.$transaction([
			prisma.blogComment.create({
				data: {
					postId,
					userId: session.user.id,
					content: parseResult.data.content,
				},
			}),
			prisma.blogPost.update({
				where: { id: postId },
				data: { commentCount: { increment: 1 } },
			}),
		]);

		await revalidateBlogRoutes(locale, postId, post.userId);
		return { success: t("kommentarErstellt") };
	} catch (error) {
		console.error("createCommentAction error", error);
		return { error: t("kommentarFehler") };
	}
}

export async function deleteCommentAction(
	locale: string,
	postId: string,
	commentId: string
): Promise<CommentFormState> {
	const session = await auth();
	const t = await getTranslations("blogs");
	if (!session?.user?.id) {
		return { error: t("bitteAnmelden") };
	}

	const comment = await prisma.blogComment.findUnique({
		where: { id: commentId },
		include: { post: { select: { userId: true, id: true } } },
	});

	if (!comment || comment.postId !== postId || !comment.post) {
		return { error: t("kommentarFehler") };
	}

	const isAuthor = comment.userId === session.user.id;
	const isPostOwner = comment.post.userId === session.user.id;
	const isModerator = session.user.role === "ADMIN" || session.user.role === "EDITOR";
	if (!isAuthor && !isPostOwner && !isModerator) {
		return { error: t("kommentarKeineBerechtigung") };
	}

	try {
		await prisma.$transaction([
			prisma.blogComment.delete({ where: { id: commentId } }),
			prisma.blogPost.update({
				where: { id: postId },
				data: { commentCount: { decrement: 1 } },
			}),
		]);

		await revalidateBlogRoutes(locale, postId, comment.post.userId);
		return { success: t("kommentarGeloescht") };
	} catch (error) {
		console.error("deleteCommentAction error", error);
		return { error: t("kommentarLoeschenFehlgeschlagen") };
	}
}
