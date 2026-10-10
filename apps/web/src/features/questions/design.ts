import type { DesignGraph, DesignKind, DesignResult, DesignSpec } from './types';

/** Every component a design can use, in palette order (store.DesignKinds). */
export const DESIGN_KINDS: DesignKind[] = [
  'client',
  'dns',
  'cdn',
  'load-balancer',
  'api-gateway',
  'rate-limiter',
  'auth',
  'service',
  'websocket',
  'worker',
  'scheduler',
  'queue',
  'cache',
  'sql',
  'nosql',
  'replica',
  'object-storage',
  'search',
];

export const MAX_DESIGN_NODES = 60;
export const MAX_DESIGN_EDGES = 150;

export function isDesignGraph(v: unknown): v is DesignGraph {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const g = v as Partial<DesignGraph>;
  return (
    Array.isArray(g.nodes) &&
    Array.isArray(g.edges) &&
    g.nodes.length <= MAX_DESIGN_NODES &&
    g.edges.length <= MAX_DESIGN_EDGES &&
    g.nodes.every((n) => typeof n?.id === 'string' && typeof n?.kind === 'string') &&
    g.edges.every((e) => typeof e?.from === 'string' && typeof e?.to === 'string')
  );
}

/**
 * Checks a design against every rule of the challenge. Mirrors
 * store.GradeDesign in the Go API; keep the two in sync.
 */
export function gradeDesign(spec: DesignSpec, g: DesignGraph): DesignResult {
  const kind = new Map(g.nodes.map((n) => [n.id, n.kind as string]));
  const out = new Map<string, string[]>();
  for (const e of g.edges) {
    if (kind.has(e.from) && kind.has(e.to)) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  }
  const ofKind = (kinds: string[] = []) =>
    g.nodes.filter((n) => kinds.includes(n.kind)).map((n) => n.id);
  // Breadth-first over the arrows, starting one step away from `starts`.
  const walk = (starts: string[], stop: (id: string) => boolean) => {
    const seen = new Set<string>();
    const queue = starts.flatMap((s) => out.get(s) ?? []);
    while (queue.length) {
      const id = queue.shift()!;
      if (stop(id)) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push(...(out.get(id) ?? []));
    }
    return false;
  };
  const reachesKind = (starts: string[], targets: string[] = []) =>
    walk(starts, (id) => targets.includes(kind.get(id) ?? ''));
  const directEdge = (from: string[] = [], to: string[] = []) =>
    g.edges.some((e) => from.includes(kind.get(e.from) ?? '') && to.includes(kind.get(e.to) ?? ''));

  const result: DesignResult = { score: 0, total: 0, rules: [] };
  for (const r of spec.rules) {
    let passed = false;
    switch (r.kind) {
      case 'has':
        passed = ofKind(r.of).length >= Math.max(r.min ?? 1, 1);
        break;
      case 'edge':
        passed = directEdge(r.from, r.to);
        break;
      case 'no-edge':
        passed = !directEdge(r.from, r.to);
        break;
      case 'path': {
        const starts = ofKind(r.from);
        passed = r.via?.length
          ? ofKind(r.via).some((v) => walk(starts, (id) => id === v) && reachesKind([v], r.to))
          : reachesKind(starts, r.to);
        break;
      }
    }
    result.rules.push({ id: r.id, passed });
    if (!r.optional) {
      result.total++;
      if (passed) result.score++;
    }
  }
  return result;
}

/**
 * The arrows behind failed "no-edge" rules, so the board can point at them.
 */
export function offendingEdges(spec: DesignSpec, g: DesignGraph, result: DesignResult) {
  const kind = new Map(g.nodes.map((n) => [n.id, n.kind as string]));
  const failed = spec.rules.filter(
    (r) => r.kind === 'no-edge' && !result.rules.find((x) => x.id === r.id)?.passed,
  );
  return g.edges.filter((e) =>
    failed.some(
      (r) =>
        r.from?.includes(kind.get(e.from) as DesignKind) &&
        r.to?.includes(kind.get(e.to) as DesignKind),
    ),
  );
}
