# Genesis System User Guide / Genesisシステムユーザーガイド

## 🌐 Language / 言語

[English](#english) | [日本語](#japanese)

---

## English

### Overview

The Genesis System is an AI-powered tool that automatically generates Lark Base applications from natural language requirements. It transforms your business requirements into fully functional database applications with tables, relationships, and workflows.

### What Genesis Can Do

1. **Automatic Schema Generation**
   - Parse natural language requirements
   - Extract entities and relationships
   - Generate database schema
   - Create field definitions

2. **Lark Base Integration**
   - Create tables automatically
   - Set up relationships
   - Configure views and filters
   - Generate forms and dashboards

3. **Multi-language Support**
   - English requirements
   - Japanese requirements
   - Chinese requirements
   - Mixed language support

### Getting Started

#### 1. Preparing Your Requirements

Create a requirements document that describes your application:

```markdown
# CRM System Requirements

## Overview
A customer relationship management system for our sales team.

## Features
- Track customer information
- Manage sales opportunities
- Record interaction history
- Generate sales reports

## Data Requirements
### Customers
- Company name (required)
- Industry
- Contact person
- Email address
- Phone number
- Address

### Opportunities
- Opportunity name (required)
- Customer (linked to Customers table)
- Amount
- Stage (Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost)
- Close date
- Probability (%)

### Activities
- Activity type (Call, Email, Meeting, Task)
- Related to (Customer or Opportunity)
- Date and time
- Description
- Assigned to
```

#### 2. Using Genesis CLI

```bash
# Basic usage
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -o output.json

# With verbose logging
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -o output.json -v

# Interactive mode
node dist/genesis/cli/genesis-cli.js generate -i
```

#### 3. Understanding the Output

Genesis generates a JSON file containing:

```json
{
  "application": {
    "name": "CRM System",
    "description": "Customer relationship management system",
    "tables": [
      {
        "name": "Customers",
        "fields": [
          {
            "name": "company_name",
            "type": "text",
            "required": true
          },
          {
            "name": "industry",
            "type": "select",
            "options": ["Technology", "Finance", "Healthcare", "Retail", "Other"]
          }
        ]
      }
    ],
    "relationships": [
      {
        "from": "Opportunities.customer_id",
        "to": "Customers.id",
        "type": "many-to-one"
      }
    ]
  }
}
```

### Best Practices

#### 1. Writing Clear Requirements

**Good Example:**
```markdown
## Order Management System

### Orders Table
- Order number (auto-generated, unique)
- Customer name (required, linked to Customers)
- Order date (default to today)
- Total amount (calculated from line items)
- Status (Draft, Confirmed, Shipped, Delivered)

### Order Items Table
- Product (linked to Products table)
- Quantity (number, minimum 1)
- Unit price (currency)
- Subtotal (calculated: quantity × unit price)
```

**Poor Example:**
```
Need a system to track orders and stuff. Should have customer info and products.
```

#### 2. Specifying Field Types

Genesis recognizes these field type hints:

- **Text**: "name", "description", "notes"
- **Number**: "quantity", "amount", "count"
- **Date**: "date", "deadline", "created at"
- **Select**: When you list options in parentheses
- **Currency**: "price", "cost", "amount" with currency context
- **Percentage**: "rate", "probability" with %
- **Link**: "linked to", "related to", "ref"

#### 3. Complex Relationships

```markdown
## Project Management System

### Projects
- Project name
- Client (linked to Clients table)
- Start date
- End date
- Budget

### Tasks
- Task name
- Project (linked to Projects - many tasks per project)
- Assigned to (linked to Team Members)
- Due date
- Status

### Time Entries
- Task (linked to Tasks)
- Team member (linked to Team Members)
- Hours worked
- Date
- Description
```

### Advanced Features

#### 1. Using Templates

```bash
# List available templates
node dist/genesis/cli/genesis-cli.js templates

# Use a specific template
node dist/genesis/cli/genesis-cli.js generate -t crm -o my-crm.json

# Available templates:
# - crm: Customer Relationship Management
# - inventory: Inventory Management
# - hr: Human Resources
# - project: Project Management
```

#### 2. Customizing Generation

```bash
# Custom configuration file
cat > genesis-config.json << EOF
{
  "language": "en",
  "generateSampleData": true,
  "includeFormulas": true,
  "createViews": {
    "summary": true,
    "detailed": true,
    "calendar": true
  }
}
EOF

# Use with config
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -c genesis-config.json
```

#### 3. Batch Processing

```bash
# Process multiple requirement files
for file in requirements/*.md; do
  output="output/$(basename "$file" .md).json"
  node dist/genesis/cli/genesis-cli.js generate -r "$file" -o "$output"
done
```

### Integration with Lark Base

#### 1. Automatic Deployment

```javascript
// deploy-genesis-output.js
const { createLarkBase } = require('./lark-base-creator');
const genesisOutput = require('./output.json');

async function deploy() {
  const result = await createLarkBase(genesisOutput);
  console.log('Base created:', result.baseToken);
}

deploy();
```

#### 2. Manual Import

1. Open Lark/Feishu
2. Go to Base section
3. Create new Base
4. Use Genesis output to create tables
5. Set up fields according to the schema
6. Configure relationships

### Troubleshooting

#### Common Issues

1. **"Failed to parse requirements"**
   - Ensure your markdown is properly formatted
   - Use clear headings and bullet points
   - Check for syntax errors

2. **"Invalid field type"**
   - Use recognized field type keywords
   - Be explicit about data types
   - Check the field type reference

3. **"Relationship not created"**
   - Ensure both tables exist
   - Use consistent table names
   - Specify relationship direction clearly

#### Debug Mode

```bash
# Enable debug logging
DEBUG=genesis:* node dist/genesis/cli/genesis-cli.js generate -r requirements.md -v

# Save debug output
DEBUG=genesis:* node dist/genesis/cli/genesis-cli.js generate -r requirements.md 2> debug.log
```

---

## Japanese

### 概要

Genesisシステムは、自然言語の要件からLark Baseアプリケーションを自動生成するAI搭載ツールです。ビジネス要件をテーブル、リレーションシップ、ワークフローを含む完全に機能するデータベースアプリケーションに変換します。

### Genesisでできること

1. **自動スキーマ生成**
   - 自然言語要件の解析
   - エンティティとリレーションシップの抽出
   - データベーススキーマの生成
   - フィールド定義の作成

2. **Lark Base統合**
   - テーブルの自動作成
   - リレーションシップの設定
   - ビューとフィルターの構成
   - フォームとダッシュボードの生成

3. **多言語サポート**
   - 英語の要件
   - 日本語の要件
   - 中国語の要件
   - 混合言語サポート

### はじめに

#### 1. 要件の準備

アプリケーションを説明する要件ドキュメントを作成します：

```markdown
# CRMシステム要件

## 概要
営業チーム向けの顧客関係管理システム。

## 機能
- 顧客情報の追跡
- 営業機会の管理
- やり取り履歴の記録
- 売上レポートの生成

## データ要件
### 顧客
- 会社名（必須）
- 業界
- 担当者
- メールアドレス
- 電話番号
- 住所

### 営業機会
- 案件名（必須）
- 顧客（顧客テーブルにリンク）
- 金額
- ステージ（見込み、検討、提案、交渉、成約、失注）
- 完了予定日
- 確率（％）

### 活動
- 活動タイプ（電話、メール、会議、タスク）
- 関連先（顧客または営業機会）
- 日時
- 説明
- 担当者
```

#### 2. Genesis CLIの使用

```bash
# 基本的な使用法
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -o output.json

# 詳細ログ付き
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -o output.json -v

# インタラクティブモード
node dist/genesis/cli/genesis-cli.js generate -i
```

#### 3. 出力の理解

GenesisはJSON ファイルを生成します：

```json
{
  "application": {
    "name": "CRMシステム",
    "description": "顧客関係管理システム",
    "tables": [
      {
        "name": "顧客",
        "fields": [
          {
            "name": "会社名",
            "type": "text",
            "required": true
          },
          {
            "name": "業界",
            "type": "select",
            "options": ["テクノロジー", "金融", "ヘルスケア", "小売", "その他"]
          }
        ]
      }
    ],
    "relationships": [
      {
        "from": "営業機会.顧客ID",
        "to": "顧客.ID",
        "type": "many-to-one"
      }
    ]
  }
}
```

### ベストプラクティス

#### 1. 明確な要件の記述

**良い例：**
```markdown
## 受注管理システム

### 受注テーブル
- 受注番号（自動生成、一意）
- 顧客名（必須、顧客テーブルにリンク）
- 受注日（デフォルトは今日）
- 合計金額（明細から計算）
- ステータス（下書き、確定、出荷済み、配送済み）

### 受注明細テーブル
- 商品（商品テーブルにリンク）
- 数量（数値、最小1）
- 単価（通貨）
- 小計（計算：数量×単価）
```

**悪い例：**
```
注文とかを追跡するシステムが必要。顧客情報と商品があればいい。
```

#### 2. フィールドタイプの指定

Genesisが認識するフィールドタイプのヒント：

- **テキスト**: 「名前」、「説明」、「メモ」
- **数値**: 「数量」、「金額」、「カウント」
- **日付**: 「日付」、「期限」、「作成日」
- **選択**: オプションを括弧内にリスト
- **通貨**: 通貨コンテキストでの「価格」、「コスト」、「金額」
- **パーセンテージ**: ％付きの「率」、「確率」
- **リンク**: 「〜にリンク」、「〜に関連」、「参照」

#### 3. 複雑なリレーションシップ

```markdown
## プロジェクト管理システム

### プロジェクト
- プロジェクト名
- クライアント（クライアントテーブルにリンク）
- 開始日
- 終了日
- 予算

### タスク
- タスク名
- プロジェクト（プロジェクトにリンク - 1プロジェクトに複数タスク）
- 担当者（チームメンバーにリンク）
- 期限
- ステータス

### 作業時間
- タスク（タスクにリンク）
- チームメンバー（チームメンバーにリンク）
- 作業時間
- 日付
- 説明
```

### 高度な機能

#### 1. テンプレートの使用

```bash
# 利用可能なテンプレートをリスト
node dist/genesis/cli/genesis-cli.js templates

# 特定のテンプレートを使用
node dist/genesis/cli/genesis-cli.js generate -t crm -o my-crm.json

# 利用可能なテンプレート：
# - crm: 顧客関係管理
# - inventory: 在庫管理
# - hr: 人事管理
# - project: プロジェクト管理
```

#### 2. 生成のカスタマイズ

```bash
# カスタム設定ファイル
cat > genesis-config.json << EOF
{
  "language": "ja",
  "generateSampleData": true,
  "includeFormulas": true,
  "createViews": {
    "summary": true,
    "detailed": true,
    "calendar": true
  }
}
EOF

# 設定付きで使用
node dist/genesis/cli/genesis-cli.js generate -r requirements.md -c genesis-config.json
```

#### 3. バッチ処理

```bash
# 複数の要件ファイルを処理
for file in requirements/*.md; do
  output="output/$(basename "$file" .md).json"
  node dist/genesis/cli/genesis-cli.js generate -r "$file" -o "$output"
done
```

### Lark Baseとの統合

#### 1. 自動デプロイ

```javascript
// deploy-genesis-output.js
const { createLarkBase } = require('./lark-base-creator');
const genesisOutput = require('./output.json');

async function deploy() {
  const result = await createLarkBase(genesisOutput);
  console.log('Base作成完了:', result.baseToken);
}

deploy();
```

#### 2. 手動インポート

1. Lark/Feishuを開く
2. Baseセクションに移動
3. 新しいBaseを作成
4. Genesis出力を使用してテーブルを作成
5. スキーマに従ってフィールドを設定
6. リレーションシップを構成

### トラブルシューティング

#### よくある問題

1. **「要件の解析に失敗しました」**
   - マークダウンが適切にフォーマットされているか確認
   - 明確な見出しと箇条書きを使用
   - 構文エラーをチェック

2. **「無効なフィールドタイプ」**
   - 認識されるフィールドタイプのキーワードを使用
   - データタイプを明示的に指定
   - フィールドタイプリファレンスを確認

3. **「リレーションシップが作成されません」**
   - 両方のテーブルが存在することを確認
   - 一貫したテーブル名を使用
   - リレーションシップの方向を明確に指定

#### デバッグモード

```bash
# デバッグログを有効化
DEBUG=genesis:* node dist/genesis/cli/genesis-cli.js generate -r requirements.md -v

# デバッグ出力を保存
DEBUG=genesis:* node dist/genesis/cli/genesis-cli.js generate -r requirements.md 2> debug.log
```

---

## 🔗 Related Documentation / 関連ドキュメント

- [CLI Usage Guide](CLI_USAGE_GUIDE.md) - Command line interface guide
- [System Overview](../01-OVERVIEW/README.md) - System introduction
- [API Reference](../03-TECHNICAL/API_REFERENCE.md) - API documentation

---

Last Updated: 2025-01-24