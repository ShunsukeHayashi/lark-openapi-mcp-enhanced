/**
 * Tests for SSE MCP Server
 * Testing Server-Sent Events transport with Express
 */

import { initSSEServer } from '@/mcp-server/sse';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import express, { Request, Response } from 'express';

// Mock the dependencies
jest.mock('@modelcontextprotocol/sdk/server/sse.js');
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    listen: jest.fn()
  };
  const expressFn = jest.fn(() => mockApp);
  // Add the json middleware mock
  (expressFn as any).json = jest.fn(() => 'json-middleware');
  return expressFn;
});

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();

describe('initSSEServer', () => {
  let mockServer: jest.Mocked<McpServer>;
  let mockApp: any;
  let mockTransport: jest.Mocked<SSEServerTransport>;
  let mockOptions: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock server
    mockServer = {
      connect: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Get the mocked express app
    mockApp = (express as any)();
    
    // Create mock transport with sessionId
    mockTransport = {
      sessionId: 'test-session-123',
      handlePostMessage: jest.fn()
    } as any;
    
    // Mock the transport constructor
    (SSEServerTransport as jest.Mock).mockImplementation(() => mockTransport);
    
    // Default options
    mockOptions = {
      port: 3000,
      host: 'localhost'
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Express app setup', () => {
    test('should setup express app with JSON middleware', () => {
      initSSEServer(mockServer, mockOptions);

      expect(express).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalledWith('json-middleware');
    });

    test('should register all required endpoints', () => {
      initSSEServer(mockServer, mockOptions);

      // Check all endpoints are registered
      expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/tools/list', expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/tools/call', expect.any(Function));
      expect(mockApp.get).toHaveBeenCalledWith('/sse', expect.any(Function));
      expect(mockApp.post).toHaveBeenCalledWith('/messages', expect.any(Function));
    });

    test('should start listening on specified port and host', () => {
      const mockListenCallback = jest.fn();
      mockApp.listen.mockImplementation((port: number, host: string, callback: Function) => {
        callback(null);
      });

      initSSEServer(mockServer, mockOptions);

      expect(mockApp.listen).toHaveBeenCalledWith(3000, 'localhost', expect.any(Function));
      expect(mockConsoleLog).toHaveBeenCalledWith('Server is running on port 3000');
      expect(mockConsoleLog).toHaveBeenCalledWith('SSE endpoint: http://localhost:3000/sse');
    });

    test('should handle server startup error', () => {
      const startupError = new Error('Port already in use');
      mockApp.listen.mockImplementation((port: number, host: string, callback: Function) => {
        callback(startupError);
      });

      initSSEServer(mockServer, mockOptions);

      expect(mockConsoleError).toHaveBeenCalledWith('Server error:', startupError);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Endpoint handlers', () => {
    let handlers: { [key: string]: Function } = {};

    beforeEach(() => {
      // Capture endpoint handlers
      mockApp.get.mockImplementation((path: string, handler: Function) => {
        handlers[`GET ${path}`] = handler;
      });
      mockApp.post.mockImplementation((path: string, handler: Function) => {
        handlers[`POST ${path}`] = handler;
      });
      
      initSSEServer(mockServer, mockOptions);
    });

    test('/health endpoint should return status', () => {
      const mockReq = {} as Request;
      const mockRes = { json: jest.fn() } as any;

      handlers['GET /health'](mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });

    test('/tools/list endpoint should return tools info', () => {
      const mockReq = {} as Request;
      const mockRes = { json: jest.fn() } as any;

      handlers['GET /tools/list'](mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        tools: [],
        message: 'Tools available via SSE connection'
      });
    });

    test('/tools/call endpoint should return 501 error', () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as any;

      handlers['POST /tools/call'](mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(501);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Tool calls should be made via SSE connection',
        instructions: 'Connect to /sse endpoint for proper MCP communication'
      });
    });

    test('/sse endpoint should create transport and connect', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        on: jest.fn()
      } as any;

      await handlers['GET /sse'](mockReq, mockRes);

      // Verify SSE transport was created
      expect(SSEServerTransport).toHaveBeenCalledWith('/messages', mockRes);
      
      // Verify server.connect was called
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
      
      // Verify close handler was registered
      expect(mockRes.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    test('/sse endpoint should handle client disconnect', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        on: jest.fn()
      } as any;
      
      let closeHandler: Function;
      mockRes.on.mockImplementation((event: string, handler: Function) => {
        if (event === 'close') {
          closeHandler = handler;
        }
      });

      await handlers['GET /sse'](mockReq, mockRes);
      
      // Simulate client disconnect
      closeHandler!();
      
      // Try to use the same session in /messages endpoint
      const messageReq = { query: { sessionId: mockTransport.sessionId } } as any;
      const messageRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any;
      
      await handlers['POST /messages'](messageReq, messageRes);
      
      // Should return error since transport was deleted
      expect(messageRes.status).toHaveBeenCalledWith(400);
      expect(messageRes.send).toHaveBeenCalledWith('No transport found for sessionId');
    });

    test('/messages endpoint should handle valid session', async () => {
      // First establish SSE connection
      const sseReq = {} as Request;
      const sseRes = { on: jest.fn() } as any;
      await handlers['GET /sse'](sseReq, sseRes);

      // Now send message
      const messageReq = {
        query: { sessionId: mockTransport.sessionId }
      } as any;
      const messageRes = {} as any;

      await handlers['POST /messages'](messageReq, messageRes);

      expect(mockTransport.handlePostMessage).toHaveBeenCalledWith(messageReq, messageRes);
    });

    test('/messages endpoint should handle missing sessionId', async () => {
      const messageReq = { query: {} } as any;
      const messageRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      } as any;

      await handlers['POST /messages'](messageReq, messageRes);

      expect(messageRes.status).toHaveBeenCalledWith(400);
      expect(messageRes.send).toHaveBeenCalledWith('No transport found for sessionId');
    });
  });

  describe('Multiple client handling', () => {
    test('should handle multiple SSE connections', async () => {
      let handlers: { [key: string]: Function } = {};
      mockApp.get.mockImplementation((path: string, handler: Function) => {
        handlers[`GET ${path}`] = handler;
      });
      
      // Create multiple transports
      const transport1 = { sessionId: 'session-1', handlePostMessage: jest.fn() } as any;
      const transport2 = { sessionId: 'session-2', handlePostMessage: jest.fn() } as any;
      
      let transportCount = 0;
      (SSEServerTransport as jest.Mock).mockImplementation(() => {
        transportCount++;
        return transportCount === 1 ? transport1 : transport2;
      });
      
      initSSEServer(mockServer, mockOptions);
      
      // Connect two clients
      const res1 = { on: jest.fn() } as any;
      const res2 = { on: jest.fn() } as any;
      
      await handlers['GET /sse']({} as Request, res1);
      await handlers['GET /sse']({} as Request, res2);
      
      expect(mockServer.connect).toHaveBeenCalledTimes(2);
      expect(mockServer.connect).toHaveBeenCalledWith(transport1);
      expect(mockServer.connect).toHaveBeenCalledWith(transport2);
    });
  });
});