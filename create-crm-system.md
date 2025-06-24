# 🚀 Creating Teachable-Integrated CRM Base System

## ⚡ Execution Command for Claude Desktop

Copy and paste this exact command into Claude Desktop:

```
Lark MCPツールを使用して、統合プロダクト管理＆VIPメンバーシップシステムのBaseを作成してください。

システム名: TeachableCRM-Integration

以下の6テーブル構造で作成:

**1. Products テーブル（プロダクトマスタ）**
- プロダクト名 (テキスト・プライマリ)
- プロダクトタイプ (単一選択: Course, Coaching, Digital Download, Community, Bundle)
- 価格 (数値・通貨)
- 説明 (リッチテキスト)
- 作成日 (日付)
- 販売ステータス (単一選択: Published, Unpublished, Unlisted)
- 総売上 (数値・ロールアップ) ※Subscriptions_Salesから集計
- 参加者数 (数値・ロールアップ) ※Subscriptions_Salesからユニーク数

**2. Customers テーブル（顧客マスタ）**
- 氏名 (テキスト・プライマリ)
- メールアドレス (メール)
- LTV (数値・ロールアップ) ※Subscriptions_Salesから購入金額合計

**3. Membership_Tiers テーブル（メンバーシッププラン）**
- プラン名 (テキスト・プライマリ)
- 月額料金 (数値・通貨)
- 年額料金 (数値・通貨)
- 説明 (リッチテキスト)

**4. Subscriptions_Sales テーブル（購入・加入記録）**
- 記録ID (自動採番・プライマリ)
- 購入者 (リンク→Customers)
- 購入プロダクト (リンク→Products)
- 加入プラン (リンク→Membership_Tiers)
- 購入日 (日付)
- 種別 (単一選択: 単体購入, サブスクリプション)
- 購入金額 (数値・通貨)

**5. Bundle_Items テーブル（バンドル構成）**
- 構成ID (自動採番・プライマリ)
- 親バンドル (リンク→Products) ※Bundle タイプのみ
- 子プロダクト (リンク→Products)

**6. Tier_Perks テーブル（プラン特典）**
- 特典ID (自動採番・プライマリ)
- 対象プラン (リンク→Membership_Tiers)
- 特典プロダクト (リンク→Products)

**重要な設定:**
- テーブル間のリレーション設定
- ロールアップ計算の自動化
- VIPプラン（月額¥55,000）のサンプルデータ追加

このシステムでTeachableプロダクトの統合管理とVIPメンバーシップの自動化を実現してください。
```

## 📊 Expected Results

成功時に作成されるもの:
- ✅ 6つの相互関連テーブル
- ✅ 自動LTV計算
- ✅ 売上ロールアップ
- ✅ VIP特典管理
- ✅ バンドル商品構成

## 🔗 Alternative Quick Commands

### Simple Test First:
```
「新しいBaseを作成してテストしてください」
```

### Step-by-step Creation:
```
「まずProductsテーブルから作成を開始してください」
```

## 🚀 Ready to Execute!

MCPサーバーが稼働中。Claude Desktopで上記コマンドを実行してください。