import { docxBuiltinToolName, docxBuiltinTools } from './docx/builtin';
import { imBuiltinToolName, imBuiltinTools } from './im/buildin';
import { systemBuiltinToolName, systemBuiltinTools } from './system/builtin';

export const BuiltinTools = [...docxBuiltinTools, ...imBuiltinTools, ...systemBuiltinTools];

export type BuiltinToolName = docxBuiltinToolName | imBuiltinToolName | systemBuiltinToolName;
