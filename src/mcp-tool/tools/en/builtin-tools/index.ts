import { docxBuiltinToolName, docxBuiltinTools } from './docx/builtin';
import { imBuiltinToolName, imBuiltinTools } from './im/buildin';
import { systemBuiltinToolName, systemBuiltinTools } from './system/builtin';
import { GenesisToolName, genesisTools } from './genesis';
import { CompleteToolName, completeTools } from './complete/all-functions';

export const BuiltinTools = [...docxBuiltinTools, ...imBuiltinTools, ...systemBuiltinTools, ...genesisTools, ...completeTools];

export type BuiltinToolName = docxBuiltinToolName | imBuiltinToolName | systemBuiltinToolName | GenesisToolName | CompleteToolName;
