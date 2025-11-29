import { useCallback } from 'react';
import { useStore } from '../store/ReactFlowContext';
import type { Node, Edge, Viewport, Connection, OnConnect } from '../types';

export { useNodesState } from './useNodesState';
export { useEdgesState } from './useEdgesState';
export { useReactFlow } from './useReactFlow';

export const useNodes = <T = Node>(): T[] => {
  const { nodes } = useStore();
  return nodes as unknown as T[];
};

export const useEdges = <T = Edge>(): T[] => {
  const { edges } = useStore();
  return edges as unknown as T[];
};

export const useViewport = (): Viewport => {
  const { viewport } = useStore();
  return viewport;
};

export const useOnConnect = (callback: OnConnect): OnConnect => {
  return useCallback(
    (connection: Connection) => {
      callback(connection);
    },
    [callback]
  );
};

export const useNodeId = (): string | null => {
  // This hook is typically used in custom node components
  // The actual node ID is passed via props, so this is a placeholder
  // that returns null when not inside a node context
  return null;
};

export const useHandleConnections = (params: {
  type: 'source' | 'target';
  id?: string;
  nodeId?: string;
}): Connection[] => {
  const { edges, nodes } = useStore();
  const { type, id: handleId, nodeId } = params;

  if (!nodeId) {
    return [];
  }

  return edges
    .filter((edge) => {
      if (type === 'source') {
        return edge.source === nodeId && (handleId ? edge.sourceHandle === handleId : true);
      }
      return edge.target === nodeId && (handleId ? edge.targetHandle === handleId : true);
    })
    .map((edge) => ({
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? null,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null,
    }));
};

export const useNodesInitialized = (): boolean => {
  const { nodes, nodeInternals } = useStore();

  if (nodes.length === 0) {
    return true;
  }

  return nodes.every((node) => {
    const internal = nodeInternals.get(node.id);
    return internal?.measured?.width !== undefined && internal?.measured?.height !== undefined;
  });
};

export const useConnection = () => {
  const {
    isConnecting,
    connectionStartHandle,
    connectionPosition,
    connectionNodeId
  } = useStore();

  return {
    isConnecting,
    startHandle: connectionStartHandle,
    endPosition: connectionPosition,
    startNodeId: connectionNodeId,
  };
};
