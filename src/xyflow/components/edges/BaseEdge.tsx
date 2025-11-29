import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, Marker, Polygon } from 'react-native-svg';
import Animated, { useAnimatedProps, withRepeat, withTiming, useSharedValue, useDerivedValue } from 'react-native-reanimated';
import type { EdgeProps } from '../../types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface BaseEdgeProps {
  path: string;
  style?: any;
  markerEnd?: { type: string; color?: string };
  markerStart?: { type: string; color?: string };
  label?: string | React.ReactNode;
  labelStyle?: any;
  labelShowBg?: boolean;
  labelBgStyle?: any;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  labelX?: number;
  labelY?: number;
  selected?: boolean;
  animated?: boolean;
  interactionWidth?: number;
  edgeColor?: string;
}

export const BaseEdge: React.FC<BaseEdgeProps> = ({
  path,
  style,
  markerEnd,
  markerStart,
  label,
  labelStyle,
  labelShowBg = true,
  labelBgStyle,
  labelBgPadding = [2, 4],
  labelBgBorderRadius = 2,
  labelX = 0,
  labelY = 0,
  selected = false,
  animated = false,
  interactionWidth = 20,
  edgeColor = '#b1b1b7',
}) => {
  const dashOffset = useSharedValue(0);

  React.useEffect(() => {
    if (animated) {
      dashOffset.value = withRepeat(
        withTiming(-20, { duration: 500 }),
        -1,
        false
      );
    }
  }, [animated, dashOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const strokeColor = selected ? '#0041d0' : edgeColor;
  const strokeWidth = selected ? 2 : 1;

  return (
    <>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          {markerEnd?.type === 'arrow' || markerEnd?.type === 'arrowclosed' ? (
            <Marker
              id="arrowEnd"
              markerWidth={12.5}
              markerHeight={12.5}
              refX={10}
              refY={6}
              orient="auto"
              markerUnits="strokeWidth"
            >
              <Polygon
                points="0 2, 12 6, 0 10"
                fill={markerEnd.color ?? strokeColor}
              />
            </Marker>
          ) : null}
          {markerStart?.type === 'arrow' || markerStart?.type === 'arrowclosed' ? (
            <Marker
              id="arrowStart"
              markerWidth={12.5}
              markerHeight={12.5}
              refX={2}
              refY={6}
              orient="auto-start-reverse"
              markerUnits="strokeWidth"
            >
              <Polygon
                points="0 2, 12 6, 0 10"
                fill={markerStart.color ?? strokeColor}
              />
            </Marker>
          ) : null}
        </Defs>

        {/* Invisible interaction path */}
        <Path
          d={path}
          stroke="transparent"
          strokeWidth={interactionWidth}
          fill="none"
        />

        {/* Visible edge path */}
        {animated ? (
          <AnimatedPath
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray="5,5"
            animatedProps={animatedProps}
            markerEnd={markerEnd ? 'url(#arrowEnd)' : undefined}
            markerStart={markerStart ? 'url(#arrowStart)' : undefined}
          />
        ) : (
          <Path
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            markerEnd={markerEnd ? 'url(#arrowEnd)' : undefined}
            markerStart={markerStart ? 'url(#arrowStart)' : undefined}
          />
        )}
      </Svg>

      {/* Edge label */}
      {label && (
        <View
          style={[
            styles.labelContainer,
            { left: labelX - 50, top: labelY - 10 },
          ]}
          pointerEvents="none"
        >
          {labelShowBg && (
            <View
              style={[
                styles.labelBg,
                {
                  paddingHorizontal: labelBgPadding[1],
                  paddingVertical: labelBgPadding[0],
                  borderRadius: labelBgBorderRadius,
                },
                labelBgStyle,
              ]}
            />
          )}
          {typeof label === 'string' ? (
            <Text style={[styles.label, labelStyle]}>{label}</Text>
          ) : (
            label
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    position: 'absolute',
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBg: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e2e2',
  },
  label: {
    fontSize: 10,
    color: '#222',
    textAlign: 'center',
  },
});

export default BaseEdge;
