# Contribution Guide / 貢献ガイド

## 🌐 Language / 言語

[English](#english) | [日本語](#japanese)

---

## English

### Welcome Contributors!

Thank you for your interest in contributing to the Lark OpenAPI MCP project. This guide will help you get started with contributing to our project.

### Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

1. **Be Respectful**: Treat all contributors with respect
2. **Be Inclusive**: Welcome contributors from all backgrounds
3. **Be Constructive**: Provide helpful feedback and suggestions
4. **Be Professional**: Maintain professional communication

### Getting Started

#### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/lark-openapi-mcp.git
cd lark-openapi-mcp

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/lark-openapi-mcp.git
```

#### 2. Set Up Development Environment

```bash
# Install dependencies
yarn install

# Build the project
yarn build

# Run tests
yarn test

# Set up pre-commit hooks
yarn prepare
```

#### 3. Create a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### Development Guidelines

#### 1. Code Style

We use TypeScript and follow these conventions:

```typescript
// Use meaningful variable names
const customerData = await fetchCustomerData();  // Good
const data = await fetch();  // Bad

// Use proper typing
interface CustomerData {
  id: string;
  name: string;
  email: string;
}

// Document complex functions
/**
 * Processes customer orders and returns summary
 * @param customerId - The customer's unique identifier
 * @param dateRange - Optional date range for filtering
 * @returns Order summary with totals
 */
async function processCustomerOrders(
  customerId: string,
  dateRange?: { start: Date; end: Date }
): Promise<OrderSummary> {
  // Implementation
}

// Use async/await instead of callbacks
async function goodExample() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}
```

#### 2. Commit Messages

Follow the Conventional Commits specification:

```bash
# Format: <type>(<scope>): <subject>

# Examples:
git commit -m "feat(genesis): add template support for CRM"
git commit -m "fix(mcp): resolve connection timeout issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(agent): add unit tests for chat agent"
git commit -m "refactor(api): simplify rate limiter logic"

# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes (formatting, etc)
# refactor: Code refactoring
# test: Adding or updating tests
# chore: Maintenance tasks
```

#### 3. Testing

All new features must include tests:

```typescript
// Example test file: src/agents/agent.test.ts
import { Agent, AgentRunner } from './agent';

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent({
      name: 'TestAgent',
      instructions: 'Test instructions',
      language: 'en'
    });
  });

  test('should create agent with correct properties', () => {
    expect(agent.name).toBe('TestAgent');
    expect(agent.language).toBe('en');
  });

  test('should handle messages correctly', async () => {
    const result = await AgentRunner.run(agent, 'Hello', {
      chatId: 'test-chat'
    });
    
    expect(result.success).toBe(true);
    expect(result.response).toBeDefined();
  });
});
```

Run tests:
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

#### 4. Documentation

Update documentation when adding features:

1. **Code Comments**: Add JSDoc comments for public APIs
2. **README**: Update if installation or usage changes
3. **Guides**: Update relevant guides in `docs/`
4. **Changelog**: Add entry to CHANGELOG.md

### Pull Request Process

#### 1. Before Submitting

```bash
# Ensure your branch is up to date
git fetch upstream
git rebase upstream/main

# Run all checks
yarn lint
yarn test
yarn build

# Ensure documentation is updated
# Add tests for new features
# Update CHANGELOG.md
```

#### 2. PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List specific changes
- Include motivation and context

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

#### 3. Review Process

1. Submit PR against `main` branch
2. Ensure CI checks pass
3. Address reviewer feedback
4. Squash commits if requested
5. PR will be merged after approval

### Project Structure

```
lark-openapi-mcp/
├── src/
│   ├── agents/          # Chat agent implementation
│   ├── genesis/         # Genesis system
│   ├── mcp-server/      # MCP server
│   ├── mcp-tool/        # MCP tools
│   └── utils/           # Utilities
├── docs/                # Documentation
├── tests/               # Test files
├── scripts/             # Build scripts
└── examples/            # Example code
```

### Adding New Features

#### 1. Adding a New MCP Tool

```typescript
// src/mcp-tool/tools/en/custom-tools/my-tool.ts
import { Tool } from '../../../types';

export const myCustomTool: Tool = {
  name: 'custom__myTool',
  description: 'Description of what the tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'Parameter description'
      }
    },
    required: ['param1']
  },
  handler: async (params) => {
    // Tool implementation
    return {
      success: true,
      data: 'Result'
    };
  }
};

