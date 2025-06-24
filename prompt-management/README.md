# Prompt Management System

## 概要 / Overview

このディレクトリは、AI プロンプトの体系的管理とバージョン管理を目的とした統合管理システムです。

## ディレクトリ構成 / Directory Structure

```
prompt-management/
├── README.md                 # このファイル
├── prompts/                  # プロンプト本体
│   ├── categories/           # カテゴリ別プロンプト
│   │   ├── analysis/         # 分析系プロンプト
│   │   ├── generation/       # 生成系プロンプト
│   │   ├── planning/         # 計画・設計系プロンプト
│   │   ├── transformation/   # 変換・リファクタ系プロンプト
│   │   └── troubleshooting/  # トラブルシューティング系
│   ├── templates/            # プロンプトテンプレート
│   └── examples/             # 使用例とベストプラクティス
├── metadata/                 # メタデータ管理
│   ├── index.json           # プロンプトインデックス
│   ├── tags.json            # タグ管理
│   └── changelog.md         # 変更履歴
├── tools/                   # 管理ツール
│   ├── prompt-generator.py  # プロンプト生成ツール
│   ├── validator.py         # プロンプト検証ツール
│   └── search.py           # プロンプト検索ツール
└── config/                  # 設定ファイル
    ├── schema.json         # プロンプトスキーマ定義
    └── settings.yaml       # システム設定
```

## プロンプト分類体系 / Classification System

### 主要カテゴリ / Main Categories

1. **Analysis (分析)**
   - データ分析
   - コード分析
   - 要件分析
   - 問題分析

2. **Generation (生成)**
   - コード生成
   - ドキュメント生成
   - テンプレート生成
   - アイデア生成

3. **Planning (計画・設計)**
   - プロジェクト計画
   - アーキテクチャ設計
   - 戦略策定
   - ロードマップ作成

4. **Transformation (変換・リファクタ)**
   - データ変換
   - コードリファクタリング
   - フォーマット変換
   - 構造化

5. **Troubleshooting (問題解決)**
   - エラー診断
   - パフォーマンス改善
   - デバッグ支援
   - 最適化

### タグシステム / Tagging System

- **技術領域**: `tech:python`, `tech:javascript`, `tech:lark-api`
- **難易度**: `level:beginner`, `level:intermediate`, `level:advanced`
- **用途**: `purpose:automation`, `purpose:documentation`, `purpose:analysis`
- **出力形式**: `output:markdown`, `output:json`, `output:code`
- **対象者**: `audience:developer`, `audience:business`, `audience:general`

## プロンプト標準フォーマット / Standard Format

```markdown
---
id: prompt-001
title: "プロンプトタイトル"
category: analysis
tags: [tech:python, level:intermediate, purpose:automation]
version: 1.0.0
author: "作成者名"
created: 2025-01-XX
updated: 2025-01-XX
description: "プロンプトの説明"
input_requirements:
  - 入力要件1
  - 入力要件2
output_format: "出力形式の説明"
dependencies: []
related_prompts: []
---

# プロンプト本文

[ここにプロンプトの内容]

## 使用例 / Usage Example

[具体的な使用例]

## 注意事項 / Notes

[重要な注意点や制限事項]
```

## 管理ルール / Management Rules

### 1. バージョン管理 / Version Control
- セマンティックバージョニング（Major.Minor.Patch）
- 重要な変更には必ずchangelogを更新
- 後方互換性の考慮

### 2. 品質基準 / Quality Standards
- 明確な目的と期待される出力の定義
- 再現可能な結果
- 適切なエラーハンドリング
- 十分なドキュメント

### 3. 命名規則 / Naming Conventions
- ファイル名: `kebab-case.md`
- ID: `category-sequence` (例: analysis-001)
- タグ: `namespace:value` 形式

## 使用方法 / Usage

### 1. プロンプト検索
```bash
python tools/search.py --category analysis --tag tech:python
```

### 2. 新しいプロンプト作成
```bash
python tools/prompt-generator.py --template base --category analysis
```

### 3. バリデーション
```bash
python tools/validator.py --file prompts/categories/analysis/code-review.md
```

## 今後の拡張予定 / Future Enhancements

- [ ] Web UI での管理インターフェース
- [ ] プロンプトの実行統計収集
- [ ] 自動テスト機能
- [ ] プロンプトチェーン機能
- [ ] 外部システム連携（Lark Base等）

## コントリビューション / Contributing

1. 新しいプロンプトは標準フォーマットに従う
2. 適切なカテゴリとタグを設定
3. 使用例を必ず含める
4. バリデーションを通過させる
5. changelogを更新