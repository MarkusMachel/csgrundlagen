/**
 * JSON "shapes" for the mock-vs-API contract check: what types a response
 * has, not its values (ids, dates and counts differ between the two backends).
 */
export type Shape =
  | { kind: 'null' | 'string' | 'number' | 'boolean' }
  | { kind: 'array'; of: Shape | null } // null: only seen empty
  | { kind: 'object'; fields: Record<string, Field>; variant?: string }
  | { kind: 'map'; of: Shape | null }; // object keyed by data (ids, tags)

export interface Field {
  shape: Shape;
  /** Missing from some of the array elements the shape was built from. */
  optional: boolean;
}

/**
 * The shape of a JSON value. `maps` lists paths (like `$.answers` or
 * `$[].byTag`) whose objects are keyed by data rather than field names.
 */
export function shapeOf(value: unknown, maps: string[] = [], path = '$'): Shape {
  if (value === null || value === undefined) return { kind: 'null' };
  if (Array.isArray(value)) {
    return {
      kind: 'array',
      of: value.reduce<Shape | null>((acc, v) => merge(acc, shapeOf(v, maps, `${path}[]`)), null),
    };
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (maps.includes(path)) {
      return {
        kind: 'map',
        of: entries.reduce<Shape | null>(
          (acc, [, v]) => merge(acc, shapeOf(v, maps, `${path}{}`)),
          null,
        ),
      };
    }
    const { type } = value as { type?: unknown };
    return {
      kind: 'object',
      fields: Object.fromEntries(
        entries.map(([k, v]) => [k, { shape: shapeOf(v, maps, `${path}.${k}`), optional: false }]),
      ),
      // `type` tells the variants of a union apart (question types, ...)
      variant: typeof type === 'string' ? type : undefined,
    };
  }
  return { kind: typeof value as 'string' | 'number' | 'boolean' };
}

/** Combines the shapes of two array elements. */
function merge(a: Shape | null, b: Shape | null): Shape | null {
  if (!a) return b;
  if (!b) return a;
  if (a.kind === 'null') return b;
  if (b.kind === 'null') return a;
  if (a.kind === 'object' && b.kind === 'object') {
    const fields: Record<string, Field> = {};
    for (const key of new Set([...Object.keys(a.fields), ...Object.keys(b.fields)])) {
      const fa = a.fields[key];
      const fb = b.fields[key];
      fields[key] = {
        shape: merge(fa?.shape ?? null, fb?.shape ?? null)!,
        optional: !fa || !fb || fa.optional || fb.optional,
      };
    }
    return { kind: 'object', fields, variant: a.variant === b.variant ? a.variant : undefined };
  }
  if ((a.kind === 'array' && b.kind === 'array') || (a.kind === 'map' && b.kind === 'map')) {
    return { kind: a.kind, of: merge(a.of, b.of) };
  }
  return a; // differing kinds inside one array: keep the first, the diff will show it
}

function describe(s: Shape): string {
  return s.kind === 'array' || s.kind === 'map' ? `${s.kind}` : s.kind;
}

/**
 * Where two shapes disagree. Lenient where JSON can't tell: null and a
 * missing field are the same ("no value"), an empty array matches any array,
 * a field only some elements have can be missing, and different variants of
 * a union (objects with different `type`s) aren't compared.
 */
export function diffShapes(mock: Shape, api: Shape, path = '$'): string[] {
  if (mock.kind === 'null' || api.kind === 'null') return [];
  if (mock.kind !== api.kind) return [`${path}: mock ${describe(mock)}, api ${describe(api)}`];
  if (mock.kind === 'object' && api.kind === 'object') {
    if (mock.variant && api.variant && mock.variant !== api.variant) return [];
    const out: string[] = [];
    for (const key of new Set([...Object.keys(mock.fields), ...Object.keys(api.fields)])) {
      const m = mock.fields[key];
      const a = api.fields[key];
      if (m && a) out.push(...diffShapes(m.shape, a.shape, `${path}.${key}`));
      else {
        const only = (m ?? a)!;
        if (only.shape.kind !== 'null' && !only.optional) {
          out.push(`${path}.${key}: only in ${m ? 'mock' : 'api'} (${describe(only.shape)})`);
        }
      }
    }
    return out;
  }
  if (
    (mock.kind === 'array' && api.kind === 'array') ||
    (mock.kind === 'map' && api.kind === 'map')
  ) {
    if (!mock.of || !api.of) return [];
    return diffShapes(mock.of, api.of, `${path}${mock.kind === 'array' ? '[]' : '{}'}`);
  }
  return [];
}
