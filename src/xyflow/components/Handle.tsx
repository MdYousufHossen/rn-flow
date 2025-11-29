import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { HandleProps, HandleElement, Position } from '../types';

interface HandleComponentProps extends HandleProps {
  nodeId: string;
  onConnectionStart?: (handle: HandleElement, nodeId: string) => void;
  onConnectionEnd?: (targetNodeId: string, targetHandle: HandleElement | null) => void;
  onLayout?: (handleId: string, layout: { x: number; y: number; width: number; height: number }) => void;
}

const getPositionStyles = (position: Position): object => {
  switch (position) {
    case 'top':
      return { top: -6, left: '50%', marginLeft: -6 };
    case 'right':
      return { right: -6, top: '50%', marginTop: -6 };
    case 'bottom':
      return { bottom: -6, left: '50%', marginLeft: -6 };
    case 'left':
      return { left: -6, top: '50%', marginTop: -6 };
    default:
      return {};
  }
};

export const Handle: React.FC<HandleComponentProps> = ({
  type,
  position,
  id,
  isConnectable = true,
  style,
  nodeId,
  onConnectionStart,
  onConnectionEnd,
  onLayout,
}) => {
  const handleId = id || type;
  const layoutRef = useRef<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 12,
    height: 12,
  });

  const scale = useSharedValue(1);
  const isPressed = useSharedValue(false);

  const handleLayoutChange = useCallback(
    (event: LayoutChangeEvent) => {
      const { x, y, width, height } = event.nativeEvent.layout;
      layoutRef.current = { x, y, width, height };

      onLayout?.(handleId, { x, y, width, height });
    },
    [handleId, onLayout]
  );

  const startConnection = useCallback(() => {
    if (!isConnectable) return;

    const handleElement: HandleElement = {
      id: handleId,
      type,
      position,
      x: layoutRef.current.x,
      y: layoutRef.current.y,
      width: layoutRef.current.width,
      height: layoutRef.current.height,
    };

    onConnectionStart?.(handleElement, nodeId);
  }, [handleId, type, position, nodeId, isConnectable, onConnectionStart]);

  const endConnection = useCallback(() => {
    const handleElement: HandleElement = {
      id: handleId,
      type,
      position,
      x: layoutRef.current.x,
      y: layoutRef.current.y,
      width: layoutRef.current.width,
      height: layoutRef.current.height,
    };

    onConnectionEnd?.(nodeId, handleElement);
  }, [handleId, type, position, nodeId, onConnectionEnd]);

  const panGesture = Gesture.Pan()
    .enabled(isConnectable && type === 'source')
    .onBegin(() => {
      isPressed.value = true;
      scale.value = withSpring(1.2);
      runOnJS(startConnection)();
    })
    .onFinalize(() => {
      isPressed.value = false;
      scale.value = withSpring(1);
      runOnJS(endConnection)();
    });

  const tapGesture = Gesture.Tap()
    .enabled(isConnectable && type === 'target')
    .onEnd(() => {
      runOnJS(endConnection)();
    });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const positionStyles = getPositionStyles(position);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        onLayout={handleLayoutChange}
        style={[
          styles.handle,
          positionStyles,
          type === 'source' ? styles.source : styles.target,
          !isConnectable && styles.notConnectable,
          animatedStyle,
          style,
        ]}
      />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 10,
  },
  source: {
    backgroundColor: '#555',
  },
  target: {
    backgroundColor: '#555',
  },
  notConnectable: {
    opacity: 0.5,
  },
});

export default Handle;
