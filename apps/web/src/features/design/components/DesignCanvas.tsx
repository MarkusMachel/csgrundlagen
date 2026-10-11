import '@xyflow/react/dist/style.css';

import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useUIStore } from '@/stores/useUIStore';

import {
  addNode,
  canConnect,
  connect,
  disconnect,
  removeNode,
  type BoardState,
  type PaletteItem,
} from '../board';
import { nodeTypes, type ComponentFlowNode } from './ComponentNode';

export const DRAG_TYPE = 'application/x-design-kind';

const edgeId = (from: string, to: string) => `${from}->${to}`;

interface DesignCanvasProps {
  board: BoardState;
  onChange: (next: BoardState) => void;
  /** Arrows to mark as wrong (from a checked design). */
  badEdges?: { from: string; to: string }[];
  readOnly?: boolean;
  label: string;
  /** Change it to zoom the view to fit everything again (e.g. after tidying up). */
  fitKey?: number;
}

/**
 * The drawing board: drop components from the palette, drag from a
 * component's right edge to another's left edge to draw an arrow, select and
 * press Delete to remove. Built on React Flow.
 */
export function DesignCanvas({
  board,
  onChange,
  badEdges = [],
  readOnly,
  label,
  fitKey = 0,
}: DesignCanvasProps) {
  const { t } = useTranslation();
  const themeMode = useUIStore((s) => s.themeMode);
  const flow = useReactFlow();
  // Ids of the selected components and arrows (React Flow reports changes).
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set());
  // React Flow measures each component; in a controlled flow the sizes have
  // to be handed back with the nodes, or it keeps them hidden.
  const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({});
  const select = (changes: { id: string; selected: boolean }[]) =>
    changes.length > 0 &&
    setSelection((prev) => {
      const next = new Set(prev);
      for (const c of changes) {
        if (c.selected) next.add(c.id);
        else next.delete(c.id);
      }
      return next;
    });

  const nodes: ComponentFlowNode[] = useMemo(
    () =>
      board.nodes.map((n) => ({
        id: n.id,
        type: 'component',
        position: { x: n.x, y: n.y },
        data: { kind: n.kind, product: n.product, label: n.label },
        selected: selection.has(n.id),
        measured: measured[n.id],
        draggable: !readOnly,
        deletable: !readOnly,
      })),
    [board.nodes, readOnly, selection, measured],
  );
  const edges: Edge[] = useMemo(
    () =>
      board.edges.map((e) => {
        const bad = badEdges.some((b) => b.from === e.from && b.to === e.to);
        return {
          id: edgeId(e.from, e.to),
          source: e.from,
          target: e.to,
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          className: bad ? 'design-edge design-edge--bad' : 'design-edge',
          deletable: !readOnly,
          selected: selection.has(edgeId(e.from, e.to)),
        };
      }),
    [board.edges, badEdges, readOnly, selection],
  );

  // Zoom to fit when asked (after tidying up, or adding a component out of
  // view), once React Flow has measured any new ones. Not on every change:
  // the view shouldn't move under a component being dropped.
  useEffect(() => {
    if (fitKey === 0) return;
    const id = window.setTimeout(
      () => void flow.fitView({ padding: 0.25, maxZoom: 1.2, duration: 200 }),
      60,
    );
    return () => window.clearTimeout(id);
  }, [fitKey, flow]);

  const onNodesChange = useCallback(
    (changes: NodeChange<ComponentFlowNode>[]) => {
      let next = board;
      const sizes: Record<string, { width: number; height: number }> = {};
      for (const c of changes) {
        if (c.type === 'dimensions' && c.dimensions) {
          sizes[c.id] = c.dimensions;
        } else if (c.type === 'position' && c.position) {
          const { x, y } = c.position;
          next = { ...next, nodes: next.nodes.map((n) => (n.id === c.id ? { ...n, x, y } : n)) };
        } else if (c.type === 'remove') {
          next = removeNode(next, c.id);
        }
      }
      if (Object.keys(sizes).length > 0) setMeasured((prev) => ({ ...prev, ...sizes }));
      select(changes.flatMap((c) => (c.type === 'select' ? [c] : [])));
      // size measurements and selection don't change the design
      if (next !== board) onChange(next);
    },
    [board, onChange],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      let next = board;
      for (const c of changes) {
        if (c.type !== 'remove') continue;
        const e = board.edges.find((x) => edgeId(x.from, x.to) === c.id);
        if (e) next = disconnect(next, e.from, e.to);
      }
      select(changes.flatMap((c) => (c.type === 'select' ? [c] : [])));
      if (next !== board) onChange(next);
    },
    [board, onChange],
  );

  const onConnect = useCallback(
    (c: Connection) => onChange(connect(board, c.source, c.target)),
    [board, onChange],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData(DRAG_TYPE);
    if (!raw || readOnly) return;
    let item: PaletteItem;
    try {
      item = JSON.parse(raw) as PaletteItem;
    } catch {
      return;
    }
    const p = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    onChange(addNode(board, item, p.x - 70, p.y - 24));
  };

  return (
    <div className="design-canvas" aria-label={label} role="group" data-testid="design-board">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(c) => canConnect(board, c.source, c.target)}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={onDrop}
        nodesConnectable={!readOnly}
        nodesDraggable={!readOnly}
        elementsSelectable={!readOnly}
        deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
        colorMode={themeMode === 'dark' ? 'dark' : 'light'}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.2 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1.2} />
        <Controls showInteractive={false} />
      </ReactFlow>
      {board.nodes.length === 0 && !readOnly && (
        <p className="design-canvas__empty">{t('design.board.empty')}</p>
      )}
    </div>
  );
}
