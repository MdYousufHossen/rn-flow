import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NodeProps, NodeData } from '../../types';
import { Handle } from '../Handle';

export const InputNode: React.FC<NodeProps<NodeData> & {
  __handleLayout?: (handleId: string, layout: any, type: 'source' | 'target') => void;
  __onConnectionStart?: (handle: any, nodeId: string) => void;
  __onConnectionEnd?: (targetNodeId: string, targetHandle: any) => void;
}> = ({
  id,
  data,
  selected,
  isConnectable,
  sourcePosition,
  __handleLayout,
  __onConnectionStart,
  __onConnectionEnd,
}) => {
  const label = typeof data.label === 'string' ? data.label : 'Input';

  return (
    <View style={[styles.node, selected && styles.selected]}>
      <View style={styles.content}>
        {typeof data.label === 'string' ? (
          <Text style={styles.label}>{label}</Text>
        ) : (
          data.label
        )}
      </View>
      <Handle
        type="source"
        position={sourcePosition}
        nodeId={id}
        isConnectable={isConnectable}
        onConnectionStart={__onConnectionStart}
        onConnectionEnd={__onConnectionEnd}
        onLayout={(handleId, layout) => __handleLayout?.(handleId, layout, 'source')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  node: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
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
    color: '#155724',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default InputNode;
