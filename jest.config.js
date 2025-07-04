module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  testTimeout: 30000, // 30 seconds per test
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/cli.ts',
    '!src/mcp-tool/tools/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!@modelcontextprotocol)'],
  setupFilesAfterEnv: ['./tests/setup.ts'],
  // Exclude problematic test files temporarily
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\\.disabled',
    'mobi',
    'simple-coordinator\\.test\\.ts'
  ]
};
