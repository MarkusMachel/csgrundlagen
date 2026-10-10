import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';

import type { DesignKind } from '@/features/questions';

import { productById } from '../products';
import { NodeIcon } from './NodeIcon';

export type ComponentNodeData = { kind: DesignKind; product?: string; label?: string };
export type ComponentFlowNode = Node<ComponentNodeData, 'component'>;

/** One component on the board: icon, name and the kind underneath. */
export function ComponentNode({ data, selected }: NodeProps<ComponentFlowNode>) {
  const { t } = useTranslation();
  const kindName = t(`design.kinds.${data.kind}`);
  const productName = productById(data.product)?.name;
  const title = data.label || productName || kindName;
  // the second line says what it counts as: "Redis · Cache", or the kind
  // under a custom name
  const sub = productName
    ? data.label
      ? `${productName} · ${kindName}`
      : kindName
    : data.label
      ? kindName
      : undefined;
  return (
    <div
      className={selected ? 'design-node design-node--selected' : 'design-node'}
      title={t('design.countsAs', { kind: kindName })}
    >
      {/* arrows come in on the left and leave on the right */}
      <Handle type="target" position={Position.Left} className="design-node__handle" />
      <NodeIcon kind={data.kind} product={data.product} />
      <div className="design-node__text">
        <span className="design-node__label">{title}</span>
        {sub && <span className="design-node__kind">{sub}</span>}
      </div>
      <Handle type="source" position={Position.Right} className="design-node__handle" />
    </div>
  );
}

export const nodeTypes = { component: ComponentNode };
