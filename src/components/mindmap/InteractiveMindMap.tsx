"use client";

import { forwardRef, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

export interface MindMapNodeData {
  label: string;
  detail?: string;
  children?: MindMapNodeData[];
}

export interface MindMapStructure {
  topic: string;
  children: MindMapNodeData[];
}

const BRANCH_COLORS = ["#0d9488", "#d97706", "#7c3aed", "#e11d48", "#0284c7", "#059669"];

const LEVEL_WIDTH = 260;
const LEAF_SPACING = 90;

type FlowNodeData = {
  label: string;
  detail?: string;
  color: string;
  hasChildren: boolean;
  collapsed: boolean;
  onToggleCollapse: (id: string) => void;
};

function buildLayout(structure: MindMapStructure) {
  const nodes: Node<FlowNodeData>[] = [];
  const edges: Edge[] = [];
  const parentOf: Record<string, string | null> = {};
  let nextLeafY = 0;

  function visit(
    item: MindMapNodeData,
    depth: number,
    id: string,
    parentId: string | null,
    color: string
  ): number {
    parentOf[id] = parentId;

    let y: number;
    if (item.children && item.children.length > 0) {
      const childYs = item.children.map((child, i) =>
        visit(child, depth + 1, `${id}-${i}`, id, color)
      );
      y = (Math.min(...childYs) + Math.max(...childYs)) / 2;
    } else {
      y = nextLeafY;
      nextLeafY += LEAF_SPACING;
    }

    nodes.push({
      id,
      type: "mindmap",
      position: { x: depth * LEVEL_WIDTH, y },
      data: {
        label: item.label,
        detail: item.detail,
        color,
        hasChildren: Boolean(item.children && item.children.length > 0),
        collapsed: false,
        onToggleCollapse: () => {},
      },
    });

    if (parentId) {
      edges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        style: { stroke: color, strokeWidth: 2 },
      });
    }

    return y;
  }

  const rootChildren = structure.children ?? [];
  const rootChildYs = rootChildren.map((child, i) =>
    visit(child, 1, `root-${i}`, "root", BRANCH_COLORS[i % BRANCH_COLORS.length])
  );
  const rootY =
    rootChildYs.length > 0
      ? (Math.min(...rootChildYs) + Math.max(...rootChildYs)) / 2
      : 0;

  nodes.unshift({
    id: "root",
    type: "mindmap",
    position: { x: 0, y: rootY },
    data: {
      label: structure.topic,
      color: "#171717",
      hasChildren: rootChildren.length > 0,
      collapsed: false,
      onToggleCollapse: () => {},
    },
  });

  return { nodes, edges, parentOf };
}

function MindMapNodeComponent({ id, data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div
      className="rounded-lg border-l-4 bg-white px-3 py-2 text-sm shadow-sm dark:bg-neutral-900"
      style={{ borderLeftColor: data.color }}
    >
      <Handle type="target" position={Position.Left} className="!bg-neutral-400" />
      <div className="flex items-center gap-2">
        <span className="text-neutral-900 dark:text-neutral-50">{data.label}</span>
        {data.hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleCollapse(id);
            }}
            className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] leading-none text-neutral-500 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
            aria-label={data.collapsed ? "Buka cabang" : "Tutup cabang"}
          >
            {data.collapsed ? "+" : "−"}
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-neutral-400" />
    </div>
  );
}

const nodeTypes = { mindmap: MindMapNodeComponent };

export const InteractiveMindMap = forwardRef<
  HTMLDivElement,
  { structure: MindMapStructure; height?: number }
>(function InteractiveMindMap({ structure, height = 480 }, ref) {
    const { nodes: baseNodes, edges: baseEdges, parentOf } = useMemo(
      () => buildLayout(structure),
      [structure]
    );

    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [selected, setSelected] = useState<{ label: string; detail?: string } | null>(null);

    function toggleCollapse(id: string) {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }

    function isHiddenByAncestor(id: string): boolean {
      let current = parentOf[id];
      while (current) {
        if (collapsedIds.has(current)) return true;
        current = parentOf[current];
      }
      return false;
    }

    const visibleNodes: Node<FlowNodeData>[] = useMemo(
      () =>
        baseNodes
          .filter((n) => !isHiddenByAncestor(n.id))
          .map((n) => ({
            ...n,
            data: {
              ...n.data,
              collapsed: collapsedIds.has(n.id),
              onToggleCollapse: toggleCollapse,
            },
          })),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [baseNodes, collapsedIds]
    );

    const visibleEdges = useMemo(() => {
      const visibleIds = new Set(visibleNodes.map((n) => n.id));
      return baseEdges.filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target));
    }, [baseEdges, visibleNodes]);

    return (
      <div className="flex flex-col gap-2">
        <div
          ref={ref}
          style={{ height }}
          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <ReactFlowProvider>
            <ReactFlow
              nodes={visibleNodes}
              edges={visibleEdges}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) =>
                setSelected({ label: node.data.label, detail: node.data.detail })
              }
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={16} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        {selected && (
          <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="font-medium text-neutral-900 dark:text-neutral-50">{selected.label}</p>
            <p className="text-neutral-500">
              {selected.detail || "Tidak ada detail tambahan untuk node ini."}
            </p>
          </div>
        )}
      </div>
    );
  }
);
