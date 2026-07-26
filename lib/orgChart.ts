import { OrgNodeType, type OrgChart } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { ORG_CHART_REVALIDATE_SECONDS, ORG_CHART_TAG } from "./cacheTags";

export type OrgChartEntry = OrgChart;

type SeedNode = {
  key: string;
  parentKey?: string;
  name: string;
  functionLabel: string;
  department: string;
  description?: string;
};

const CREDIT_SUISSE_DIVISIONS: SeedNode[] = [
  {
    key: "credit-suisse-group",
    name: "Credit Suisse Group",
    functionLabel: "Executive Board",
    department: "Group Headquarters",
    description: "Central leadership team",
  },
  {
    key: "global-wealth",
    parentKey: "credit-suisse-group",
    name: "Global Wealth Management",
    functionLabel: "Division",
    department: "Wealth Management",
    description: "Advisory for ultra-high-net-worth clients",
  },
  {
    key: "swiss-bank",
    parentKey: "credit-suisse-group",
    name: "Swiss Bank",
    functionLabel: "Division",
    department: "Retail & SME",
    description: "Domestic banking franchise",
  },
  {
    key: "investment-bank",
    parentKey: "credit-suisse-group",
    name: "Investment Bank",
    functionLabel: "Division",
    department: "Markets & Advisory",
    description: "Capital markets and advisory services",
  },
  {
    key: "asset-management",
    parentKey: "credit-suisse-group",
    name: "Asset Management",
    functionLabel: "Division",
    department: "Investment Products",
    description: "Active and alternative investment strategies",
  },
  {
    key: "corporate-functions",
    parentKey: "credit-suisse-group",
    name: "Corporate Functions",
    functionLabel: "Division",
    department: "Finance, HR & Operations",
    description: "Enterprise services and governance",
  },
];

let seedPromise: Promise<void> | null = null;

async function seedOrgChartOnceInternal() {
  const seedNames = CREDIT_SUISSE_DIVISIONS.map((node) => node.name);
  const nameByKey = new Map(CREDIT_SUISSE_DIVISIONS.map((node) => [node.key, node.name]));
  const existingDivisions = await prisma.orgChart.findMany({
    where: {
      nodeType: OrgNodeType.DIVISION,
      name: { in: seedNames },
    },
    select: { id: true, name: true },
  });

  const idsByName = new Map(existingDivisions.map((division) => [division.name, division.id]));
  const idsByKey = new Map<string, string>();

  for (const node of CREDIT_SUISSE_DIVISIONS) {
    const parentId = node.parentKey
      ? idsByKey.get(node.parentKey) ?? idsByName.get(nameByKey.get(node.parentKey) ?? "")
      : undefined;
    const existingId = idsByName.get(node.name);

    if (existingId) {
      await prisma.orgChart.update({
        where: { id: existingId },
        data: {
          parentId,
          roleTitle: node.functionLabel,
          department: node.department,
          description: node.description,
          nodeType: OrgNodeType.DIVISION,
        },
      });
      idsByKey.set(node.key, existingId);
      continue;
    }

    const created = await prisma.orgChart.create({
      data: {
        name: node.name,
        roleTitle: node.functionLabel,
        department: node.department,
        description: node.description,
        parentId,
        nodeType: OrgNodeType.DIVISION,
        createdById: "000000000000000000000000",
      },
    });

    idsByKey.set(node.key, created.id);
  }
}

export async function ensureOrgChartSeed() {
  if (seedPromise) return seedPromise;
  seedPromise = seedOrgChartOnceInternal().catch((error) => {
    seedPromise = null;
    throw error;
  });
  return seedPromise;
}

const getOrgChartEntriesUncached = async () => {
  await ensureOrgChartSeed();
  return prisma.orgChart.findMany({
    orderBy: [{ createdAt: "asc" }],
  });
};

export const getOrgChartEntries = unstable_cache(
  getOrgChartEntriesUncached,
  ["org-chart:list"],
  {
    tags: [ORG_CHART_TAG],
    revalidate: ORG_CHART_REVALIDATE_SECONDS,
  }
);

export async function assertNoCycle(candidateParentId: string | null, nodeId: string) {
  if (!candidateParentId) return;
  if (candidateParentId === nodeId) {
    throw new Error("CYCLE_DETECTED");
  }

  let currentParentId: string | null | undefined = candidateParentId;
  const safetyLimit = 256;
  let steps = 0;
  while (currentParentId) {
    if (steps++ > safetyLimit) {
      throw new Error("CYCLE_DETECTED");
    }
    if (currentParentId === nodeId) {
      throw new Error("CYCLE_DETECTED");
    }
    const parent: { parentId: string | null } | null = await prisma.orgChart.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });
    if (!parent) break;
    currentParentId = parent.parentId ?? null;
  }
}
