import { describe, expect, it } from 'vitest';

import { DESIGN_KINDS, gradeDesign, type DesignSpec } from '@/features/questions';

import { addNode, connect, emptyBoard, toGraph } from '../board';
import { DESIGN_PRODUCTS, productById } from '../products';

describe('design products', () => {
  it('have unique ids, a known kind and a logo or a badge', () => {
    const ids = DESIGN_PRODUCTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of DESIGN_PRODUCTS) {
      expect(DESIGN_KINDS, p.id).toContain(p.kind);
      expect(Boolean(p.logo) !== Boolean(p.badge), `${p.id}: logo xor badge`).toBe(true);
      if (p.logo) expect(p.logo.hex).toMatch(/^[0-9A-F]{6}$/i);
    }
  });

  it('counts as its generic kind when a design is checked', () => {
    const spec: DesignSpec = {
      requirements: [{ id: 'r', text: 'Fast reads' }],
      rules: [
        {
          id: 'cache',
          kind: 'edge',
          from: ['service'],
          to: ['cache'],
          text: 't',
          explanation: 'e',
        },
        { id: 'queue', kind: 'has', of: ['queue'], text: 't', explanation: 'e' },
      ],
      reference: { nodes: [], edges: [] },
    };
    let b = addNode(emptyBoard, { kind: 'service', product: 'kubernetes' }, 0, 0);
    b = addNode(b, { kind: 'cache', product: 'redis' }, 0, 0);
    b = addNode(b, { kind: 'queue', product: 'aws-sqs' }, 0, 0);
    b = connect(b, 'kubernetes-1', 'redis-1');
    const graph = toGraph(b);
    expect(graph.nodes[1]).toEqual({ id: 'redis-1', kind: 'cache', product: 'redis' });
    const r = gradeDesign(spec, graph);
    expect([r.score, r.total]).toEqual([2, 2]);
  });

  it('finds products by id', () => {
    expect(productById('redis')?.name).toBe('Redis');
    expect(productById('aws-s3')?.kind).toBe('object-storage');
    expect(productById('nope')).toBeUndefined();
    expect(productById(undefined)).toBeUndefined();
  });
});
