import { useStore } from '../store/ReactFlowContext';
import type { ReactFlowInstance } from '../types';

export const useReactFlow = <NodeType = any, EdgeType = any>(): ReactFlowInstance<NodeType, EdgeType> => {
  const store = useStore();
  return store.reactFlowInstance as ReactFlowInstance<NodeType, EdgeType>;
};

export default useReactFlow;
