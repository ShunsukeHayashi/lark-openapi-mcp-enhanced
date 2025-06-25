#!/usr/bin/env node

/**
 * CLI Entry Point for AI-Enhanced Multi-Agent System
 */

import { createAgentCLI } from './agent-ui';

async function main() {
  try {
    const program = await createAgentCLI();
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}