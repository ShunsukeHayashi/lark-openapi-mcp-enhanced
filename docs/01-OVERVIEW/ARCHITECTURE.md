# System Architecture / システムアーキテクチャ

## 🌐 Language / 言語

[English](#english) | [日本語](#japanese)

---

## English

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   Claude Desktop App    │    Lark Client      │     Web Browser         │
│   - MCP Integration     │    - Bot Interface  │     - Dashboard         │
│   - Chat Interface      │    - Webhooks       │     - Genesis UI        │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                              │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│     MCP Server          │   Lark OpenAPI      │    Genesis Engine       │
│   - STDIO Server        │   - Auth Service    │   - Parser              │
│   - SSE Server          │   - API Gateway     │   - Generator           │
│   - Tool Registry       │   - Event Handler   │   - Validator           │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Service Layer                                 │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   Chat Agent Service    │  Document Service   │   Base Service          │
│   - NLP Processing      │  - Recall Engine    │   - Table Management    │
│   - Context Management  │  - Search & Index   │   - Field Definition    │
│   - Response Generation │  - Permission Mgmt  │   - Formula Engine      │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Integration Layer                                │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   Rate Limiter          │   HTTP Client       │   WebSocket Manager     │
│   - Request Queue       │   - Retry Logic     │   - Event Streaming     │
│   - Throttling          │   - Auth Headers    │   - Connection Pool     │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Data Layer                                    │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   Lark Base Storage     │  Local File System  │   Cache Layer           │
│   - Tables              │  - Config Files     │   - Redis/Memory        │
│   - Documents           │  - Templates        │   - Session Storage     │
│   - Media Files         │  - Logs             │   - Rate Limit State    │
└─────────────────────────┴─────────────────────┴─────────────────────────┘
```

### Core Components

#### 1. MCP Server Architecture

```typescript
// MCP Server Structure
mcp-server/
├── stdio.ts      // Standard I/O communication
├── sse.ts        // Server-Sent Events
├── shared/       // Shared utilities
│   ├── init.ts   // Initialization logic
│   └── types.ts  // TypeScript definitions
```

**Key Features:**
- Bidirectional communication with Claude Desktop
- Tool registration and execution
- Context preservation across sessions
- Error handling and recovery

#### 2. Lark Integration Architecture

```typescript
// Lark API Integration Flow
Client Request → Rate Limiter → API Gateway → Service Handler → Lark API
                      ↓                             ↓
                 Rate Check                    Response Processing
                      ↓                             ↓
                Queue/Reject ← ─ ─ ─ ─ ─ ─ ─  Transform & Return
```

**Components:**
- **Authentication**: OAuth2 flow with tenant tokens
- **Rate Limiting**: Intelligent request queuing
- **API Gateway**: Unified interface for all Lark services
- **Event Handling**: Webhook and bot event processing

#### 3. Genesis System Architecture

```
Requirements Document
        │
        ▼
┌──────────────────┐
│  Requirement     │
│    Parser        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│   Data Model     │────▶│    Validator     │
│   Extractor      │     └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Lark Base       │────▶│  Error Recovery  │
│   Builder        │     └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Deployment     │
│    Manager       │
└──────────────────┘
```

### Communication Protocols

#### 1. MCP Protocol
- JSON-RPC 2.0 over stdio
- Server-Sent Events for real-time updates
- Tool invocation with structured parameters

#### 2. Lark API Protocol
- RESTful HTTP/HTTPS
- OAuth2 authentication
- Webhook callbacks for events

#### 3. Internal Communication
- TypeScript interfaces for type safety
- Event-driven architecture
- Promise-based async operations

### Security Architecture

```
┌─────────────────────┐
│   Security Layer    │
├─────────────────────┤
│ • Token Management  │
│ • Rate Limiting     │
│ • Input Validation  │
│ • Error Sanitization│
└─────────────────────┘
```

**Security Features:**
- Secure token storage
- Request validation
- Rate limiting per tenant
- Audit logging
- Error message sanitization

---

## Japanese

### システムアーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              クライアント層                              │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   Claude Desktop App    │    Larkクライアント  │     Webブラウザ         │
│   - MCP統合            │    - ボットIF       │     - ダッシュボード     │
│   - チャットIF         │    - Webhook        │     - Genesis UI        │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           アプリケーション層                             │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│     MCPサーバー         │   Lark OpenAPI      │    Genesisエンジン      │
│   - STDIOサーバー       │   - 認証サービス     │   - パーサー            │
│   - SSEサーバー         │   - APIゲートウェイ  │   - ジェネレーター      │
│   - ツールレジストリ    │   - イベントハンドラ  │   - バリデーター        │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            サービス層                                    │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   チャットエージェント  │  ドキュメントサービス │   Baseサービス          │
│   - NLP処理            │  - Recallエンジン    │   - テーブル管理        │
│   - コンテキスト管理    │  - 検索・索引        │   - フィールド定義      │
│   - レスポンス生成      │  - 権限管理          │   - 数式エンジン        │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         統合層                                           │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   レートリミッター      │   HTTPクライアント    │   WebSocketマネージャー │
│   - リクエストキュー    │   - リトライロジック  │   - イベントストリーミング│
│   - スロットリング      │   - 認証ヘッダー      │   - コネクションプール   │
└───────────┬─────────────┴──────────┬──────────┴───────────┬─────────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            データ層                                      │
├─────────────────────────┬─────────────────────┬─────────────────────────┤
│   Lark Baseストレージ   │  ローカルファイル    │   キャッシュ層          │
│   - テーブル           │  - 設定ファイル      │   - Redis/メモリ        │
│   - ドキュメント       │  - テンプレート      │   - セッションストレージ │
│   - メディアファイル    │  - ログ             │   - レート制限状態      │
└─────────────────────────┴─────────────────────┴─────────────────────────┘
```

### コアコンポーネント

#### 1. MCPサーバーアーキテクチャ

```typescript
// MCPサーバー構造
mcp-server/
├── stdio.ts      // 標準入出力通信
├── sse.ts        // Server-Sent Events
├── shared/       // 共有ユーティリティ
│   ├── init.ts   // 初期化ロジック
│   └── types.ts  // TypeScript定義
```

**主な機能:**
- Claude Desktopとの双方向通信
- ツールの登録と実行
- セッション間のコンテキスト保持
- エラーハンドリングとリカバリー

#### 2. Lark統合アーキテクチャ

```typescript
// Lark API統合フロー
クライアントリクエスト → レートリミッター → APIゲートウェイ → サービスハンドラー → Lark API
                           ↓                                    ↓
                      レートチェック                        レスポンス処理
                           ↓                                    ↓
                    キュー/拒否 ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  変換＆返却
```

**コンポーネント:**
- **認証**: テナントトークンを使用したOAuth2フロー
- **レート制限**: インテリジェントなリクエストキューイング
- **APIゲートウェイ**: すべてのLarkサービスの統一インターフェース
- **イベント処理**: WebhookとBotイベントの処理

#### 3. Genesisシステムアーキテクチャ

```
要件ドキュメント
        │
        ▼
┌──────────────────┐
│  要件パーサー     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  データモデル     │────▶│  バリデーター     │
│  抽出器          │     └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│  Lark Base       │────▶│  エラーリカバリー  │
│  ビルダー        │     └──────────────────┘
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  デプロイメント   │
│  マネージャー     │
└──────────────────┘
```

### 通信プロトコル

#### 1. MCPプロトコル
- stdio経由のJSON-RPC 2.0
- リアルタイム更新用のServer-Sent Events
- 構造化パラメータによるツール呼び出し

#### 2. Lark APIプロトコル
- RESTful HTTP/HTTPS
- OAuth2認証
- イベント用のWebhookコールバック

#### 3. 内部通信
- 型安全性のためのTypeScriptインターフェース
- イベント駆動アーキテクチャ
- Promiseベースの非同期操作

### セキュリティアーキテクチャ

```
┌─────────────────────┐
│  セキュリティ層      │
├─────────────────────┤
│ • トークン管理      │
│ • レート制限        │
│ • 入力検証         │
│ • エラーサニタイズ   │
└─────────────────────┘
```

**セキュリティ機能:**
- セキュアなトークン保存
- リクエスト検証
- テナント毎のレート制限
- 監査ログ
- エラーメッセージのサニタイズ

---

## 🔗 Related Documentation / 関連ドキュメント

- [System Overview](README.md) - General system introduction
- [MCP Server Details](../03-TECHNICAL/MCP_SERVER.md) - MCP server implementation
- [API Reference](../03-TECHNICAL/API_REFERENCE.md) - Complete API documentation

---

Last Updated: 2025-01-24