// Register in index.ts
export * from './my-tool';
```

#### 2. Adding Genesis Templates

```typescript
// src/genesis/templates/my-template.ts
export const myTemplate = {
  name: 'my-template',
  description: 'Template description',
  generate: (params) => {
    return {
      application: {
        name: params.name,
        tables: [
          // Table definitions
        ]
      }
    };
  }
};
```

### Debugging

#### 1. Debug Logging

```typescript
// Use debug package
import debug from 'debug';
const log = debug('lark:module-name');

log('Processing request: %O', request);
```

Enable debug output:
```bash
DEBUG=lark:* yarn dev
```

#### 2. VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug MCP Server",
      "program": "${workspaceFolder}/dist/cli.js",
      "args": ["mcp", "--mode", "stdio"],
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
```

### Release Process

1. **Version Bump**: Update version in package.json
2. **Changelog**: Update CHANGELOG.md
3. **Tag Release**: Create git tag
4. **Build**: Run production build
5. **Publish**: Publish to npm (maintainers only)

---

## Japanese

### コントリビューターの皆様へ

Lark OpenAPI MCPプロジェクトへの貢献に興味を持っていただき、ありがとうございます。このガイドは、プロジェクトへの貢献を始めるのに役立ちます。

### 行動規範

このプロジェクトに参加することで、以下の行動規範に従うことに同意したものとします：

1. **敬意を持つ**：すべての貢献者に敬意を持って接する
2. **包括的である**：あらゆる背景の貢献者を歓迎する
3. **建設的である**：有益なフィードバックと提案を提供する
4. **プロフェッショナルである**：プロフェッショナルなコミュニケーションを維持する

### はじめに

#### 1. フォークとクローン

```bash
# GitHubでリポジトリをフォーク
# その後、フォークをクローン
git clone https://github.com/YOUR_USERNAME/lark-openapi-mcp.git
cd lark-openapi-mcp

# アップストリームリモートを追加
git remote add upstream https://github.com/ORIGINAL_OWNER/lark-openapi-mcp.git
```

#### 2. 開発環境のセットアップ

```bash
# 依存関係をインストール
yarn install

# プロジェクトをビルド
yarn build

# テストを実行
yarn test

# pre-commitフックを設定
yarn prepare
```

#### 3. ブランチの作成

```bash
# mainブランチを更新
git checkout main
git pull upstream main

# 機能ブランチを作成
git checkout -b feature/your-feature-name

# またはバグ修正の場合
git checkout -b fix/issue-description
```

### 開発ガイドライン

#### 1. コードスタイル

TypeScriptを使用し、以下の規約に従います：

```typescript
// 意味のある変数名を使用
const customerData = await fetchCustomerData();  // 良い
const data = await fetch();  // 悪い

// 適切な型付けを使用
interface CustomerData {
  id: string;
  name: string;
  email: string;
}

// 複雑な関数を文書化
/**
 * 顧客の注文を処理し、サマリーを返す
 * @param customerId - 顧客の一意識別子
 * @param dateRange - フィルタリング用の日付範囲（オプション）
 * @returns 合計を含む注文サマリー
 */
async function processCustomerOrders(
  customerId: string,
  dateRange?: { start: Date; end: Date }
): Promise<OrderSummary> {
  // 実装
}

// コールバックの代わりにasync/awaitを使用
async function goodExample() {
  try {
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    console.error('操作が失敗しました:', error);
    throw error;
  }
}
```

#### 2. コミットメッセージ

Conventional Commits仕様に従います：

```bash
# フォーマット: <type>(<scope>): <subject>

# 例:
git commit -m "feat(genesis): CRM用テンプレートサポートを追加"
git commit -m "fix(mcp): 接続タイムアウト問題を解決"
git commit -m "docs(readme): インストール手順を更新"
git commit -m "test(agent): チャットエージェントのユニットテストを追加"
git commit -m "refactor(api): レートリミッターロジックを簡素化"

# タイプ:
# feat: 新機能
# fix: バグ修正
# docs: ドキュメント変更
# style: コードスタイル変更（フォーマットなど）
# refactor: コードリファクタリング
# test: テストの追加または更新
# chore: メンテナンスタスク
```

#### 3. テスト

すべての新機能にはテストを含める必要があります：

```typescript
// テストファイルの例: src/agents/agent.test.ts
import { Agent, AgentRunner } from './agent';

describe('Agent', () => {
  let agent: Agent;

  beforeEach(() => {
    agent = new Agent({
      name: 'TestAgent',
      instructions: 'テスト用指示',
      language: 'ja'
    });
  });

  test('正しいプロパティでエージェントを作成する', () => {
    expect(agent.name).toBe('TestAgent');
    expect(agent.language).toBe('ja');
  });

  test('メッセージを正しく処理する', async () => {
    const result = await AgentRunner.run(agent, 'こんにちは', {
      chatId: 'test-chat'
    });
    
    expect(result.success).toBe(true);
    expect(result.response).toBeDefined();
  });
});
```

