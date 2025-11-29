export { BaseEdge } from './BaseEdge';
export { BezierEdge } from './BezierEdge';
export { StraightEdge } from './StraightEdge';
export { StepEdge } from './StepEdge';
export { SmoothStepEdge } from './SmoothStepEdge';
export { EdgeWrapper } from './EdgeWrapper';

import { BezierEdge } from './BezierEdge';
import { StraightEdge } from './StraightEdge';
import { StepEdge } from './StepEdge';
import { SmoothStepEdge } from './SmoothStepEdge';
import type { EdgeTypes } from '../../types';

export const defaultEdgeTypes: EdgeTypes = {
  default: BezierEdge,
  bezier: BezierEdge,
  straight: StraightEdge,
  step: StepEdge,
  smoothstep: SmoothStepEdge,
};
