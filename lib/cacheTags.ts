export const BLOG_LIST_TAG = "blogs";
export const BLOG_REVALIDATE_SECONDS = 30;

export const blogDetailTag = (postId: string) => `blog:${postId}`;
export const userBlogsTag = (userId: string) => `user:${userId}:blogs`;

export const ORG_CHART_TAG = "org-chart";
export const ORG_CHART_REVALIDATE_SECONDS = 300;
