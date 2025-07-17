# Contributing to Lark OpenAPI MCP Enhanced

Thank you for your interest in contributing to Lark OpenAPI MCP Enhanced! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Accept feedback gracefully

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/lark-openapi-mcp-enhanced.git
   cd lark-openapi-mcp-enhanced
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ShunsukeHayashi/lark-openapi-mcp-enhanced.git
   ```

## Development Setup

### Prerequisites

- Node.js >= 16.20.0
- Yarn (recommended) or npm
- TypeScript knowledge
- Lark/Feishu developer account

### Installation

1. **Install dependencies**:
   ```bash
   yarn install
   ```

2. **Set up environment variables**:
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Add your credentials
   APP_ID=your_app_id
   APP_SECRET=your_app_secret
   ```

3. **Build the project**:
   ```bash
   yarn build
   ```

## Code Style

We use Prettier for code formatting and TypeScript strict mode for type safety.

### Key Guidelines

1. **TypeScript**: 
   - Use strict mode
   - Always handle null/undefined cases
   - Prefer interfaces over type aliases for object types
   - Use Zod for runtime validation

2. **Formatting**:
   - Run `yarn format` before committing
   - Use single quotes for strings
   - Maximum line width: 120 characters

3. **Naming Conventions**:
   - Use camelCase for variables and functions
   - Use PascalCase for classes and interfaces
   - Use UPPER_SNAKE_CASE for constants
   - Prefix interfaces with 'I' only when necessary to avoid naming conflicts

4. **File Organization**:
   - Keep files focused and single-purpose
   - Group related functionality in directories
   - Use index.ts for barrel exports

### Example Code Style

```typescript
// Good
import { z } from 'zod';

interface UserConfig {
  appId: string;
  appSecret: string;
  userToken?: string;
}

const CONFIG_SCHEMA = z.object({
  appId: z.string(),
  appSecret: z.string(),
  userToken: z.string().optional(),
});

export function validateConfig(config: unknown): UserConfig {
  return CONFIG_SCHEMA.parse(config);
}

// Bad
import * as z from "zod"

type user_config = {
  app_id: string,
  app_secret: string,
  user_token?: string
}

export function ValidateConfig(config: any) {
  // Missing validation
  return config as user_config
}
```

## Testing

We use Jest for testing. All new features should include tests.

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run specific test file
yarn test tests/mcp-tool/mcp-tool.test.ts
```

### Writing Tests

1. **Location**: Mirror the source structure in `tests/`
2. **Naming**: Use `.test.ts` suffix
3. **Structure**: Use descriptive test names and group related tests

Example:
```typescript
describe('MCP Tool', () => {
  describe('authentication', () => {
    it('should authenticate with app credentials', async () => {
      // Test implementation
    });

    it('should handle authentication errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

## Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation as needed

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Test additions or changes
   - `chore:` Build process or auxiliary tool changes

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**:
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changes you made and why
   - Include screenshots for UI changes

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] Tests pass locally (`yarn test`)
- [ ] Build succeeds (`yarn build`)
- [ ] Documentation is updated if needed
- [ ] CHANGELOG.md is updated (for significant changes)
- [ ] Commit messages follow conventional commits format

## Reporting Issues

### Bug Reports

Include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node.js version, etc.)
- Error messages or logs

### Feature Requests

Include:
- Use case description
- Proposed solution
- Alternative solutions considered
- Any mockups or examples

## Documentation

### Types of Documentation

1. **Code Comments**: Explain "why" not "what"
2. **API Documentation**: Use JSDoc for public APIs
3. **README Updates**: Keep examples current
4. **Guides**: Add to `docs/` for complex features

### Documentation Style

- Use clear, concise language
- Include code examples
- Keep bilingual support (English/Chinese)
- Update both language versions

## Development Tips

### Using the Genesis System

When working on Genesis features:
1. Understand the prompt engine in `src/genesis/core/prompt-engine.ts`
2. Test with various requirement inputs
3. Validate generated structures
4. Consider edge cases

### Working with MCP Tools

1. Follow the existing tool pattern
2. Use Zod for parameter validation
3. Handle both tenant and user tokens
4. Include proper error messages

### Debugging

```bash
# Enable debug logging
export DEBUG=lark-mcp:*

# Run with verbose output
yarn dev --verbose
```

## Getting Help

- Check existing issues and PRs
- Read the documentation in `docs/`
- Ask questions in issues (label as "question")
- Review test files for usage examples

## Recognition

Contributors will be recognized in:
- The project README
- Release notes for significant contributions
- GitHub contributors page

Thank you for contributing to Lark OpenAPI MCP Enhanced! 🎉