import { ToolName, ProjectName } from '../tools';
import { McpTool, ToolsFilterOptions, TokenMode } from '../types';

export function filterTools(tools: McpTool[], options: ToolsFilterOptions) {
  // If no specific tools or projects are allowed, enable all tools
  const hasAllowCriteria = (options.allowTools && options.allowTools.length > 0) || 
                          (options.allowProjects && options.allowProjects.length > 0);
  
  let filteredTools = hasAllowCriteria 
    ? tools.filter(
        (tool) =>
          options.allowTools?.includes(tool.name as ToolName) ||
          options.allowProjects?.includes(tool.project as ProjectName),
      )
    : tools; // Enable all tools if no specific criteria

  // Filter by token mode
  if (options.tokenMode && options.tokenMode !== TokenMode.AUTO) {
    filteredTools = filteredTools.filter((tool) => {
      if (!tool.accessTokens) {
        return false;
      }
      if (options.tokenMode === TokenMode.USER_ACCESS_TOKEN) {
        return tool.accessTokens.includes('user');
      }
      if (options.tokenMode === TokenMode.TENANT_ACCESS_TOKEN) {
        return tool.accessTokens.includes('tenant');
      }
      return true;
    });
  }

  return filteredTools;
}
