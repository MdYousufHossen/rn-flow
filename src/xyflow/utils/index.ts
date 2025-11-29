import type { XYPosition, Position, Node, Edge, HandleElement, InternalNode } from '../types';

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const getPositionOffset = (position: Position): { x: number; y: number } => {
  switch (position) {
    case 'top':
      return { x: 0.5, y: 0 };
    case 'right':
      return { x: 1, y: 0.5 };
    case 'bottom':
      return { x: 0.5, y: 1 };
    case 'left':
      return { x: 0, y: 0.5 };
    default:
      return { x: 0.5, y: 0.5 };
  }
};

export const getHandlePosition = (
  position: Position,
  nodeRect: { x: number; y: number; width: number; height: number },
  handle?: HandleElement
): XYPosition => {
  const offset = getPositionOffset(position);

  let x = nodeRect.x + nodeRect.width * offset.x;
  let y = nodeRect.y + nodeRect.height * offset.y;

  if (handle) {
    if (position === 'left' || position === 'right') {
      y = nodeRect.y + handle.y + handle.height / 2;
    } else {
      x = nodeRect.x + handle.x + handle.width / 2;
    }
  }

  return { x, y };
};

export const getEdgeCenter = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [number, number, number, number] => {
  const xOffset = Math.abs(targetX - sourceX) / 2;
  const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;

  const yOffset = Math.abs(targetY - sourceY) / 2;
  const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;

  return [centerX, centerY, xOffset, yOffset];
};

