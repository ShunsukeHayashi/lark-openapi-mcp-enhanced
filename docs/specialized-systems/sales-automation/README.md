# YouTube CRM Sales Automation System
## Lark Base 営業フォローアップ自動化 & レポート生成システム

このシステムは、YouTube CRMシステムにおける営業活動の自動化とレポート生成を実現します。

## 📁 プロジェクト構造

```
sales-automation/
├── README.md                          # このファイル
├── automation/                        # 自動化設定
│   ├── follow-up-rules/              # フォローアップルール
│   │   ├── deal-follow-up.json      # 商談フォローアップ設定
│   │   ├── customer-touchpoint.json # 顧客接触管理設定
│   │   └── activity-triggers.json   # 活動ベーストリガー設定
│   ├── workflows/                    # ワークフロー定義
│   │   ├── new-deal-workflow.json   # 新規商談ワークフロー
│   │   ├── follow-up-workflow.json  # フォローアップワークフロー
│   │   └── escalation-workflow.json # エスカレーションワークフロー
│   └── templates/                    # 通知テンプレート
│       ├── email-templates.json     # メールテンプレート
│       ├── slack-templates.json     # Slackテンプレート
│       └── lark-templates.json      # Larkテンプレート
├── reports/                          # レポート設定
│   ├── daily/                       # 日次レポート
│   │   └── daily-activity-report.json
│   ├── weekly/                      # 週次レポート
│   │   └── weekly-performance-report.json
│   ├── monthly/                     # 月次レポート
│   │   └── monthly-analysis-report.json
│   └── custom/                      # カスタムレポート
│       ├── executive-summary.json   # 役員向けサマリー
│       └── individual-report.json   # 個人レポート
├── scripts/                         # 実装スクリプト
│   ├── lark-base-automation.js     # Lark Base自動化スクリプト
│   ├── report-generator.js         # レポート生成スクリプト
│   └── notification-sender.js      # 通知送信スクリプト
└── docs/                           # ドキュメント
    ├── setup-guide.md              # セットアップガイド
    ├── automation-guide.md         # 自動化ガイド
    └── report-guide.md             # レポートガイド
```

## 🚀 クイックスタート

1. Lark Baseにアクセス: https://f82jyx0mblu.jp.larksuite.com/base/BI4RbpcKxaR7C2sLq9GjXJUjp2b
2. 自動化ルールを設定（`automation/`フォルダ参照）
3. レポートテンプレートを適用（`reports/`フォルダ参照）
4. 通知連携を設定（`scripts/`フォルダ参照）

## 📊 主要機能

### 1. 営業フォローアップ自動化
- 商談ステージに基づく自動フォローアップ
- 顧客接触履歴の自動管理
- YouTube動画送付後の効果測定

### 2. 自動レポート生成
- 日次・週次・月次レポートの自動生成
- カスタマイズ可能なレポートテンプレート
- 自動配信機能

### 3. 通知・アラート機能
- マルチチャネル通知（メール、Slack、Lark）
- 優先度に基づくアラート
- モバイルプッシュ通知対応

## 📖 詳細ドキュメント

- [セットアップガイド](docs/setup-guide.md)
- [自動化設定ガイド](docs/automation-guide.md)
- [レポート作成ガイド](docs/report-guide.md)