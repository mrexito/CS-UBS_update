"use server";

import { auth } from "@/app/[locale]/auth";
import { prisma } from "@/lib/prisma";
import { BLOG_LIST_TAG, blogDetailTag, userBlogsTag } from "@/lib/cacheTags";
import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";

export type DeleteUserResult = {
  error?: string | null;
  success?: string | null;
  redirectTo?: string | null;
  shouldSignOut?: boolean;
};

export async function deleteUserAction(locale: string, userId: string): Promise<DeleteUserResult> {
  const t = await getTranslations("user");
  const session = await auth();
  if (!session?.user?.id) {
    return { error: t("keineBerechtigung") };
  }

  const isSelf = session.user.id === userId;
  const isAdmin = session.user.role === "ADMIN";
  if (!isSelf && !isAdmin) {
    return { error: t("keineBerechtigung") };
  }

  try {
    const blogs = await prisma.blogPost.findMany({ where: { userId }, select: { id: true } });
    const blogIds = blogs.map((blog) => blog.id);

    await prisma.$transaction([
      prisma.blogReaction.deleteMany({ where: { OR: [{ userId }, { postId: { in: blogIds } }] } }),
      prisma.blogComment.deleteMany({ where: { OR: [{ userId }, { postId: { in: blogIds } }] } }),
      prisma.blogPost.deleteMany({ where: { id: { in: blogIds } } }),
      prisma.orgChart.deleteMany({ where: { userId } }),
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    const localePrefix = locale ? `/${locale}` : "";

    revalidateTag(BLOG_LIST_TAG);
    blogIds.forEach((id) => revalidateTag(blogDetailTag(id)));
    revalidateTag(userBlogsTag(userId));
    revalidatePath(`${localePrefix}/blogs`);
    revalidatePath(`${localePrefix}/users`);

    return {
      success: t("accountDeleted"),
      redirectTo: localePrefix || "/",
      shouldSignOut: isSelf,
    };
  } catch (error) {
    console.error("deleteUserAction error", error);
    return { error: t("accountDeleteFailed") };
  }
}
