import { ReactNode } from 'react';
import { ViewStyle, TextStyle } from 'react-native';

// Position types
export interface XYPosition {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Rect extends XYPosition, Dimensions {}

// Handle types
export type HandleType = 'source' | 'target';
export type Position = 'top' | 'right' | 'bottom' | 'left';

export interface HandleProps {
  type: HandleType;
  position: Position;
  id?: string;
  isConnectable?: boolean;
  style?: ViewStyle;
  onConnect?: (params: Connection) => void;
}

export interface HandleElement {
  id: string;
  type: HandleType;
  position: Position;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Connection types
export interface Connection {
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
}

export interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPosition: Position;
  toPosition: Position;
}

// Node types
export type NodeType = 'default' | 'input' | 'output' | 'custom';

export interface NodeData {
  label?: string | ReactNode;
  [key: string]: unknown;
}

export interface Node<T = NodeData> {
  id: string;
  type?: NodeType;
  position: XYPosition;
  data: T;
  style?: ViewStyle;
  className?: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  hidden?: boolean;
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  width?: number;
  height?: number;
  parentId?: string;
  zIndex?: number;
  extent?: 'parent' | [[number, number], [number, number]];
  expandParent?: boolean;
  measured?: {
    width?: number;
    height?: number;
  };
}

export interface InternalNode<T = NodeData> extends Node<T> {
  positionAbsolute: XYPosition;
  handleBounds?: {
    source?: HandleElement[];
    target?: HandleElement[];
  };
}

export interface NodeProps<T = NodeData> {
  id: string;
  type: NodeType;
  data: T;
  selected: boolean;
  isConnectable: boolean;
  xPos: number;
  yPos: number;
  dragging: boolean;
  zIndex: number;
  sourcePosition: Position;
  targetPosition: Position;
}

// Edge types
export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';

export interface EdgeMarker {
  type: 'arrow' | 'arrowclosed';
  color?: string;
  width?: number;
  height?: number;
  orient?: string;
}

export interface Edge<T = unknown> {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: EdgeType;
  style?: ViewStyle;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  data?: T;
  selected?: boolean;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  label?: string | ReactNode;
  labelStyle?: TextStyle;
  labelShowBg?: boolean;
  labelBgStyle?: ViewStyle;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  zIndex?: number;
  interactionWidth?: number;
}

export interface EdgeProps<T = unknown> {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  selected?: boolean;
  animated?: boolean;
  style?: ViewStyle;
  data?: T;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  label?: string | ReactNode;
  labelStyle?: TextStyle;
  labelShowBg?: boolean;
  labelBgStyle?: ViewStyle;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
}

// Viewport
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportHelperFunctions {
  zoomIn: (options?: { duration?: number }) => void;
  zoomOut: (options?: { duration?: number }) => void;
  setZoom: (zoom: number, options?: { duration?: number }) => void;
  getZoom: () => number;
  setViewport: (viewport: Viewport, options?: { duration?: number }) => void;
  getViewport: () => Viewport;
  fitView: (options?: FitViewOptions) => void;
  setCenter: (x: number, y: number, options?: { zoom?: number; duration?: number }) => void;
}

export interface FitViewOptions {
  padding?: number;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;
  nodes?: Node[];
}

// ReactFlow instance
export interface ReactFlowInstance<NodeType = Node, EdgeType = Edge> extends ViewportHelperFunctions {
  getNodes: () => NodeType[];
  setNodes: (nodes: NodeType[] | ((nodes: NodeType[]) => NodeType[])) => void;
  addNodes: (nodes: NodeType | NodeType[]) => void;
  getNode: (id: string) => NodeType | undefined;
  getEdges: () => EdgeType[];
  setEdges: (edges: EdgeType[] | ((edges: EdgeType[]) => EdgeType[])) => void;
  addEdges: (edges: EdgeType | EdgeType[]) => void;
  getEdge: (id: string) => EdgeType | undefined;
  toObject: () => { nodes: NodeType[]; edges: EdgeType[]; viewport: Viewport };
  deleteElements: (params: { nodes?: NodeType[]; edges?: EdgeType[] }) => void;
}

// Event types
export interface NodeChange {
  type: 'position' | 'dimensions' | 'select' | 'remove' | 'add' | 'reset';
  id?: string;
  position?: XYPosition;
  positionAbsolute?: XYPosition;
  dragging?: boolean;
  selected?: boolean;
  dimensions?: Dimensions;
  item?: Node;
}

export interface EdgeChange {
  type: 'select' | 'remove' | 'add' | 'reset';
  id?: string;
  selected?: boolean;
  item?: Edge;
}

export type OnNodesChange = (changes: NodeChange[]) => void;
export type OnEdgesChange = (changes: EdgeChange[]) => void;
export type OnConnect = (connection: Connection) => void;

export type NodeDragHandler = (event: any, node: Node, nodes?: Node[]) => void;
export type SelectionChangeHandler = (params: { nodes: Node[]; edges: Edge[] }) => void;

// Component props
export interface ReactFlowProps<N = Node, E = Edge> {
  nodes?: N[];
  edges?: E[];
  defaultNodes?: N[];
  defaultEdges?: E[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeClick?: (event: any, node: N) => void;
  onNodeDoubleClick?: (event: any, node: N) => void;
  onNodeDragStart?: NodeDragHandler;
  onNodeDrag?: NodeDragHandler;
  onNodeDragStop?: NodeDragHandler;
  onEdgeClick?: (event: any, edge: E) => void;
  onPaneClick?: (event: any) => void;
  onPaneScroll?: (event: any) => void;
  onSelectionChange?: SelectionChangeHandler;
  nodeTypes?: Record<string, React.ComponentType<NodeProps<any>>>;
  edgeTypes?: Record<string, React.ComponentType<EdgeProps<any>>>;
  defaultEdgeOptions?: Partial<E>;
  connectionLineStyle?: ViewStyle;
  connectionLineType?: EdgeType;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
  onlyRenderVisibleElements?: boolean;
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  nodesFocusable?: boolean;
  edgesFocusable?: boolean;
  edgesUpdatable?: boolean;
  elementsSelectable?: boolean;
  selectNodesOnDrag?: boolean;
  panOnDrag?: boolean | number[];
  minZoom?: number;
  maxZoom?: number;
  defaultViewport?: Viewport;
  fitView?: boolean;
  fitViewOptions?: FitViewOptions;
  panOnScroll?: boolean;
  panOnScrollSpeed?: number;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  zoomOnDoubleClick?: boolean;
  preventScrolling?: boolean;
  attributionPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  proOptions?: { hideAttribution?: boolean };
  style?: ViewStyle;
  children?: ReactNode;
}

export interface BackgroundProps {
  variant?: 'dots' | 'lines' | 'cross';
  gap?: number | [number, number];
  size?: number;
  offset?: number;
  color?: string;
  style?: ViewStyle;
  lineWidth?: number;
}

export interface ControlsProps {
  showZoom?: boolean;
  showFitView?: boolean;
  showInteractive?: boolean;
  fitViewOptions?: FitViewOptions;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onInteractiveChange?: (isInteractive: boolean) => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: ViewStyle;
}

export interface MiniMapProps<N = Node> {
  nodeColor?: string | ((node: N) => string);
  nodeStrokeColor?: string | ((node: N) => string);
  nodeStrokeWidth?: number;
  nodeBorderRadius?: number;
  maskColor?: string;
  maskStrokeColor?: string;
  maskStrokeWidth?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: ViewStyle;
  width?: number;
  height?: number;
  ariaLabel?: string;
  inversePan?: boolean;
  zoomStep?: number;
  pannable?: boolean;
  zoomable?: boolean;
}

// Utility types
export type NodeTypes = Record<string, React.ComponentType<NodeProps<any>>>;
export type EdgeTypes = Record<string, React.ComponentType<EdgeProps<any>>>;

export interface IsValidConnection {
  (connection: Connection): boolean;
}