テストの実行:
```bash
# すべてのテストを実行
yarn test

# ウォッチモードでテストを実行
yarn test:watch

# カバレッジ付きでテストを実行
yarn test:coverage
```

#### 4. ドキュメント

機能を追加する際はドキュメントを更新してください：

1. **コードコメント**: パブリックAPIにJSDocコメントを追加
2. **README**: インストールや使用方法が変更された場合は更新
3. **ガイド**: `docs/`内の関連ガイドを更新
4. **変更履歴**: CHANGELOG.mdにエントリを追加

### プルリクエストプロセス

#### 1. 提出前

```bash
# ブランチが最新であることを確認
git fetch upstream
git rebase upstream/main

# すべてのチェックを実行
yarn lint
yarn test
yarn build

# ドキュメントが更新されていることを確認
# 新機能のテストを追加
# CHANGELOG.mdを更新
```

#### 2. PRテンプレート

```markdown
## 説明
変更の簡単な説明

## 変更の種類
- [ ] バグ修正
- [ ] 新機能
- [ ] 破壊的変更
- [ ] ドキュメント更新

## 変更内容
- 具体的な変更をリスト
- 動機とコンテキストを含める

## テスト
- [ ] ユニットテストがパス
- [ ] 統合テストがパス
- [ ] 手動テストが完了

## チェックリスト
- [ ] コードがスタイルガイドラインに従っている
- [ ] セルフレビューが完了
- [ ] 複雑なコードにコメントを追加
- [ ] ドキュメントを更新
- [ ] 新しい警告なし
- [ ] テストを追加/更新
```

#### 3. レビュープロセス

1. `main`ブランチに対してPRを提出
2. CIチェックがパスすることを確認
3. レビュアーのフィードバックに対応
4. 要求された場合はコミットをスカッシュ
5. 承認後にPRがマージされます

### プロジェクト構造

```
lark-openapi-mcp/
├── src/
│   ├── agents/          # チャットエージェント実装
│   ├── genesis/         # Genesisシステム
│   ├── mcp-server/      # MCPサーバー
│   ├── mcp-tool/        # MCPツール
│   └── utils/           # ユーティリティ
├── docs/                # ドキュメント
├── tests/               # テストファイル
├── scripts/             # ビルドスクリプト
└── examples/            # サンプルコード
```

### 新機能の追加

#### 1. 新しいMCPツールの追加

```typescript
// src/mcp-tool/tools/ja/custom-tools/my-tool.ts
import { Tool } from '../../../types';

export const myCustomTool: Tool = {
  name: 'custom__myTool',
  description: 'ツールの機能の説明',
  inputSchema: {
    type: 'object',
    properties: {
      param1: {
        type: 'string',
        description: 'パラメータの説明'
      }
    },
    required: ['param1']
  },
  handler: async (params) => {
    // ツールの実装
    return {
      success: true,
      data: '結果'
    };
  }
};

// index.tsに登録
export * from './my-tool';
```

#### 2. Genesisテンプレートの追加

```typescript
// src/genesis/templates/my-template.ts
export const myTemplate = {
  name: 'my-template',
  description: 'テンプレートの説明',
  generate: (params) => {
    return {
      application: {
        name: params.name,
        tables: [
          // テーブル定義
        ]
      }
    };
  }
};
```

### デバッグ

#### 1. デバッグログ

```typescript
// debugパッケージを使用
import debug from 'debug';
const log = debug('lark:module-name');

log('リクエストを処理中: %O', request);
```

デバッグ出力を有効化:
```bash
DEBUG=lark:* yarn dev
```

#### 2. VS Codeデバッグ

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "MCPサーバーをデバッグ",
      "program": "${workspaceFolder}/dist/cli.js",
      "args": ["mcp", "--mode", "stdio"],
      "console": "integratedTerminal",
      "sourceMaps": true
    }
  ]
}
```

### リリースプロセス

1. **バージョン更新**: package.jsonのバージョンを更新
2. **変更履歴**: CHANGELOG.mdを更新
3. **タグリリース**: gitタグを作成
4. **ビルド**: 本番ビルドを実行
5. **公開**: npmに公開（メンテナーのみ）

---

## 🔗 Related Documentation / 関連ドキュメント

- [System Overview](../01-OVERVIEW/README.md) - System introduction
- [Architecture](../01-OVERVIEW/ARCHITECTURE.md) - System architecture
- [API Reference](../03-TECHNICAL/API_REFERENCE.md) - API documentation

---

Last Updated: 2025-01-24