import { prisma } from "@/lib/prisma";

type ReactionTotals = { like: number; dislike: number };

function emptyTotals(): ReactionTotals {
  return { like: 0, dislike: 0 };
}

export async function getReactionCountMap(postIds: string[]): Promise<Map<string, ReactionTotals>> {
  const map = new Map<string, ReactionTotals>();
  if (postIds.length === 0) {
    return map;
  }

  postIds.forEach((id) => {
    map.set(id, emptyTotals());
  });

  const grouped = await prisma.blogReaction.groupBy({
    by: ["postId", "type"],
    where: { postId: { in: postIds } },
    _count: { _all: true },
  });

  for (const row of grouped) {
    const totals = map.get(row.postId);
    if (!totals) {
      continue;
    }
    if (row.type === "LIKE") {
      totals.like = row._count._all;
    } else if (row.type === "DISLIKE") {
      totals.dislike = row._count._all;
    }
  }

  return map;
}

export async function getReactionTotalsForPost(postId: string): Promise<ReactionTotals> {
  const map = await getReactionCountMap([postId]);
  return map.get(postId) ?? emptyTotals();
}
