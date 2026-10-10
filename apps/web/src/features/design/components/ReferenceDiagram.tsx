import { ReactFlowProvider } from '@xyflow/react';
import { useMemo } from 'react';

import type { DesignGraph } from '@/features/questions';

import { autoLayout, type BoardState } from '../board';
import { DesignCanvas } from './DesignCanvas';

/** The model answer, laid out automatically and read-only. */
export function ReferenceDiagram({ graph, label }: { graph: DesignGraph; label: string }) {
  const board: BoardState = useMemo(() => {
    const pos = autoLayout(graph);
    return {
      nodes: graph.nodes.map((n) => ({ ...n, ...(pos.get(n.id) ?? { x: 0, y: 0 }) })),
      edges: graph.edges,
    };
  }, [graph]);
  return (
    <ReactFlowProvider>
      <DesignCanvas board={board} onChange={() => {}} readOnly label={label} />
    </ReactFlowProvider>
  );
}
