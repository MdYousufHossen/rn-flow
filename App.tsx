import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  OnConnect,
} from './src/xyflow';

// Initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    position: { x: 250, y: 5 },
    data: { label: 'Input Node' },
  },
  {
    id: '2',
    position: { x: 100, y: 100 },
    data: { label: 'Default Node' },
  },
  {
    id: '3',
    position: { x: 400, y: 100 },
    data: { label: 'Another Node' },
  },
  {
    id: '4',
    type: 'output',
    position: { x: 250, y: 200 },
    data: { label: 'Output Node' },
  },
];

// Initial edges
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' },
];

export default function App(): React.JSX.Element {
  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, id: `e${connection.source}-${connection.target}` }, eds));
    },
    [setEdges]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>React Native XYFlow</Text>
        <Text style={styles.subtitle}>Pan, zoom, and drag nodes!</Text>
      </View>
      <View style={styles.flowContainer}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          nodesDraggable
          nodesConnectable
          elementsSelectable
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Background variant="dots" gap={20} size={1} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#1a192b',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 4,
  },
  flowContainer: {
    flex: 1,
  },
});
