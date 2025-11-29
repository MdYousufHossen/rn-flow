import { useCallback, useState } from 'react';
import type { Node, NodeChange } from '../types';

type SetNodesFunction = (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
type OnNodesChangeFunction = (changes: NodeChange[]) => void;

export const useNodesState = (
  initialNodes: Node[] = []
): [Node[], SetNodesFunction, OnNodesChangeFunction] => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);

  const onNodesChange: OnNodesChangeFunction = useCallback((changes) => {
    setNodes((nds) => {
      let updatedNodes = [...nds];

      changes.forEach((change) => {
        switch (change.type) {
          case 'position':
            if (change.id) {
              const index = updatedNodes.findIndex((n) => n.id === change.id);
              if (index !== -1) {
                updatedNodes[index] = {
                  ...updatedNodes[index],
                  position: change.position ?? updatedNodes[index].position,
                  dragging: change.dragging ?? updatedNodes[index].dragging,
                };
              }
            }
            break;
          case 'dimensions':
            if (change.id && change.dimensions) {
              const index = updatedNodes.findIndex((n) => n.id === change.id);
              if (index !== -1) {
                updatedNodes[index] = {
                  ...updatedNodes[index],
                  width: change.dimensions.width,
                  height: change.dimensions.height,
                  measured: change.dimensions,
                };
              }
            }
            break;
          case 'select':
            if (change.id) {
              const index = updatedNodes.findIndex((n) => n.id === change.id);
              if (index !== -1) {
                updatedNodes[index] = {
                  ...updatedNodes[index],
                  selected: change.selected,
                };
              }
            }
            break;
          case 'remove':
            if (change.id) {
              updatedNodes = updatedNodes.filter((n) => n.id !== change.id);
            }
            break;
          case 'add':
            if (change.item) {
              updatedNodes.push(change.item);
            }
            break;
          case 'reset':
            updatedNodes = [];
            break;
        }
      });

      return updatedNodes;
    });
  }, []);

  return [nodes, setNodes, onNodesChange];
};

export default useNodesState;
