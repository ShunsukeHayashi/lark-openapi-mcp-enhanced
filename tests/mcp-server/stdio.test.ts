/**
 * Tests for STDIO MCP Server
 * Testing standard input/output server transport
 */

import { initStdioServer } from '@/mcp-server/stdio';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock the MCP SDK modules
jest.mock('@modelcontextprotocol/sdk/server/stdio.js');
jest.mock('@modelcontextprotocol/sdk/server/mcp.js');

// Mock console and process
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('initStdioServer', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockTransport: jest.Mocked<StdioServerTransport>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock transport
    mockTransport = {
      // Add any required transport methods here
    } as any;
    
    // Mock the transport constructor
    (StdioServerTransport as jest.Mock).mockImplementation(() => mockTransport);
    
    // Create mock server
    mockServer = {
      connect: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should create stdio transport and connect to server', async () => {
    // Setup successful connection
    mockServer.connect.mockResolvedValue(undefined);

    // Call the function
    initStdioServer(mockServer);

    // Verify transport was created
    expect(StdioServerTransport).toHaveBeenCalledTimes(1);
    expect(StdioServerTransport).toHaveBeenCalledWith();

    // Verify server.connect was called with transport
    expect(mockServer.connect).toHaveBeenCalledTimes(1);
    expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
  });

  test('should handle connection error and exit process', async () => {
    // Setup connection error
    const connectionError = new Error('Connection failed');
    mockServer.connect.mockRejectedValue(connectionError);

    // Call the function
    initStdioServer(mockServer);

    // Wait for async operations
    await new Promise(resolve => setImmediate(resolve));

    // Verify error was logged
    expect(mockConsoleError).toHaveBeenCalledWith('MCP Connect Error:', connectionError);
    
    // Verify process.exit was called
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  test('should use the provided McpServer instance', () => {
    mockServer.connect.mockResolvedValue(undefined);

    // Create different server instances
    const server1 = { connect: jest.fn().mockResolvedValue(undefined) } as any;
    const server2 = { connect: jest.fn().mockResolvedValue(undefined) } as any;

    initStdioServer(server1);
    initStdioServer(server2);

    // Verify each server's connect was called
    expect(server1.connect).toHaveBeenCalledTimes(1);
    expect(server2.connect).toHaveBeenCalledTimes(1);
  });

  test('should handle async nature of connection', async () => {
    // Create a promise we can control
    let resolveConnect: () => void;
    const connectPromise = new Promise<void>(resolve => {
      resolveConnect = resolve;
    });
    
    mockServer.connect.mockReturnValue(connectPromise);

    // Call the function
    initStdioServer(mockServer);

    // Verify connect was called immediately
    expect(mockServer.connect).toHaveBeenCalledTimes(1);

    // Process should not exit yet
    expect(mockProcessExit).not.toHaveBeenCalled();

    // Resolve the connection
    resolveConnect!();
    await connectPromise;

    // Process should still not exit (successful connection)
    expect(mockProcessExit).not.toHaveBeenCalled();
  });

  test('should not throw synchronously on connection error', () => {
    // Setup connection error
    mockServer.connect.mockRejectedValue(new Error('Async error'));

    // Call should not throw
    expect(() => initStdioServer(mockServer)).not.toThrow();
  });
});