import { useCallback, useState } from 'react';
import type { Edge, EdgeChange } from '../types';

type SetEdgesFunction = (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
type OnEdgesChangeFunction = (changes: EdgeChange[]) => void;

export const useEdgesState = (
  initialEdges: Edge[] = []
): [Edge[], SetEdgesFunction, OnEdgesChangeFunction] => {
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onEdgesChange: OnEdgesChangeFunction = useCallback((changes) => {
    setEdges((eds) => {
      let updatedEdges = [...eds];

      changes.forEach((change) => {
        switch (change.type) {
          case 'select':
            if (change.id) {
              const index = updatedEdges.findIndex((e) => e.id === change.id);
              if (index !== -1) {
                updatedEdges[index] = {
                  ...updatedEdges[index],
                  selected: change.selected,
                };
              }
            }
            break;
          case 'remove':
            if (change.id) {
              updatedEdges = updatedEdges.filter((e) => e.id !== change.id);
            }
            break;
          case 'add':
            if (change.item) {
              updatedEdges.push(change.item);
            }
            break;
          case 'reset':
            updatedEdges = [];
            break;
        }
      });

      return updatedEdges;
    });
  }, []);

  return [edges, setEdges, onEdgesChange];
};

export default useEdgesState;