export const getBezierPath = ({
  sourceX,
  sourceY,
  sourcePosition = 'bottom',
  targetX,
  targetY,
  targetPosition = 'top',
  curvature = 0.25,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  curvature?: number;
}): string => {
  const [sourceControlX, sourceControlY] = getControlPoint(
    sourceX,
    sourceY,
    sourcePosition,
    curvature,
    Math.abs(targetX - sourceX),
    Math.abs(targetY - sourceY)
  );
  const [targetControlX, targetControlY] = getControlPoint(
    targetX,
    targetY,
    targetPosition,
    curvature,
    Math.abs(targetX - sourceX),
    Math.abs(targetY - sourceY)
  );

  return `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;
};

export const getControlPoint = (
  x: number,
  y: number,
  position: Position,
  curvature: number,
  distanceX: number,
  distanceY: number
): [number, number] => {
  const distance = Math.max(distanceX, distanceY) * curvature;
  const minDistance = 50;
  const offset = Math.max(distance, minDistance);

  switch (position) {
    case 'top':
      return [x, y - offset];
    case 'right':
      return [x + offset, y];
    case 'bottom':
      return [x, y + offset];
    case 'left':
      return [x - offset, y];
    default:
      return [x, y];
  }
};

export const getStraightPath = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): string => {
  return `M${sourceX},${sourceY} L${targetX},${targetY}`;
};

export const getSmoothStepPath = ({
  sourceX,
  sourceY,
  sourcePosition = 'bottom',
  targetX,
  targetY,
  targetPosition = 'top',
  borderRadius = 5,
  offset = 20,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  borderRadius?: number;
  offset?: number;
}): string => {
  const [centerX, centerY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY });

  let path = `M${sourceX},${sourceY}`;

  if (sourcePosition === 'bottom' || sourcePosition === 'top') {
    const firstY = sourcePosition === 'bottom' ? Math.max(sourceY + offset, centerY) : Math.min(sourceY - offset, centerY);
    const lastY = targetPosition === 'top' ? Math.min(targetY - offset, centerY) : Math.max(targetY + offset, centerY);

    path += ` L${sourceX},${firstY}`;
    path += ` Q${sourceX},${centerY} ${centerX},${centerY}`;
    path += ` Q${targetX},${centerY} ${targetX},${lastY}`;
    path += ` L${targetX},${targetY}`;
  } else {
    const firstX = sourcePosition === 'right' ? Math.max(sourceX + offset, centerX) : Math.min(sourceX - offset, centerX);
    const lastX = targetPosition === 'left' ? Math.min(targetX - offset, centerX) : Math.max(targetX + offset, centerX);

    path += ` L${firstX},${sourceY}`;
    path += ` Q${centerX},${sourceY} ${centerX},${centerY}`;
    path += ` Q${centerX},${targetY} ${lastX},${targetY}`;
    path += ` L${targetX},${targetY}`;
  }

  return path;
};

export const getStepPath = ({
  sourceX,
  sourceY,
  sourcePosition = 'bottom',
  targetX,
  targetY,
  targetPosition = 'top',
  offset = 20,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  offset?: number;
}): string => {
  const [centerX, centerY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY });

  let path = `M${sourceX},${sourceY}`;

  if (sourcePosition === 'bottom' || sourcePosition === 'top') {
    const firstY = sourcePosition === 'bottom' ? Math.max(sourceY + offset, centerY) : Math.min(sourceY - offset, centerY);
    const lastY = targetPosition === 'top' ? Math.min(targetY - offset, centerY) : Math.max(targetY + offset, centerY);

    path += ` L${sourceX},${firstY}`;
    path += ` L${targetX},${firstY}`;
    path += ` L${targetX},${targetY}`;
  } else {
    const firstX = sourcePosition === 'right' ? Math.max(sourceX + offset, centerX) : Math.min(sourceX - offset, centerX);

    path += ` L${firstX},${sourceY}`;
    path += ` L${firstX},${targetY}`;
    path += ` L${targetX},${targetY}`;
  }

  return path;
};

export const getEdgePath = (
  type: string,
  params: {
    sourceX: number;
    sourceY: number;
    sourcePosition?: Position;
    targetX: number;
    targetY: number;
    targetPosition?: Position;
  }
): string => {
  switch (type) {
    case 'straight':
      return getStraightPath(params);
    case 'step':
      return getStepPath(params);
    case 'smoothstep':
      return getSmoothStepPath(params);
    case 'bezier':
    case 'default':
    default:
      return getBezierPath(params);
  }
};

export const isEdgeVisible = (
  sourcePos: XYPosition,
  targetPos: XYPosition,
  viewport: { x: number; y: number; zoom: number },
  containerDimensions: { width: number; height: number }
): boolean => {
  const { x: vx, y: vy, zoom } = viewport;
  const { width, height } = containerDimensions;

  const minX = Math.min(sourcePos.x, targetPos.x) * zoom + vx;
  const maxX = Math.max(sourcePos.x, targetPos.x) * zoom + vx;
  const minY = Math.min(sourcePos.y, targetPos.y) * zoom + vy;
  const maxY = Math.max(sourcePos.y, targetPos.y) * zoom + vy;

  return !(maxX < 0 || minX > width || maxY < 0 || minY > height);
};

export const isNodeVisible = (
  node: Node,
  viewport: { x: number; y: number; zoom: number },
  containerDimensions: { width: number; height: number }
): boolean => {
  const { x: vx, y: vy, zoom } = viewport;
  const { width, height } = containerDimensions;

  const nodeWidth = node.width ?? node.measured?.width ?? 150;
  const nodeHeight = node.height ?? node.measured?.height ?? 50;

  const nodeLeft = node.position.x * zoom + vx;
  const nodeRight = (node.position.x + nodeWidth) * zoom + vx;
  const nodeTop = node.position.y * zoom + vy;
  const nodeBottom = (node.position.y + nodeHeight) * zoom + vy;

  return !(nodeRight < 0 || nodeLeft > width || nodeBottom < 0 || nodeTop > height);
};

export const snapPosition = (
  position: XYPosition,
  snapGrid: [number, number]
): XYPosition => {
  return {
    x: Math.round(position.x / snapGrid[0]) * snapGrid[0],
    y: Math.round(position.y / snapGrid[1]) * snapGrid[1],
  };
};

export const getNodesBounds = (nodes: Node[]): { x: number; y: number; width: number; height: number } => {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    const width = node.width ?? node.measured?.width ?? 150;
    const height = node.height ?? node.measured?.height ?? 50;

    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const getConnectedEdges = (nodes: Node[], edges: Edge[]): Edge[] => {
  const nodeIds = nodes.map((node) => node.id);
  return edges.filter((edge) => nodeIds.includes(edge.source) || nodeIds.includes(edge.target));
};

export const getIncomers = (node: Node, nodes: Node[], edges: Edge[]): Node[] => {
  const incomingEdges = edges.filter((edge) => edge.target === node.id);
  return nodes.filter((n) => incomingEdges.some((edge) => edge.source === n.id));
};

export const getOutgoers = (node: Node, nodes: Node[], edges: Edge[]): Node[] => {
  const outgoingEdges = edges.filter((edge) => edge.source === node.id);
  return nodes.filter((n) => outgoingEdges.some((edge) => edge.target === n.id));
};

export const addEdge = (edge: Edge, edges: Edge[]): Edge[] => {
  return [...edges, edge];
};

export const updateEdge = (oldEdge: Edge, newConnection: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }, edges: Edge[]): Edge[] => {
  return edges.map((e) => {
    if (e.id === oldEdge.id) {
      return {
        ...e,
        source: newConnection.source,
        target: newConnection.target,
        sourceHandle: newConnection.sourceHandle,
        targetHandle: newConnection.targetHandle,
      };
    }
    return e;
  });
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
