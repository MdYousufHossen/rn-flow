import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NodeProps, NodeData } from '../../types';
import { Handle } from '../Handle';

export const OutputNode: React.FC<NodeProps<NodeData> & {
  __handleLayout?: (handleId: string, layout: any, type: 'source' | 'target') => void;
  __onConnectionStart?: (handle: any, nodeId: string) => void;
  __onConnectionEnd?: (targetNodeId: string, targetHandle: any) => void;
}> = ({
  id,
  data,
  selected,
  isConnectable,
  targetPosition,
  __handleLayout,
  __onConnectionStart,
  __onConnectionEnd,
}) => {
  const label = typeof data.label === 'string' ? data.label : 'Output';

  return (
    <View style={[styles.node, selected && styles.selected]}>
      <Handle
        type="target"
        position={targetPosition}
        nodeId={id}
        isConnectable={isConnectable}
        onConnectionStart={__onConnectionStart}
        onConnectionEnd={__onConnectionEnd}
        onLayout={(handleId, layout) => __handleLayout?.(handleId, layout, 'target')}
      />
      <View style={styles.content}>
        {typeof data.label === 'string' ? (
          <Text style={styles.label}>{label}</Text>
        ) : (
          data.label
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  node: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 3,
    minWidth: 150,
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selected: {
    borderColor: '#0041d0',
    borderWidth: 2,
    shadowColor: '#0041d0',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  content: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    color: '#721c24',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default OutputNode;
