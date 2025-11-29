import React, { useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { Node, NodeProps, Position, HandleElement, XYPosition } from '../types';
import { useStore } from '../store/ReactFlowContext';
import { snapPosition } from '../utils';

interface NodeWrapperProps {
  node: Node;
  NodeComponent: React.ComponentType<NodeProps<any>>;
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  elementsSelectable?: boolean;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
  onNodeClick?: (event: any, node: Node) => void;
  onNodeDoubleClick?: (event: any, node: Node) => void;
  onNodeDragStart?: (event: any, node: Node) => void;
  onNodeDrag?: (event: any, node: Node) => void;
  onNodeDragStop?: (event: any, node: Node) => void;
}

export const NodeWrapper: React.FC<NodeWrapperProps> = ({
  node,
  NodeComponent,
  nodesDraggable = true,
  nodesConnectable = true,
  elementsSelectable = true,
  snapToGrid = false,
  snapGrid = [15, 15],
  onNodeClick,
  onNodeDoubleClick,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
}) => {
  const {
    viewport,
    updateNodePosition,
    updateNodeDimensions,
    updateHandleBounds,
    selectNode,
    clearSelection,
    setConnectionStartHandle,
    setConnectionPosition,
    setIsConnecting,
    isConnecting,
    connectionStartHandle,
    onConnect,
  } = useStore();

  const isDraggable = node.draggable ?? nodesDraggable;
  const isSelectable = node.selectable ?? elementsSelectable;
  const isConnectable = node.connectable ?? nodesConnectable;

  const translateX = useSharedValue(node.position.x);
  const translateY = useSharedValue(node.position.y);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(node.zIndex ?? 0);

  const startPosition = useRef<XYPosition>({ x: 0, y: 0 });
  const currentPosition = useRef<XYPosition>(node.position);
  const handleBoundsRef = useRef<{ source?: HandleElement[]; target?: HandleElement[] }>({});

  // Update shared values when node position changes externally
  React.useEffect(() => {
    translateX.value = node.position.x;
    translateY.value = node.position.y;
    currentPosition.current = node.position;
  }, [node.position.x, node.position.y]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      updateNodeDimensions(node.id, { width, height });
    },
    [node.id, updateNodeDimensions]
  );

  const handleHandleLayout = useCallback(
    (handleId: string, layout: { x: number; y: number; width: number; height: number }, type: 'source' | 'target') => {
      const handleElement: HandleElement = {
        id: handleId,
        type,
        position: type === 'source' ? (node.sourcePosition ?? 'bottom') : (node.targetPosition ?? 'top'),
        ...layout,
      };

      if (type === 'source') {
        handleBoundsRef.current.source = [...(handleBoundsRef.current.source ?? []).filter((h) => h.id !== handleId), handleElement];
      } else {
        handleBoundsRef.current.target = [...(handleBoundsRef.current.target ?? []).filter((h) => h.id !== handleId), handleElement];
      }

      updateHandleBounds(node.id, handleBoundsRef.current);
    },
    [node.id, node.sourcePosition, node.targetPosition, updateHandleBounds]
  );

  const handleConnectionStart = useCallback(
    (handle: HandleElement, nodeId: string) => {
      setConnectionStartHandle(handle, nodeId);
      setIsConnecting(true);
    },
    [setConnectionStartHandle, setIsConnecting]
  );

  const handleConnectionEnd = useCallback(
    (targetNodeId: string, targetHandle: HandleElement | null) => {
      if (isConnecting && connectionStartHandle) {
        // Create connection
        onConnect({
          source: connectionStartHandle.type === 'source' ? node.id : targetNodeId,
          sourceHandle: connectionStartHandle.type === 'source' ? connectionStartHandle.id : targetHandle?.id ?? null,
          target: connectionStartHandle.type === 'target' ? node.id : targetNodeId,
          targetHandle: connectionStartHandle.type === 'target' ? connectionStartHandle.id : targetHandle?.id ?? null,
        });
      }

      setConnectionStartHandle(null, null);
      setConnectionPosition(null);
      setIsConnecting(false);
    },
    [isConnecting, connectionStartHandle, node.id, onConnect, setConnectionStartHandle, setConnectionPosition, setIsConnecting]
  );

  const onDragStart = useCallback(() => {
    startPosition.current = { ...currentPosition.current };
    zIndex.value = 1000;
    scale.value = withSpring(1.02);

    if (isSelectable) {
      selectNode(node.id);
    }

    updateNodePosition(node.id, currentPosition.current, true);
    onNodeDragStart?.({}, node);
  }, [node, isSelectable, selectNode, updateNodePosition, onNodeDragStart, zIndex, scale]);

  const onDragUpdate = useCallback(
    (translationX: number, translationY: number) => {
      let newX = startPosition.current.x + translationX / viewport.zoom;
      let newY = startPosition.current.y + translationY / viewport.zoom;

      if (snapToGrid) {
        const snapped = snapPosition({ x: newX, y: newY }, snapGrid);
        newX = snapped.x;
        newY = snapped.y;
      }

      currentPosition.current = { x: newX, y: newY };
      translateX.value = newX;
      translateY.value = newY;

      onNodeDrag?.({}, { ...node, position: currentPosition.current });
    },
    [viewport.zoom, snapToGrid, snapGrid, node, onNodeDrag, translateX, translateY]
  );

  const onDragEnd = useCallback(() => {
    zIndex.value = node.zIndex ?? 0;
    scale.value = withSpring(1);

    updateNodePosition(node.id, currentPosition.current, false);
    onNodeDragStop?.({}, { ...node, position: currentPosition.current });
  }, [node, updateNodePosition, onNodeDragStop, zIndex, scale]);

  const panGesture = Gesture.Pan()
    .enabled(isDraggable)
    .onBegin(() => {
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      runOnJS(onDragUpdate)(event.translationX, event.translationY);
    })
    .onEnd(() => {
      runOnJS(onDragEnd)();
    });

  const tapGesture = Gesture.Tap()
    .enabled(isSelectable)
    .onEnd(() => {
      runOnJS(selectNode)(node.id, false);
      onNodeClick?.({}, node);
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      onNodeDoubleClick?.({}, node);
    });

  const composedGesture = Gesture.Exclusive(doubleTapGesture, Gesture.Simultaneous(panGesture, tapGesture));

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ] as const,
      zIndex: zIndex.value,
    };
  });

  const nodeProps: NodeProps = useMemo(
    () => ({
      id: node.id,
      type: node.type ?? 'default',
      data: node.data,
      selected: node.selected ?? false,
      isConnectable,
      xPos: node.position.x,
      yPos: node.position.y,
      dragging: node.dragging ?? false,
      zIndex: node.zIndex ?? 0,
      sourcePosition: node.sourcePosition ?? 'bottom',
      targetPosition: node.targetPosition ?? 'top',
    }),
    [node, isConnectable]
  );

  if (node.hidden) {
    return null;
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        onLayout={handleLayout}
        style={[
          styles.nodeWrapper,
          animatedStyle,
          node.selected && styles.selected,
          node.style,
        ]}
      >
        <NodeComponent
          {...nodeProps}
          // Pass handle callbacks as context
          // @ts-ignore - custom props for handle management
          __handleLayout={handleHandleLayout}
          __onConnectionStart={handleConnectionStart}
          __onConnectionEnd={handleConnectionEnd}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  nodeWrapper: {
    position: 'absolute',
  },
  selected: {
    // Selection styling handled by individual node components
  },
});

export default NodeWrapper;
