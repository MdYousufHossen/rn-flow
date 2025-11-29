import React, { createContext, useContext, useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions as RNDimensions } from 'react-native';
import type {
  Node,
  Edge,
  Viewport,
  NodeChange,
  EdgeChange,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  HandleElement,
  InternalNode,
  ReactFlowInstance,
  FitViewOptions,
  XYPosition,
} from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = RNDimensions.get('window');

interface ReactFlowState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  nodeInternals: Map<string, InternalNode>;
  connectionStartHandle: HandleElement | null;
  connectionPosition: XYPosition | null;
  connectionNodeId: string | null;
  isConnecting: boolean;
  selectedNodes: string[];
  selectedEdges: string[];
  panOnDrag: boolean;
  minZoom: number;
  maxZoom: number;
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  elementsSelectable: boolean;
  snapToGrid: boolean;
  snapGrid: [number, number];
  containerDimensions: { width: number; height: number };
}

interface ReactFlowActions {
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setViewport: (viewport: Viewport | ((viewport: Viewport) => Viewport)) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodePosition: (nodeId: string, position: XYPosition, dragging: boolean) => void;
  updateNodeDimensions: (nodeId: string, dimensions: { width: number; height: number }) => void;
  updateHandleBounds: (nodeId: string, handleBounds: { source?: HandleElement[]; target?: HandleElement[] }) => void;
  setConnectionStartHandle: (handle: HandleElement | null, nodeId: string | null) => void;
  setConnectionPosition: (position: XYPosition | null) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  selectNode: (nodeId: string, addToSelection?: boolean) => void;
  selectEdge: (edgeId: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  setContainerDimensions: (dimensions: { width: number; height: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: (options?: FitViewOptions) => void;
  getNodes: () => Node[];
  getEdges: () => Edge[];
  getNode: (id: string) => Node | undefined;
  getEdge: (id: string) => Edge | undefined;
  addNodes: (nodes: Node | Node[]) => void;
  addEdges: (edges: Edge | Edge[]) => void;
  deleteElements: (params: { nodes?: Node[]; edges?: Edge[] }) => void;
}

interface ReactFlowContextValue extends ReactFlowState, ReactFlowActions {
  reactFlowInstance: ReactFlowInstance;
}

const ReactFlowContext = createContext<ReactFlowContextValue | null>(null);

interface ReactFlowProviderProps {
  children: React.ReactNode;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  defaultViewport?: Viewport;
  onNodesChangeCallback?: OnNodesChange;
  onEdgesChangeCallback?: OnEdgesChange;
  onConnectCallback?: OnConnect;
  minZoom?: number;
  maxZoom?: number;
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  elementsSelectable?: boolean;
  panOnDrag?: boolean;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
}

export const ReactFlowProvider: React.FC<ReactFlowProviderProps> = ({
  children,
  initialNodes = [],
  initialEdges = [],
  defaultViewport = { x: 0, y: 0, zoom: 1 },
  onNodesChangeCallback,
  onEdgesChangeCallback,
  onConnectCallback,
  minZoom = 0.5,
  maxZoom = 2,
  nodesDraggable = true,
  nodesConnectable = true,
  elementsSelectable = true,
  panOnDrag = true,
  snapToGrid = false,
  snapGrid = [15, 15],
}) => {
  const [nodes, setNodesState] = useState<Node[]>(initialNodes);
  const [edges, setEdgesState] = useState<Edge[]>(initialEdges);
  const [viewport, setViewportState] = useState<Viewport>(defaultViewport);
  const [nodeInternals, setNodeInternals] = useState<Map<string, InternalNode>>(new Map());
  const [connectionStartHandle, setConnectionStartHandleState] = useState<HandleElement | null>(null);
  const [connectionPosition, setConnectionPositionState] = useState<XYPosition | null>(null);
  const [connectionNodeId, setConnectionNodeId] = useState<string | null>(null);
  const [isConnecting, setIsConnectingState] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [containerDimensions, setContainerDimensionsState] = useState({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const setNodes = useCallback((nodesOrUpdater: Node[] | ((nodes: Node[]) => Node[])) => {
    if (typeof nodesOrUpdater === 'function') {
      setNodesState((prev) => {
        const newNodes = nodesOrUpdater(prev);
        nodesRef.current = newNodes;
        return newNodes;
      });
    } else {
      nodesRef.current = nodesOrUpdater;
      setNodesState(nodesOrUpdater);
    }
  }, []);

  const setEdges = useCallback((edgesOrUpdater: Edge[] | ((edges: Edge[]) => Edge[])) => {
    if (typeof edgesOrUpdater === 'function') {
      setEdgesState((prev) => {
        const newEdges = edgesOrUpdater(prev);
        edgesRef.current = newEdges;
        return newEdges;
      });
    } else {
      edgesRef.current = edgesOrUpdater;
      setEdgesState(edgesOrUpdater);
    }
  }, []);

  const setViewport = useCallback((viewportOrUpdater: Viewport | ((viewport: Viewport) => Viewport)) => {
    if (typeof viewportOrUpdater === 'function') {
      setViewportState((prev) => {
        const newViewport = viewportOrUpdater(prev);
        viewportRef.current = newViewport;
        return newViewport;
      });
    } else {
      viewportRef.current = viewportOrUpdater;
      setViewportState(viewportOrUpdater);
    }
  }, []);

  const onNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      setNodes((nds) => {
        let updatedNodes = [...nds];

        changes.forEach((change) => {
          switch (change.type) {
            case 'position':
              if (change.id) {
                const index = updatedNodes.findIndex((n) => n.id === change.id);
                if (index !== -1) {
                  updatedNodes[index] = {
                    ...updatedNodes[index],
                    position: change.position ?? updatedNodes[index].position,
                    dragging: change.dragging ?? updatedNodes[index].dragging,
                  };
                }
              }
              break;
            case 'dimensions':
              if (change.id && change.dimensions) {
                const index = updatedNodes.findIndex((n) => n.id === change.id);
                if (index !== -1) {
                  updatedNodes[index] = {
                    ...updatedNodes[index],
                    width: change.dimensions.width,
                    height: change.dimensions.height,
                    measured: change.dimensions,
                  };
                }
              }
              break;
            case 'select':
              if (change.id) {
                const index = updatedNodes.findIndex((n) => n.id === change.id);
                if (index !== -1) {
                  updatedNodes[index] = {
                    ...updatedNodes[index],
                    selected: change.selected,
                  };
                }
              }
              break;
            case 'remove':
              if (change.id) {
                updatedNodes = updatedNodes.filter((n) => n.id !== change.id);
              }
              break;
            case 'add':
              if (change.item) {
                updatedNodes.push(change.item);
              }
              break;
            case 'reset':
              updatedNodes = [];
              break;
          }
        });

        return updatedNodes;
      });

      onNodesChangeCallback?.(changes);
    },
    [setNodes, onNodesChangeCallback]
  );

  const onEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      setEdges((eds) => {
        let updatedEdges = [...eds];

        changes.forEach((change) => {
          switch (change.type) {
            case 'select':
              if (change.id) {
                const index = updatedEdges.findIndex((e) => e.id === change.id);
                if (index !== -1) {
                  updatedEdges[index] = {
                    ...updatedEdges[index],
                    selected: change.selected,
                  };
                }
              }
              break;
            case 'remove':
              if (change.id) {
                updatedEdges = updatedEdges.filter((e) => e.id !== change.id);
              }
              break;
            case 'add':
              if (change.item) {
                updatedEdges.push(change.item);
              }
              break;
            case 'reset':
              updatedEdges = [];
              break;
          }
        });

        return updatedEdges;
      });

      onEdgesChangeCallback?.(changes);
    },
    [setEdges, onEdgesChangeCallback]
  );

  const onConnect = useCallback<OnConnect>(
    (connection) => {
      if (onConnectCallback) {
        onConnectCallback(connection);
      } else {
        // Default behavior: add edge
        const newEdge: Edge = {
          id: `e${connection.source}-${connection.target}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        };
        setEdges((eds) => [...eds, newEdge]);
      }
    },
    [onConnectCallback, setEdges]
  );

  const updateNodePosition = useCallback((nodeId: string, position: XYPosition, dragging: boolean) => {
    onNodesChange([
      {
        type: 'position',
        id: nodeId,
        position,
        dragging,
      },
    ]);
  }, [onNodesChange]);

  const updateNodeDimensions = useCallback((nodeId: string, dimensions: { width: number; height: number }) => {
    onNodesChange([
      {
        type: 'dimensions',
        id: nodeId,
        dimensions,
      },
    ]);

    setNodeInternals((prev) => {
      const newMap = new Map(prev);
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        const existingInternal = newMap.get(nodeId);
        newMap.set(nodeId, {
          ...node,
          ...existingInternal,
          measured: dimensions,
          positionAbsolute: existingInternal?.positionAbsolute ?? node.position,
        });
      }
      return newMap;
    });
  }, [onNodesChange]);

  const updateHandleBounds = useCallback((nodeId: string, handleBounds: { source?: HandleElement[]; target?: HandleElement[] }) => {
    setNodeInternals((prev) => {
      const newMap = new Map(prev);
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        const existingInternal = newMap.get(nodeId);
        newMap.set(nodeId, {
          ...node,
          ...existingInternal,
          positionAbsolute: existingInternal?.positionAbsolute ?? node.position,
          handleBounds: {
            ...existingInternal?.handleBounds,
            ...handleBounds,
          },
        });
      }
      return newMap;
    });
  }, []);

  const setConnectionStartHandle = useCallback((handle: HandleElement | null, nodeId: string | null) => {
    setConnectionStartHandleState(handle);
    setConnectionNodeId(nodeId);
  }, []);

  const setConnectionPosition = useCallback((position: XYPosition | null) => {
    setConnectionPositionState(position);
  }, []);

  const setIsConnecting = useCallback((connecting: boolean) => {
    setIsConnectingState(connecting);
  }, []);

  const selectNode = useCallback((nodeId: string, addToSelection = false) => {
    if (addToSelection) {
      setSelectedNodes((prev) => [...prev.filter((id) => id !== nodeId), nodeId]);
    } else {
      setSelectedNodes([nodeId]);
      setSelectedEdges([]);
    }

    onNodesChange([{ type: 'select', id: nodeId, selected: true }]);
  }, [onNodesChange]);

  const selectEdge = useCallback((edgeId: string, addToSelection = false) => {
    if (addToSelection) {
      setSelectedEdges((prev) => [...prev.filter((id) => id !== edgeId), edgeId]);
    } else {
      setSelectedEdges([edgeId]);
      setSelectedNodes([]);
    }

    onEdgesChange([{ type: 'select', id: edgeId, selected: true }]);
  }, [onEdgesChange]);

  const clearSelection = useCallback(() => {
    selectedNodes.forEach((id) => {
      onNodesChange([{ type: 'select', id, selected: false }]);
    });
    selectedEdges.forEach((id) => {
      onEdgesChange([{ type: 'select', id, selected: false }]);
    });
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, [selectedNodes, selectedEdges, onNodesChange, onEdgesChange]);

  const setContainerDimensions = useCallback((dimensions: { width: number; height: number }) => {
    setContainerDimensionsState(dimensions);
  }, []);

  const zoomIn = useCallback(() => {
    setViewport((vp) => ({
      ...vp,
      zoom: Math.min(vp.zoom + 0.2, maxZoom),
    }));
  }, [maxZoom, setViewport]);

  const zoomOut = useCallback(() => {
    setViewport((vp) => ({
      ...vp,
      zoom: Math.max(vp.zoom - 0.2, minZoom),
    }));
  }, [minZoom, setViewport]);

  const fitView = useCallback((options?: FitViewOptions) => {
    const nodesToFit = options?.nodes ?? nodesRef.current;
    if (nodesToFit.length === 0) return;

    const padding = options?.padding ?? 0.1;
    const minZ = options?.minZoom ?? minZoom;
    const maxZ = options?.maxZoom ?? maxZoom;

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nodesToFit.forEach((node) => {
      const width = node.width ?? node.measured?.width ?? 150;
      const height = node.height ?? node.measured?.height ?? 50;

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    const { width: cWidth, height: cHeight } = containerDimensions;

    const xZoom = cWidth / (boundsWidth * (1 + padding * 2));
    const yZoom = cHeight / (boundsHeight * (1 + padding * 2));
    const zoom = Math.min(xZoom, yZoom, maxZ);
    const clampedZoom = Math.max(zoom, minZ);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setViewport({
      x: cWidth / 2 - centerX * clampedZoom,
      y: cHeight / 2 - centerY * clampedZoom,
      zoom: clampedZoom,
    });
  }, [minZoom, maxZoom, containerDimensions, setViewport]);

  const getNodes = useCallback(() => nodesRef.current, []);
  const getEdges = useCallback(() => edgesRef.current, []);
  const getNode = useCallback((id: string) => nodesRef.current.find((n) => n.id === id), []);
  const getEdge = useCallback((id: string) => edgesRef.current.find((e) => e.id === id), []);

  const addNodes = useCallback((nodesToAdd: Node | Node[]) => {
    const newNodes = Array.isArray(nodesToAdd) ? nodesToAdd : [nodesToAdd];
    setNodes((nds) => [...nds, ...newNodes]);
  }, [setNodes]);

  const addEdges = useCallback((edgesToAdd: Edge | Edge[]) => {
    const newEdges = Array.isArray(edgesToAdd) ? edgesToAdd : [edgesToAdd];
    setEdges((eds) => [...eds, ...newEdges]);
  }, [setEdges]);

  const deleteElements = useCallback((params: { nodes?: Node[]; edges?: Edge[] }) => {
    if (params.nodes) {
      const nodeIds = params.nodes.map((n) => n.id);
      setNodes((nds) => nds.filter((n) => !nodeIds.includes(n.id)));
      // Also remove connected edges
      setEdges((eds) => eds.filter((e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)));
    }
    if (params.edges) {
      const edgeIds = params.edges.map((e) => e.id);
      setEdges((eds) => eds.filter((e) => !edgeIds.includes(e.id)));
    }
  }, [setNodes, setEdges]);

  const reactFlowInstance: ReactFlowInstance = useMemo(
    () => ({
      getNodes,
      setNodes,
      addNodes,
      getNode,
      getEdges,
      setEdges,
      addEdges,
      getEdge,
      deleteElements,
      zoomIn: () => zoomIn(),
      zoomOut: () => zoomOut(),
      setZoom: (zoom: number) => setViewport((vp) => ({ ...vp, zoom })),
      getZoom: () => viewportRef.current.zoom,
      setViewport: (vp: Viewport) => setViewport(vp),
      getViewport: () => viewportRef.current,
      fitView,
      setCenter: (x: number, y: number, options) => {
        const zoom = options?.zoom ?? viewportRef.current.zoom;
        setViewport({
          x: containerDimensions.width / 2 - x * zoom,
          y: containerDimensions.height / 2 - y * zoom,
          zoom,
        });
      },
      toObject: () => ({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: viewportRef.current,
      }),
    }),
    [getNodes, setNodes, addNodes, getNode, getEdges, setEdges, addEdges, getEdge, deleteElements, zoomIn, zoomOut, fitView, setViewport, containerDimensions]
  );

  const contextValue: ReactFlowContextValue = useMemo(
    () => ({
      nodes,
      edges,
      viewport,
      nodeInternals,
      connectionStartHandle,
      connectionPosition,
      connectionNodeId,
      isConnecting,
      selectedNodes,
      selectedEdges,
      panOnDrag,
      minZoom,
      maxZoom,
      nodesDraggable,
      nodesConnectable,
      elementsSelectable,
      snapToGrid,
      snapGrid,
      containerDimensions,
      setNodes,
      setEdges,
      setViewport,
      onNodesChange,
      onEdgesChange,
      onConnect,
      updateNodePosition,
      updateNodeDimensions,
      updateHandleBounds,
      setConnectionStartHandle,
      setConnectionPosition,
      setIsConnecting,
      selectNode,
      selectEdge,
      clearSelection,
      setContainerDimensions,
      zoomIn,
      zoomOut,
      fitView,
      getNodes,
      getEdges,
      getNode,
      getEdge,
      addNodes,
      addEdges,
      deleteElements,
      reactFlowInstance,
    }),
    [
      nodes,
      edges,
      viewport,
      nodeInternals,
      connectionStartHandle,
      connectionPosition,
      connectionNodeId,
      isConnecting,
      selectedNodes,
      selectedEdges,
      panOnDrag,
      minZoom,
      maxZoom,
      nodesDraggable,
      nodesConnectable,
      elementsSelectable,
      snapToGrid,
      snapGrid,
      containerDimensions,
      setNodes,
      setEdges,
      setViewport,
      onNodesChange,
      onEdgesChange,
      onConnect,
      updateNodePosition,
      updateNodeDimensions,
      updateHandleBounds,
      setConnectionStartHandle,
      setConnectionPosition,
      setIsConnecting,
      selectNode,
      selectEdge,
      clearSelection,
      setContainerDimensions,
      zoomIn,
      zoomOut,
      fitView,
      getNodes,
      getEdges,
      getNode,
      getEdge,
      addNodes,
      addEdges,
      deleteElements,
      reactFlowInstance,
    ]
  );

  return (
    <ReactFlowContext.Provider value={contextValue}>
      {children}
    </ReactFlowContext.Provider>
  );
};

export const useStore = (): ReactFlowContextValue => {
  const context = useContext(ReactFlowContext);
  if (!context) {
    throw new Error('useStore must be used within a ReactFlowProvider');
  }
  return context;
};

export { ReactFlowContext };
