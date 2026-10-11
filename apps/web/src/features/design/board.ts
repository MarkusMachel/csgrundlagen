import type { DesignGraph, DesignKind } from '@/features/questions';

/** A component on the board, with where it sits. */
export interface BoardNode {
  id: string;
  kind: DesignKind;
  /** A real product (products.ts) standing in for the kind, e.g. redis for a cache. */
  product?: string;
  label?: string;
  x: number;
  y: number;
}

export interface BoardEdge {
  from: string;
  to: string;
}

export interface BoardState {
  nodes: BoardNode[];
  edges: BoardEdge[];
}

export const emptyBoard: BoardState = { nodes: [], edges: [] };

/** What gets submitted and graded: the drawing without positions. */
export function toGraph(board: BoardState): DesignGraph {
  return {
    nodes: board.nodes.map(({ id, kind, label, product }) => ({
      id,
      kind,
      ...(label?.trim() ? { label: label.trim() } : {}),
      ...(product ? { product } : {}),
    })),
    edges: board.edges.map(({ from, to }) => ({ from, to })),
  };
}

/** A fresh id for a component, e.g. cache-3 or redis-1. */
export function nextNodeId(board: BoardState, base: string): string {
  let n = 1;
  while (board.nodes.some((node) => node.id === `${base}-${n}`)) n++;
  return `${base}-${n}`;
}

/** Arrows are one per direction; a component can't point at itself. */
export function canConnect(board: BoardState, from: string, to: string): boolean {
  return (
    from !== to &&
    board.nodes.some((n) => n.id === from) &&
    board.nodes.some((n) => n.id === to) &&
    !board.edges.some((e) => e.from === from && e.to === to)
  );
}

/** What the palette hands out: a generic kind, or a product of that kind. */
export interface PaletteItem {
  kind: DesignKind;
  product?: string;
}

export function addNode(board: BoardState, item: PaletteItem, x: number, y: number): BoardState {
  const { kind, product } = item;
  const node: BoardNode = { id: nextNodeId(board, product ?? kind), kind, x, y };
  if (product) node.product = product;
  return { ...board, nodes: [...board.nodes, node] };
}

export function removeNode(board: BoardState, id: string): BoardState {
  return {
    nodes: board.nodes.filter((n) => n.id !== id),
    edges: board.edges.filter((e) => e.from !== id && e.to !== id),
  };
}

export function connect(board: BoardState, from: string, to: string): BoardState {
  return canConnect(board, from, to) ? { ...board, edges: [...board.edges, { from, to }] } : board;
}

export function disconnect(board: BoardState, from: string, to: string): BoardState {
  return { ...board, edges: board.edges.filter((e) => !(e.from === from && e.to === to)) };
}

export function reverse(board: BoardState, from: string, to: string): BoardState {
  const without = disconnect(board, from, to);
  return canConnect(without, to, from)
    ? { ...without, edges: [...without.edges, { from: to, to: from }] }
    : board;
}

export const COLUMN_GAP = 230;
export const ROW_GAP = 110;

/**
 * Positions for a graph without them (the reference design, "tidy up"):
 * columns by how many arrows lead to a component, top to bottom within one.
 */
export function autoLayout(g: {
  nodes: { id: string }[];
  edges: BoardEdge[];
}): Map<string, { x: number; y: number }> {
  const depth = new Map(g.nodes.map((n) => [n.id, 0]));
  // longest arrow path from a starting component; capped so cycles end
  for (let round = 0; round < g.nodes.length; round++) {
    let changed = false;
    for (const e of g.edges) {
      const from = depth.get(e.from);
      const to = depth.get(e.to);
      if (from === undefined || to === undefined) continue;
      if (from + 1 > to && from + 1 < g.nodes.length) {
        depth.set(e.to, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const columns = new Map<number, string[]>();
  for (const n of g.nodes) {
    const d = depth.get(n.id) ?? 0;
    columns.set(d, [...(columns.get(d) ?? []), n.id]);
  }
  const tallest = Math.max(1, ...[...columns.values()].map((c) => c.length));
  const out = new Map<string, { x: number; y: number }>();
  [...columns.keys()]
    .sort((a, b) => a - b)
    .forEach((d, col) => {
      const ids = columns.get(d)!;
      const offset = ((tallest - ids.length) * ROW_GAP) / 2;
      ids.forEach((id, row) => out.set(id, { x: col * COLUMN_GAP, y: offset + row * ROW_GAP }));
    });
  return out;
}

/** Saved boards: one draft per challenge, in this browser only. */
const draftKey = (questionId: string) => `cft.design.${questionId}`;

export function loadDraft(questionId: string): BoardState {
  try {
    const raw = localStorage.getItem(draftKey(questionId));
    if (!raw) return emptyBoard;
    const parsed = JSON.parse(raw) as BoardState;
    return Array.isArray(parsed.nodes) && Array.isArray(parsed.edges) ? parsed : emptyBoard;
  } catch {
    return emptyBoard;
  }
}

export function saveDraft(questionId: string, board: BoardState) {
  try {
    if (board.nodes.length === 0) localStorage.removeItem(draftKey(questionId));
    else localStorage.setItem(draftKey(questionId), JSON.stringify(board));
  } catch {
    // storage full or blocked: the board just isn't kept
  }
}
