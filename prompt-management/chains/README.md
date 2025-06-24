# Prompt Chain System

## 概要
プロンプトチェーン機能は、複数のプロンプトを連鎖的に実行して複雑なワークフローを自動化するシステムです。

## ディレクトリ構成
```
chains/
├── README.md              # このファイル
├── definitions/           # チェーン定義ファイル
│   ├── crm-workflow.json     # CRM設計ワークフロー
│   ├── base-analysis.json    # Base分析ワークフロー
│   └── templates/            # チェーンテンプレート
├── executor/              # 実行エンジン
│   ├── __init__.py
│   ├── chain_executor.py     # メイン実行エンジン
│   ├── step_processor.py     # ステップ処理
│   └── error_handler.py      # エラーハンドリング
├── integrations/          # 外部統合
│   ├── mcp_bridge.py         # MCP連携
│   ├── lark_connector.py     # Lark通知
│   └── ai_assistant.py       # AI Assistant統合
└── validators/            # 検証機能
    ├── chain_validator.py    # チェーン定義検証
    └── schema_validator.py   # スキーマ検証
```

## Chain Definition Schema

### 基本構造
```json
{
  "chain_id": "unique-chain-identifier",
  "name": "ワークフロー名",
  "version": "1.0.0",
  "description": "ワークフローの説明",
  "metadata": {
    "author": "作成者",
    "created": "2025-01-XX",
    "category": "category-name",
    "tags": ["tag1", "tag2"]
  },
  "config": {
    "timeout": 3600,
    "retry_policy": "exponential_backoff",
    "max_retries": 3,
    "parallel_execution": false
  },
  "steps": [...],
  "error_handling": {...},
  "notifications": {...}
}
```

### Step Definition
```json
{
  "step_id": "step-identifier",
  "name": "ステップ名",
  "prompt_id": "prompt-identifier",
  "input_source": "user|previous_step|context",
  "input_mapping": {
    "source_field": "target_parameter"
  },
  "output_target": "next_step|final",
  "transformations": [
    {
      "type": "json_extract",
      "path": "$.result.data"
    }
  ],
  "conditions": {
    "skip_if": "condition_expression",
    "retry_if": "error_condition"
  },
  "mcp_integration": {
    "enabled": true,
    "tool": "lark_api_call",
    "parameters": {...}
  }
}
```

## 使用例

### 1. CRM Base完全設計ワークフロー
```json
{
  "chain_id": "crm-complete-design",
  "name": "CRM Base完全設計ワークフロー",
  "description": "要件ヒアリングからBase作成、ER図生成まで",
  "steps": [
    {
      "step_id": "requirements-gathering",
      "name": "要件ヒアリング",
      "prompt_id": "generation-002",
      "input_source": "user",
      "output_target": "design-phase"
    },
    {
      "step_id": "design-phase", 
      "name": "Base設計",
      "prompt_id": "planning-001",
      "input_source": "requirements-gathering",
      "output_target": "implementation-phase",
      "transformations": [
        {
          "type": "requirements_to_schema",
          "mapping": "crm_entities"
        }
      ]
    },
    {
      "step_id": "implementation-phase",
      "name": "Base実装",
      "prompt_id": "mcp-base-creator",
      "input_source": "design-phase", 
      "output_target": "documentation-phase",
      "mcp_integration": {
        "enabled": true,
        "tool": "bitable.v1.app.create"
      }
    },
    {
      "step_id": "documentation-phase",
      "name": "ER図生成",
      "prompt_id": "generation-004",
      "input_source": "implementation-phase",
      "output_target": "final"
    }
  ]
}
```

### 2. 既存Base分析ワークフロー
```json
{
  "chain_id": "base-analysis-workflow",
  "name": "既存Base分析・最適化ワークフロー", 
  "steps": [
    {
      "step_id": "structure-analysis",
      "name": "構造解析",
      "prompt_id": "analysis-001",
      "mcp_integration": {
        "enabled": true,
        "tool": "bitable.v1.app.get"
      }
    },
    {
      "step_id": "optimization-planning",
      "name": "最適化計画",
      "prompt_id": "planning-002",
      "input_source": "structure-analysis"
    },
    {
      "step_id": "migration-plan",
      "name": "移行計画作成", 
      "prompt_id": "planning-003",
      "input_source": "optimization-planning"
    }
  ]
}
```

## API Reference

### Chain Executor
```python
from chains.executor import ChainExecutor

executor = ChainExecutor()

# チェーン実行
result = await executor.execute(
    chain_id="crm-complete-design",
    initial_input={
        "business_type": "SaaS",
        "team_size": "10-50",
        "requirements": "..."
    }
)

# 実行状況監視
status = await executor.get_execution_status(execution_id)

# チェーン停止
await executor.stop_execution(execution_id)
```

### Chain Builder
```python
from chains.builder import ChainBuilder

builder = ChainBuilder()

# 新しいチェーン作成
chain = builder.create("my-workflow")
    .add_step("step1", "prompt-001", input_source="user")
    .add_step("step2", "prompt-002", input_source="step1")
    .with_mcp_integration("step2", "lark_api")
    .build()

# チェーン保存
await builder.save(chain)
```

## Best Practices

### 1. チェーン設計
- **単一責任**: 1つのチェーンは1つの明確な目的
- **エラーハンドリング**: 各ステップでの例外処理を定義
- **タイムアウト**: 適切なタイムアウト設定
- **ログ**: 詳細な実行ログを記録

### 2. ステップ設計
- **冪等性**: 同じ入力には同じ出力
- **検証**: 入力・出力の妥当性チェック
- **依存関係**: 明確な依存関係の定義
- **リトライ**: 一時的な障害への対応

### 3. パフォーマンス
- **並列実行**: 独立ステップの並列化
- **キャッシュ**: 重複処理の回避
- **リソース管理**: メモリ・CPU使用量の監視

## トラブルシューティング

### よくあるエラー
1. **Step timeout**: ステップ実行時間超過
2. **Invalid input**: 入力データ形式エラー
3. **MCP connection error**: MCP接続エラー
4. **Prompt not found**: プロンプトが見つからない

### 解決方法
- ログファイルの確認
- チェーン定義の妥当性検証
- MCP接続状況の確認
- プロンプト管理システムの状況確認