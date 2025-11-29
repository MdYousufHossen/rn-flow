import React, { useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useStore } from '../store/ReactFlowContext';
import { getNodesBounds } from '../utils';
import type { MiniMapProps, Node } from '../types';

const getPositionStyles = (position: string) => {
  switch (position) {
    case 'top-left':
      return { top: 10, left: 10 };
    case 'top-right':
      return { top: 10, right: 10 };
    case 'bottom-left':
      return { bottom: 10, left: 10 };
    case 'bottom-right':
    default:
      return { bottom: 10, right: 10 };
  }
};

const MiniMapComponent: React.FC<MiniMapProps> = ({
  nodeColor = '#e2e2e2',
  nodeStrokeColor = '#333',
  nodeStrokeWidth = 1,
  nodeBorderRadius = 2,
  maskColor = 'rgba(0, 0, 0, 0.1)',
  maskStrokeColor = 'rgba(0, 0, 0, 0.3)',
  maskStrokeWidth = 1,
  position = 'bottom-right',
  style,
  width = 200,
  height = 150,
  pannable = true,
  zoomable = true,
}) => {
  const { nodes, viewport, setViewport, containerDimensions } = useStore();

  // Calculate bounds of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 500, height: 500 };
    }
    return getNodesBounds(nodes);
  }, [nodes]);

  // Add padding to bounds
  const padding = 50;
  const paddedBounds = {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };

  // Calculate scale to fit bounds in minimap
  const scale = Math.min(
    width / paddedBounds.width,
    height / paddedBounds.height
  );

  // Calculate viewport rectangle in minimap coordinates
  const viewportWidth = containerDimensions.width / viewport.zoom;
  const viewportHeight = containerDimensions.height / viewport.zoom;
  const viewportX = -viewport.x / viewport.zoom;
  const viewportY = -viewport.y / viewport.zoom;

  // Convert to minimap coordinates
  const minimapViewportX = (viewportX - paddedBounds.x) * scale;
  const minimapViewportY = (viewportY - paddedBounds.y) * scale;
  const minimapViewportWidth = viewportWidth * scale;
  const minimapViewportHeight = viewportHeight * scale;

  const lastTranslation = useRef({ x: 0, y: 0 });

  const handlePanUpdate = useCallback(
    (translationX: number, translationY: number) => {
      // Calculate delta from last position
      const deltaX = translationX - lastTranslation.current.x;
      const deltaY = translationY - lastTranslation.current.y;
      lastTranslation.current = { x: translationX, y: translationY };

      // Convert minimap movement to viewport movement
      const dx = (deltaX / scale) * viewport.zoom;
      const dy = (deltaY / scale) * viewport.zoom;

      setViewport((vp) => ({
        ...vp,
        x: vp.x - dx,
        y: vp.y - dy,
      }));
    },
    [scale, viewport.zoom, setViewport]
  );

  const handlePanEnd = useCallback(() => {
    lastTranslation.current = { x: 0, y: 0 };
  }, []);

  const panGesture = Gesture.Pan()
    .enabled(pannable)
    .onUpdate((event) => {
      runOnJS(handlePanUpdate)(event.translationX, event.translationY);
    })
    .onEnd(() => {
      runOnJS(handlePanEnd)();
    });

  const getNodeColor = useCallback(
    (node: Node) => {
      if (typeof nodeColor === 'function') {
        return nodeColor(node);
      }
      return nodeColor;
    },
    [nodeColor]
  );

  const getNodeStrokeColor = useCallback(
    (node: Node) => {
      if (typeof nodeStrokeColor === 'function') {
        return nodeStrokeColor(node);
      }
      return nodeStrokeColor;
    },
    [nodeStrokeColor]
  );

  const positionStyles = getPositionStyles(position);

  return (
    <View style={[styles.container, { width, height }, positionStyles, style]}>
      <GestureDetector gesture={panGesture}>
        <Svg width={width} height={height}>
          {/* Background */}
          <Rect x={0} y={0} width={width} height={height} fill="#fff" />

          {/* Nodes */}
          <G>
            {nodes.map((node) => {
              if (node.hidden) return null;

              const nodeWidth = (node.width ?? node.measured?.width ?? 150) * scale;
              const nodeHeight = (node.height ?? node.measured?.height ?? 50) * scale;
              const nodeX = (node.position.x - paddedBounds.x) * scale;
              const nodeY = (node.position.y - paddedBounds.y) * scale;

              return (
                <Rect
                  key={node.id}
                  x={nodeX}
                  y={nodeY}
                  width={nodeWidth}
                  height={nodeHeight}
                  fill={getNodeColor(node)}
                  stroke={getNodeStrokeColor(node)}
                  strokeWidth={nodeStrokeWidth}
                  rx={nodeBorderRadius}
                  ry={nodeBorderRadius}
                />
              );
            })}
          </G>

          {/* Viewport indicator */}
          <Rect
            x={minimapViewportX}
            y={minimapViewportY}
            width={minimapViewportWidth}
            height={minimapViewportHeight}
            fill={maskColor}
            stroke={maskStrokeColor}
            strokeWidth={maskStrokeWidth}
          />
        </Svg>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
});

MiniMapComponent.displayName = 'MiniMap';

export const MiniMap = MiniMapComponent;
export default MiniMap;
