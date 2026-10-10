import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';

import type { DesignKind } from '@/features/questions';

import { KIND_ICON } from '../kinds';

export type ComponentNodeData = { kind: DesignKind; label?: string };
export type ComponentFlowNode = Node<ComponentNodeData, 'component'>;

/** One component on the board: icon, name and the kind underneath. */
export function ComponentNode({ data, selected }: NodeProps<ComponentFlowNode>) {
  const { t } = useTranslation();
  const Icon = KIND_ICON[data.kind];
  const kindName = t(`design.kinds.${data.kind}`);
  return (
    <div className={selected ? 'design-node design-node--selected' : 'design-node'}>
      {/* arrows come in on the left and leave on the right */}
      <Handle type="target" position={Position.Left} className="design-node__handle" />
      <Icon size={18} aria-hidden className="design-node__icon" />
      <div className="design-node__text">
        <span className="design-node__label">{data.label || kindName}</span>
        {data.label && <span className="design-node__kind">{kindName}</span>}
      </div>
      <Handle type="source" position={Position.Right} className="design-node__handle" />
    </div>
  );
}

export const nodeTypes = { component: ComponentNode };
