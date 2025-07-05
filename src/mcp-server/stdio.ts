import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function initStdioServer(server: McpServer) {
  const transport = new StdioServerTransport();
  server.connect(transport).catch((error) => {
    console.error('MCP Connection Error:', error);
    console.error('Failed to establish MCP server connection. Please check your configuration.');
    process.exit(1); // Keep process.exit here as this is a critical startup failure
  });
}
