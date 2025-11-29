import React from 'react';
import type { EdgeProps } from '../../types';
import { getStepPath, getEdgeCenter } from '../../utils';
import { BaseEdge } from './BaseEdge';

export const StepEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = 'bottom',
  targetPosition = 'top',
  selected,
  animated,
  style,
  markerStart,
  markerEnd,
  label,
  labelStyle,
  labelShowBg,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}) => {
  const path = getStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [centerX, centerY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      path={path}
      style={style}
      selected={selected}
      animated={animated}
      markerStart={markerStart}
      markerEnd={markerEnd}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      labelX={centerX}
      labelY={centerY}
    />
  );
};

export default StepEdge;
