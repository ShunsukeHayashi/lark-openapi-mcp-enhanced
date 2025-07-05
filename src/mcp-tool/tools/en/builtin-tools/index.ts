import { docxBuiltinToolName, docxBuiltinTools } from './docx/builtin';
import { imBuiltinToolName, imBuiltinTools } from './im/buildin';
import { systemBuiltinToolName, systemBuiltinTools } from './system/builtin';
import { GenesisToolName, genesisTools } from './genesis';
import { CompleteToolName, completeTools } from './complete/all-functions';
import { CachedToolName, cachedTools } from './cache';
import { SecurityToolNames, SecurityTools } from './security';

export const BuiltinTools = [
  ...docxBuiltinTools,
  ...imBuiltinTools,
  ...systemBuiltinTools,
  ...genesisTools,
  ...completeTools,
  ...cachedTools,
  ...SecurityTools,
];

export type BuiltinToolName =
  | docxBuiltinToolName
  | imBuiltinToolName
  | systemBuiltinToolName
  | GenesisToolName
  | CompleteToolName
  | CachedToolName
  | SecurityToolNames;
