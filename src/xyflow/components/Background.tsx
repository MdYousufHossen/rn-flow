import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Pattern, Rect, Circle, Line, Defs } from 'react-native-svg';
import { useStore } from '../store/ReactFlowContext';
import type { BackgroundProps } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BackgroundComponent: React.FC<BackgroundProps> = ({
  variant = 'dots',
  gap = 20,
  size = 1,
  offset = 0,
  color = '#91919a',
  style,
  lineWidth = 1,
}) => {
  const { viewport, containerDimensions } = useStore();
  const { x: viewportX, y: viewportY, zoom } = viewport;

  const gapX = Array.isArray(gap) ? gap[0] : gap;
  const gapY = Array.isArray(gap) ? gap[1] : gap;

  const scaledGapX = gapX * zoom;
  const scaledGapY = gapY * zoom;
  const scaledSize = size * zoom;

  // Calculate pattern offset based on viewport position
  const patternOffsetX = (viewportX % scaledGapX + scaledGapX) % scaledGapX;
  const patternOffsetY = (viewportY % scaledGapY + scaledGapY) % scaledGapY;

  const patternId = `pattern-${variant}`;

  const renderPattern = useMemo(() => {
    switch (variant) {
      case 'dots':
        return (
          <Circle
            cx={scaledGapX / 2}
            cy={scaledGapY / 2}
            r={scaledSize}
            fill={color}
          />
        );
      case 'lines':
        return (
          <Line
            x1={0}
            y1={0}
            x2={0}
            y2={scaledGapY}
            stroke={color}
            strokeWidth={lineWidth * zoom}
          />
        );
      case 'cross':
        return (
          <>
            <Line
              x1={scaledGapX / 2 - scaledSize * 2}
              y1={scaledGapY / 2}
              x2={scaledGapX / 2 + scaledSize * 2}
              y2={scaledGapY / 2}
              stroke={color}
              strokeWidth={lineWidth * zoom}
            />
            <Line
              x1={scaledGapX / 2}
              y1={scaledGapY / 2 - scaledSize * 2}
              x2={scaledGapX / 2}
              y2={scaledGapY / 2 + scaledSize * 2}
              stroke={color}
              strokeWidth={lineWidth * zoom}
            />
          </>
        );
      default:
        return null;
    }
  }, [variant, scaledGapX, scaledGapY, scaledSize, color, lineWidth, zoom]);

  const { width, height } = containerDimensions;

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id={patternId}
            x={patternOffsetX}
            y={patternOffsetY}
            width={scaledGapX}
            height={scaledGapY}
            patternUnits="userSpaceOnUse"
          >
            {renderPattern}
          </Pattern>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={`url(#${patternId})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f8f8f8',
  },
});

BackgroundComponent.displayName = 'Background';

export const Background = BackgroundComponent;
export default Background;
