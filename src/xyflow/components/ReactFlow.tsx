import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { ReactFlowProps, Node, Edge, NodeProps, Viewport } from '../types';
import { ReactFlowProvider, useStore } from '../store/ReactFlowContext';
import { NodeWrapper } from './NodeWrapper';
import { EdgeWrapper } from './edges';
import { defaultNodeTypes } from './nodes';
import { defaultEdgeTypes } from './edges';

interface ReactFlowInnerProps extends ReactFlowProps {
  // Internal props
}

const ReactFlowInner: React.FC<ReactFlowInnerProps> = ({
  nodes: propNodes,
  edges: propEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onEdgeClick,
  onPaneClick,
  nodeTypes: customNodeTypes,
  edgeTypes: customEdgeTypes,
  defaultEdgeOptions,
  snapToGrid = false,
  snapGrid = [15, 15],
  nodesDraggable = true,
  nodesConnectable = true,
  elementsSelectable = true,
  panOnDrag = true,
  minZoom = 0.5,
  maxZoom = 2,
  fitView = false,
  fitViewOptions,
  zoomOnPinch = true,
  style,
  children,
}) => {
  const store = useStore();
  const {
    viewport,
    setViewport,
    nodes: storeNodes,
    edges: storeEdges,
    setNodes,
    setEdges,
    setContainerDimensions,
    clearSelection,
    fitView: fitViewFn,
  } = store;

  // Use prop nodes/edges if provided, otherwise use store
  const nodes = propNodes ?? storeNodes;
  const edges = propEdges ?? storeEdges;

  // Sync prop nodes/edges to store if provided
  useEffect(() => {
    if (propNodes) {
      setNodes(propNodes);
    }
  }, [propNodes, setNodes]);

  useEffect(() => {
    if (propEdges) {
      setEdges(propEdges);
    }
  }, [propEdges, setEdges]);

  // Fit view on mount if requested
  const hasInitialFit = useRef(false);
  useEffect(() => {
    if (fitView && !hasInitialFit.current && nodes.length > 0) {
      hasInitialFit.current = true;
      setTimeout(() => {
        fitViewFn(fitViewOptions);
      }, 100);
    }
  }, [fitView, fitViewOptions, nodes.length, fitViewFn]);

  // Merge node types
  const nodeTypes = useMemo(
    () => ({ ...defaultNodeTypes, ...customNodeTypes }),
    [customNodeTypes]
  );

  // Merge edge types
  const edgeTypes = useMemo(
    () => ({ ...defaultEdgeTypes, ...customEdgeTypes }),
    [customEdgeTypes]
  );

  // Animated values for viewport
  const translateX = useSharedValue(viewport.x);
  const translateY = useSharedValue(viewport.y);
  const scale = useSharedValue(viewport.zoom);

  // Keep shared values in sync with viewport
  useEffect(() => {
    translateX.value = viewport.x;
    translateY.value = viewport.y;
    scale.value = viewport.zoom;
  }, [viewport.x, viewport.y, viewport.zoom]);

  const startTranslate = useRef({ x: 0, y: 0 });
  const startScale = useRef(1);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setContainerDimensions({ width, height });
    },
    [setContainerDimensions]
  );

  const updateViewport = useCallback(
    (x: number, y: number, zoom: number) => {
      setViewport({ x, y, zoom });
    },
    [setViewport]
  );

  const handlePaneClick = useCallback(() => {
    clearSelection();
    onPaneClick?.({});
  }, [clearSelection, onPaneClick]);

  // Pan gesture
  const isPanEnabled = typeof panOnDrag === 'boolean' ? panOnDrag : true;
  const panGesture = Gesture.Pan()
    .enabled(isPanEnabled)
    .onBegin(() => {
      startTranslate.current = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((event) => {
      translateX.value = startTranslate.current.x + event.translationX;
      translateY.value = startTranslate.current.y + event.translationY;
    })
    .onEnd(() => {
      runOnJS(updateViewport)(translateX.value, translateY.value, scale.value);
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .enabled(zoomOnPinch)
    .onBegin(() => {
      startScale.current = scale.value;
    })
    .onUpdate((event) => {
      const newScale = Math.min(Math.max(startScale.current * event.scale, minZoom), maxZoom);
      scale.value = newScale;
    })
    .onEnd(() => {
      runOnJS(updateViewport)(translateX.value, translateY.value, scale.value);
    });

  // Tap gesture for pane click
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(handlePaneClick)();
  });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(
    Gesture.Race(panGesture, pinchGesture),
    tapGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ] as const,
    };
  });

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.gestureContainer}>
          {/* Background and other children rendered before the viewport */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              const displayName = (child.type as any)?.displayName || (child.type as any)?.name;
              if (displayName === 'Background') {
                return child;
              }
            }
            return null;
          })}

          {/* Viewport container with pan/zoom */}
          <Animated.View style={[styles.viewport, animatedStyle]}>
            {/* Render edges first (below nodes) */}
            <View style={styles.edgesContainer} pointerEvents="none">
              {edges.map((edge) => {
                const EdgeComponent = edgeTypes[edge.type ?? 'default'];
                return (
                  <EdgeWrapper
                    key={edge.id}
                    edge={{ ...edge, ...defaultEdgeOptions }}
                    EdgeComponent={EdgeComponent}
                    onEdgeClick={onEdgeClick}
                  />
                );
              })}
            </View>

            {/* Render nodes */}
            <View style={styles.nodesContainer}>
              {nodes.map((node) => {
                const NodeComponent = nodeTypes[node.type ?? 'default'] ?? nodeTypes.default;
                return (
                  <NodeWrapper
                    key={node.id}
                    node={node}
                    NodeComponent={NodeComponent as React.ComponentType<NodeProps<any>>}
                    nodesDraggable={nodesDraggable}
                    nodesConnectable={nodesConnectable}
                    elementsSelectable={elementsSelectable}
                    snapToGrid={snapToGrid}
                    snapGrid={snapGrid}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onNodeDragStart={onNodeDragStart}
                    onNodeDrag={onNodeDrag}
                    onNodeDragStop={onNodeDragStop}
                  />
                );
              })}
            </View>
          </Animated.View>

          {/* Controls, MiniMap, and other UI rendered on top */}
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              const displayName = (child.type as any)?.displayName || (child.type as any)?.name;
              if (displayName !== 'Background') {
                return child;
              }
            }
            return null;
          })}
        </View>
      </GestureDetector>
    </View>
  );
};

