# 📋 Context Generation Preprompt - TeachableCRM Integration

## 🎯 Document Genesis Blueprint Generator (Ver. 2.0)

このPrepromptは、統合プロダクト管理＆VIPメンバーシップシステムの完全な設計仕様書として機能します。

### 📊 Current Implementation Status

**✅ LIVE SYSTEM**: https://feishu.cn/base/QsyGbbnQ6aUdaMscMJ8jVHoFpHb

**Created by**: MCP Tool Use Agent  
**Status**: Fully operational with 6 interconnected tables

### 🏗️ System Architecture Overview

#### Core Entities (6 Tables)
1. **Products** - プロダクトマスタ (tblAEsnk7TPO2VXh)
2. **Customers** - 顧客マスタ (tbl9b5ukafkBKnP2)  
3. **Membership_Tiers** - VIPプラン (tbltSADWXZkPX3ML)
4. **Subscriptions_Sales** - 購入記録 (tbldp6NS9FNwJkyD)
5. **Bundle_Items** - バンドル構成 (tbl6ikc5r3ofAxy2)
6. **Tier_Perks** - プラン特典 (tblwtMfFa5J6DxTC)

#### Business Logic Implementation
- **VIP Membership**: ¥55,000/月額プラン
- **Product Types**: Course, Coaching, Digital Download, Community, Bundle
- **Automatic Calculations**: LTV, Revenue Rollups (待実装)
- **Complex Relations**: Many-to-many relationships via junction tables

## 🚀 Context Applications

### 1. System Enhancement Prompts
```
このPrepromptのC5設計に基づいて、稼働中のTeachableCRM-Integrationシステム
(https://feishu.cn/base/QsyGbbnQ6aUdaMscMJ8jVHoFpHb)
にロールアップ計算機能を追加してください。

対象:
- Customers.LTV (購入金額合計)
- Products.総売上 (売上集計)  
- Products.参加者数 (ユニーク購入者数)
```

### 2. Workflow Automation Setup
```
C6ワークフロー設計に基づいて、VIP会員自動特典付与システムを実装してください。

トリガー: Subscriptions_Salesで加入プラン='VIP'のレコード作成時
アクション: Tier_Perksテーブルから対象特典を自動取得・付与
```

### 3. Relational Structure Enhancement
```
C4のER図設計に従って、テーブル間のリンクフィールドを設定してください。

必要なリレーション:
- Customers ↔ Subscriptions_Sales
- Products ↔ Subscriptions_Sales  
- Membership_Tiers ↔ Subscriptions_Sales
- Products(Bundle) ↔ Bundle_Items
- Membership_Tiers ↔ Tier_Perks
```

### 4. Data Population & Testing
```
C7最終設計図に基づいて、稼働システムにテストデータを投入してください。

データセット:
- 10件の多様なプロダクト
- 20名のサンプル顧客
- VIP・一般・トライアルの3段階メンバーシップ
- 50件の購入履歴データ
- バンドル商品の構成設定
```

## 🔄 Regeneration Capabilities

### Document Genesis Function
このPrepromptは、類似システムの設計書を自動生成するためのテンプレートとして機能：

```
【新規システム生成例】
入力: 「オンラインスクール用の生徒管理システム」
処理: C1-C7プロセスを適用
出力: 完全なLark Base設計仕様書
```

### Prompt Asset Management
組織のプロンプト資産として管理・共有可能：
- **検索性**: タグ・カテゴリ管理
- **バージョン管理**: 改善履歴追跡
- **再利用性**: テンプレート化
- **ガバナンス**: 権限・承認フロー

## 🎯 Next Evolution Steps

### Phase 1: Core Enhancement
- ロールアップ計算の実装
- テーブルリレーション完成
- VIPワークフロー自動化

### Phase 2: Advanced Features  
- Teachable API連携
- 自動レポート生成
- 高度な分析ダッシュボード

### Phase 3: Ecosystem Integration
- 他システムとの連携
- AIエージェント組み込み
- 予測分析機能

## 📚 Reference Documentation

**Live System**: [TeachableCRM-Integration](https://feishu.cn/base/QsyGbbnQ6aUdaMscMJ8jVHoFpHb)  
**MCP Agent**: `/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp/mcp-tool-agent.py`  
**Error Handling**: `error-handling-guide.md`  
**System Status**: `crm-system-status.md`

---

🎉 **このPrepromptにより、TeachableCRM-Integrationの完全な設計コンテキストが確立されました。**

任意の拡張・改善作業において、このコンテキストを参照することで一貫性のある開発が可能です。