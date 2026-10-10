import { describe, expect, it } from 'vitest';

import {
  addNode,
  autoLayout,
  canConnect,
  connect,
  emptyBoard,
  removeNode,
  reverse,
  toGraph,
} from '../board';

describe('design board', () => {
  it('gives each new component a free id of its kind', () => {
    let b = addNode(emptyBoard, 'service', 0, 0);
    b = addNode(b, 'service', 10, 0);
    b = addNode(b, 'cache', 20, 0);
    expect(b.nodes.map((n) => n.id)).toEqual(['service-1', 'service-2', 'cache-1']);
    b = addNode(removeNode(b, 'service-1'), 'service', 0, 0);
    expect(b.nodes.map((n) => n.id)).toContain('service-1');
  });

  it('allows one arrow per direction and none to itself', () => {
    let b = addNode(addNode(emptyBoard, 'client', 0, 0), 'service', 0, 0);
    expect(canConnect(b, 'client-1', 'client-1')).toBe(false);
    b = connect(b, 'client-1', 'service-1');
    expect(canConnect(b, 'client-1', 'service-1')).toBe(false);
    expect(connect(b, 'client-1', 'service-1').edges).toHaveLength(1);
    b = reverse(b, 'client-1', 'service-1');
    expect(b.edges).toEqual([{ from: 'service-1', to: 'client-1' }]);
  });

  it('removing a component removes its arrows', () => {
    let b = addNode(addNode(emptyBoard, 'client', 0, 0), 'service', 0, 0);
    b = connect(b, 'client-1', 'service-1');
    expect(removeNode(b, 'service-1').edges).toEqual([]);
  });

  it('submits names and arrows, not positions', () => {
    let b = addNode(addNode(emptyBoard, 'client', 5, 5), 'service', 9, 9);
    b = {
      ...b,
      nodes: b.nodes.map((n) => (n.kind === 'service' ? { ...n, label: '  api  ' } : n)),
    };
    b = connect(b, 'client-1', 'service-1');
    expect(toGraph(b)).toEqual({
      nodes: [
        { id: 'client-1', kind: 'client' },
        { id: 'service-1', kind: 'service', label: 'api' },
      ],
      edges: [{ from: 'client-1', to: 'service-1' }],
    });
  });

  it('lays out components in columns by how far along the arrows they are', () => {
    const pos = autoLayout({
      nodes: [{ id: 'c' }, { id: 'lb' }, { id: 's1' }, { id: 's2' }, { id: 'db' }],
      edges: [
        { from: 'c', to: 'lb' },
        { from: 'lb', to: 's1' },
        { from: 'lb', to: 's2' },
        { from: 's1', to: 'db' },
        { from: 's2', to: 'db' },
      ],
    });
    const x = (id: string) => pos.get(id)!.x;
    expect([x('c'), x('lb'), x('s1'), x('db')]).toEqual([0, 230, 460, 690]);
    expect(x('s1')).toBe(x('s2'));
    expect(pos.get('s1')!.y).not.toBe(pos.get('s2')!.y);
  });

  it('copes with cycles', () => {
    const pos = autoLayout({
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    });
    expect(pos.size).toBe(2);
  });
});