// Main ReactFlow component that wraps everything in a provider
export const ReactFlow: React.FC<ReactFlowProps> = ({
  defaultNodes,
  defaultEdges,
  defaultViewport,
  onNodesChange,
  onEdgesChange,
  onConnect,
  minZoom = 0.5,
  maxZoom = 2,
  nodesDraggable = true,
  nodesConnectable = true,
  elementsSelectable = true,
  panOnDrag = true,
  snapToGrid = false,
  snapGrid = [15, 15],
  ...props
}) => {
  return (
    <GestureHandlerRootView style={styles.rootView}>
      <ReactFlowProvider
        initialNodes={props.nodes ?? defaultNodes ?? []}
        initialEdges={props.edges ?? defaultEdges ?? []}
        defaultViewport={defaultViewport}
        onNodesChangeCallback={onNodesChange}
        onEdgesChangeCallback={onEdgesChange}
        onConnectCallback={onConnect}
        minZoom={minZoom}
        maxZoom={maxZoom}
        nodesDraggable={nodesDraggable}
        nodesConnectable={nodesConnectable}
        elementsSelectable={elementsSelectable}
        panOnDrag={typeof panOnDrag === 'boolean' ? panOnDrag : true}
        snapToGrid={snapToGrid}
        snapGrid={snapGrid}
      >
        <ReactFlowInner
          {...props}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          minZoom={minZoom}
          maxZoom={maxZoom}
          nodesDraggable={nodesDraggable}
          nodesConnectable={nodesConnectable}
          elementsSelectable={elementsSelectable}
          panOnDrag={typeof panOnDrag === 'boolean' ? panOnDrag : true}
          snapToGrid={snapToGrid}
          snapGrid={snapGrid}
        />
      </ReactFlowProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  gestureContainer: {
    flex: 1,
  },
  viewport: {
    ...StyleSheet.absoluteFillObject,
  },
  edgesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  nodesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});

export default ReactFlow;
