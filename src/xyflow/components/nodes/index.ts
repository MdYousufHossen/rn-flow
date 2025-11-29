export { DefaultNode } from './DefaultNode';
export { InputNode } from './InputNode';
export { OutputNode } from './OutputNode';

import { DefaultNode } from './DefaultNode';
import { InputNode } from './InputNode';
import { OutputNode } from './OutputNode';
import type { NodeTypes } from '../../types';

export const defaultNodeTypes: NodeTypes = {
  default: DefaultNode,
  input: InputNode,
  output: OutputNode,
};
