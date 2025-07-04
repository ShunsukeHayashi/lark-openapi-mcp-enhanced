// Set global test timeout
jest.setTimeout(30000);

// Mock Lark SDK
jest.mock('@larksuiteoapi/node-sdk', () => {
  return {
    Client: jest.fn().mockImplementation(() => ({
      request: jest.fn(),
      im: {
        message: {
          create: jest.fn(),
        },
        chat: {
          create: jest.fn(),
          list: jest.fn(),
        },
      },
    })),
    withUserAccessToken: jest.fn((token) => ({ userAccessToken: token })),
  };
});

// Clear mocks and timers before each test
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Clean up after tests
afterEach(() => {
  jest.restoreAllMocks();
});

// Ensure all async operations complete
afterAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
});
