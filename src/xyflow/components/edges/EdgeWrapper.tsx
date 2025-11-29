import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { Edge, EdgeProps, Position, InternalNode } from '../../types';
import { getEdgePath, getEdgeCenter, getHandlePosition } from '../../utils';
import { useStore } from '../../store/ReactFlowContext';
import { BezierEdge } from './BezierEdge';
import { StraightEdge } from './StraightEdge';
import { StepEdge } from './StepEdge';
import { SmoothStepEdge } from './SmoothStepEdge';

interface EdgeWrapperProps {
  edge: Edge;
  EdgeComponent?: React.ComponentType<EdgeProps<any>>;
  onEdgeClick?: (event: any, edge: Edge) => void;
}

export const EdgeWrapper: React.FC<EdgeWrapperProps> = ({
  edge,
  EdgeComponent,
  onEdgeClick,
}) => {
  const { nodes, nodeInternals, selectEdge } = useStore();

  const sourceNode = useMemo(() => {
    return nodes.find((n) => n.id === edge.source);
  }, [nodes, edge.source]);

  const targetNode = useMemo(() => {
    return nodes.find((n) => n.id === edge.target);
  }, [nodes, edge.target]);

  const sourceInternal = nodeInternals.get(edge.source);
  const targetInternal = nodeInternals.get(edge.target);

  if (!sourceNode || !targetNode || edge.hidden) {
    return null;
  }

  // Get source and target positions
  const sourcePosition: Position = sourceNode.sourcePosition ?? 'bottom';
  const targetPosition: Position = targetNode.targetPosition ?? 'top';

  // Calculate source point
  const sourceNodeWidth = sourceNode.width ?? sourceNode.measured?.width ?? 150;
  const sourceNodeHeight = sourceNode.height ?? sourceNode.measured?.height ?? 50;
  const sourceRect = {
    x: sourceNode.position.x,
    y: sourceNode.position.y,
    width: sourceNodeWidth,
    height: sourceNodeHeight,
  };

  // Get handle if specified
  const sourceHandle = edge.sourceHandle
    ? sourceInternal?.handleBounds?.source?.find((h) => h.id === edge.sourceHandle)
    : sourceInternal?.handleBounds?.source?.[0];

  const sourcePoint = getHandlePosition(sourcePosition, sourceRect, sourceHandle);

  // Calculate target point
  const targetNodeWidth = targetNode.width ?? targetNode.measured?.width ?? 150;
  const targetNodeHeight = targetNode.height ?? targetNode.measured?.height ?? 50;
  const targetRect = {
    x: targetNode.position.x,
    y: targetNode.position.y,
    width: targetNodeWidth,
    height: targetNodeHeight,
  };

  const targetHandle = edge.targetHandle
    ? targetInternal?.handleBounds?.target?.find((h) => h.id === edge.targetHandle)
    : targetInternal?.handleBounds?.target?.[0];

  const targetPoint = getHandlePosition(targetPosition, targetRect, targetHandle);

  const [centerX, centerY] = getEdgeCenter({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
  });

  const edgeProps: EdgeProps = {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    sourcePosition,
    targetPosition,
    selected: edge.selected,
    animated: edge.animated,
    style: edge.style,
    data: edge.data,
    markerStart: edge.markerStart,
    markerEnd: edge.markerEnd,
    label: edge.label,
    labelStyle: edge.labelStyle,
    labelShowBg: edge.labelShowBg,
    labelBgStyle: edge.labelBgStyle,
    labelBgPadding: edge.labelBgPadding,
    labelBgBorderRadius: edge.labelBgBorderRadius,
  };

  // Determine which edge component to use
  const renderEdge = () => {
    if (EdgeComponent) {
      return <EdgeComponent {...edgeProps} />;
    }

    switch (edge.type) {
      case 'straight':
        return <StraightEdge {...edgeProps} />;
      case 'step':
        return <StepEdge {...edgeProps} />;
      case 'smoothstep':
        return <SmoothStepEdge {...edgeProps} />;
      case 'bezier':
      case 'default':
      default:
        return <BezierEdge {...edgeProps} />;
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {renderEdge()}
    </View>
  );
};

export default EdgeWrapper;
