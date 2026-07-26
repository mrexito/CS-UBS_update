declare module "d3-org-chart" {
  type Accessor<T> = (data?: unknown) => T;
  type NodeRenderer<TNode> = (node: { data: TNode }) => string;

  export class OrgChart<TNode = unknown> {
    constructor();
    container(target: string | HTMLElement | null): this;
    nodeHeight(getter: Accessor<number>): this;
    nodeWidth(getter: Accessor<number>): this;
    childrenMargin(getter: Accessor<number>): this;
    initialZoom(zoom: number): this;
    compact(isCompact: boolean): this;
    nodeContent(renderer: NodeRenderer<TNode>): this;
    pagingStep(getter: Accessor<number>): this;
    minPagingVisibleNodes(getter: Accessor<number>): this;
    onNodeClick(handler: (node: { data: TNode }) => void): this;
    data(nodes: TNode[]): this;
    expandAll(): this;
    fit(options?: { animate?: boolean; nodes?: unknown[]; scale?: boolean }): this;
    render(): this;
    destroy?(): void;
  }
}
