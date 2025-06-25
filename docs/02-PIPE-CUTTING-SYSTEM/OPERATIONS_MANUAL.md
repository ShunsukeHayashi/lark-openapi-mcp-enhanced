# Operations Manual / 運用マニュアル

## 🌐 Language / 言語

[English](#english) | [日本語](#japanese)

---

## English

### Daily Operations Guide

This manual provides step-by-step instructions for daily operations of the Special Pipe Cutting Management System. Follow these procedures to ensure efficient and consistent operations.

### 1. System Startup Procedures

#### 1.1 Morning Startup Checklist
```
□ 1. Log into the system with your credentials
□ 2. Check system notifications and alerts
□ 3. Review pending orders and priorities
□ 4. Verify machine availability status
□ 5. Check material inventory levels
□ 6. Review operator schedules
□ 7. Confirm quality inspection resources
```

#### 1.2 System Health Check
- **Server Status**: Verify all services are running
- **Database Connection**: Confirm database accessibility
- **Integration Status**: Check Lark API connectivity
- **Backup Status**: Verify last backup completion

### 2. Order Processing Workflow

#### 2.1 New Order Entry
1. **Customer Selection**
   - Search existing customer or create new
   - Verify credit limit and payment terms
   - Update contact information if needed

2. **Order Details**
   - Enter order date and required delivery date
   - Set order priority (Normal/High/Urgent)
   - Add special instructions or notes

3. **Item Entry**
   ```
   For each order item:
   a. Select or create pipe specification
   b. Enter quantity required
   c. Confirm unit price
   d. Verify availability
   e. Check lead time
   ```

4. **Order Validation**
   - System checks material availability
   - Validates production capacity
   - Confirms delivery feasibility
   - Generates order confirmation

#### 2.2 Order Modification
- Access order through search function
- Make required changes
- System logs all modifications
- Notifications sent to affected departments

### 3. Production Planning

#### 3.1 Daily Production Schedule
1. **Review Orders**
   ```
   Filter: Status = "Confirmed" AND Due Date <= Today + Lead Time
   Sort: Priority DESC, Due Date ASC
   ```

2. **Machine Assignment**
   - Check machine capabilities vs requirements
   - Consider setup times between jobs
   - Balance workload across machines
   - Account for maintenance windows

3. **Operator Assignment**
   - Match operator skills to job requirements
   - Consider shift schedules
   - Ensure certification compliance
   - Plan for breaks and shift changes

#### 3.2 Material Preparation
1. **Material Verification**
   - Check material certificates
   - Verify dimensions and grade
   - Inspect surface condition
   - Record lot numbers

2. **Material Staging**
   - Move materials to cutting area
   - Organize by job sequence
   - Label with job numbers
   - Update location in system

### 4. Production Execution

#### 4.1 Job Start Procedure
1. **Pre-Production Setup**
   ```
   a. Select job from queue
   b. Review work instructions
   c. Verify machine settings
   d. Load cutting program
   e. Install appropriate tooling
   f. Perform test cut if required
   ```

2. **Production Start**
   - Clock in to job
   - Record actual start time
   - Note any setup issues
   - Begin production run

#### 4.2 In-Process Monitoring
- **Parameter Monitoring**
  - Cutting speed
  - Feed rate
  - Coolant flow
  - Tool wear indicators

- **Quality Checks**
  - First piece inspection
  - Periodic sampling
  - Dimension verification
  - Surface quality assessment

#### 4.3 Job Completion
1. Update production quantity
2. Record actual completion time
3. Note any quality issues
4. Clean work area
5. Stage completed items for QC

### 5. Quality Control Procedures

#### 5.1 Inspection Process
1. **Receiving Inspection**
   ```
   For each batch:
   - Verify material certification
   - Check dimensions (sample)
   - Inspect surface quality
   - Record in system
   ```

2. **In-Process Inspection**
   - First article inspection mandatory
   - Sampling per quality plan
   - Document all measurements
   - Flag non-conformances immediately

3. **Final Inspection**
   - 100% visual inspection
   - Dimensional check per sampling plan
   - Surface finish verification
   - Package inspection

#### 5.2 Non-Conformance Handling
1. **Immediate Actions**
   - Stop production if critical
   - Isolate affected items
   - Notify supervisor
   - Create NC report

2. **Investigation**
   - Root cause analysis
   - Corrective action plan
   - Preventive measures
   - Update procedures if needed

### 6. Maintenance Operations

#### 6.1 Daily Maintenance
```
□ Clean cutting area
□ Check coolant levels
□ Inspect tooling condition
□ Verify safety systems
□ Log maintenance activities
```

#### 6.2 Scheduled Maintenance
- Follow manufacturer schedules
- Use system maintenance calendar
- Order parts in advance
- Schedule during low-demand periods
- Document all work performed

### 7. End of Day Procedures

#### 7.1 Production Closure
1. Complete all open jobs
2. Update production records
3. Prepare next day's schedule
4. Clean and organize work areas
5. Secure tools and materials

#### 7.2 System Shutdown
```
□ Save all work in progress
□ Run end-of-day reports
□ Backup critical data
□ Log out of system
□ Notify next shift of any issues
```

### 8. Reporting Requirements

#### 8.1 Daily Reports
- Production summary
- Quality metrics
- Machine utilization
- Material consumption
- Pending orders status

#### 8.2 Weekly Reports
- Production efficiency analysis
- Quality trend analysis
- Delivery performance
- Inventory status
- Maintenance summary

### 9. Emergency Procedures

#### 9.1 System Failure
1. Note error messages
2. Contact IT support
3. Switch to manual backup procedures
4. Document all manual transactions
5. Enter data when system restored

#### 9.2 Quality Emergency
1. Stop affected production
2. Quarantine suspect product
3. Notify quality manager
4. Initiate recall if shipped
5. Document all actions

---

## Japanese

### 日次運用ガイド

このマニュアルは、特殊パイプ切断管理システムの日常運用のための段階的な手順を提供します。効率的で一貫した運用を確保するために、これらの手順に従ってください。

### 1. システム起動手順

#### 1.1 朝の起動チェックリスト
```
□ 1. 認証情報でシステムにログイン
□ 2. システム通知とアラートを確認
□ 3. 保留中の受注と優先順位を確認
□ 4. 機械の稼働状況を確認
□ 5. 材料在庫レベルを確認
□ 6. オペレータースケジュールを確認
□ 7. 品質検査リソースを確認
```

#### 1.2 システムヘルスチェック
- **サーバーステータス**: すべてのサービスが実行中であることを確認
- **データベース接続**: データベースのアクセシビリティを確認
- **統合ステータス**: Lark API接続を確認
- **バックアップステータス**: 最後のバックアップ完了を確認

### 2. 受注処理ワークフロー

#### 2.1 新規受注入力
1. **顧客選択**
   - 既存顧客を検索または新規作成
   - 与信限度額と支払条件を確認
   - 必要に応じて連絡先情報を更新

2. **受注詳細**
   - 受注日と必要納期を入力
   - 受注優先度を設定（通常/高/緊急）
   - 特別な指示やメモを追加

3. **品目入力**
   ```
   各受注品目について：
   a. パイプ仕様を選択または作成
   b. 必要数量を入力
   c. 単価を確認
   d. 在庫を確認
   e. リードタイムを確認
   ```

4. **受注検証**
   - システムが材料在庫を確認
   - 生産能力を検証
   - 納期実現可能性を確認
   - 受注確認書を生成

#### 2.2 受注変更
- 検索機能で受注にアクセス
- 必要な変更を実施
- システムがすべての変更をログ記録
- 影響を受ける部門に通知送信

### 3. 生産計画

#### 3.1 日次生産スケジュール
1. **受注確認**
   ```
   フィルター: ステータス = "確定" AND 納期 <= 今日 + リードタイム
   ソート: 優先度 降順, 納期 昇順
   ```

2. **機械割り当て**
   - 機械能力と要件を確認
   - ジョブ間のセットアップ時間を考慮
   - 機械間で作業負荷を分散
   - メンテナンス時間を考慮

3. **オペレーター割り当て**
   - オペレータースキルとジョブ要件を照合
   - シフトスケジュールを考慮
   - 認証コンプライアンスを確保
   - 休憩とシフト交代を計画

#### 3.2 材料準備
1. **材料確認**
   - 材料証明書を確認
   - 寸法とグレードを確認
   - 表面状態を検査
   - ロット番号を記録

2. **材料段取り**
   - 材料を切断エリアに移動
   - ジョブ順序で整理
   - ジョブ番号でラベル付け
   - システムで場所を更新

### 4. 生産実行

#### 4.1 ジョブ開始手順
1. **生産前セットアップ**
   ```
   a. キューからジョブを選択
   b. 作業指示書を確認
   c. 機械設定を確認
   d. 切断プログラムをロード
   e. 適切な工具を取り付け
   f. 必要に応じてテストカットを実施
   ```

2. **生産開始**
   - ジョブにクロックイン
   - 実際の開始時刻を記録
   - セットアップの問題を記録
   - 生産開始

#### 4.2 工程内モニタリング
- **パラメータモニタリング**
  - 切断速度
  - 送り速度
  - クーラント流量
  - 工具摩耗インジケーター

- **品質チェック**
  - 初品検査
  - 定期的サンプリング
  - 寸法確認
  - 表面品質評価

#### 4.3 ジョブ完了
1. 生産数量を更新
2. 実際の完了時刻を記録
3. 品質問題を記録
4. 作業エリアを清掃
5. 完成品をQC用に段取り

### 5. 品質管理手順

#### 5.1 検査プロセス
1. **受入検査**
   ```
   各バッチについて：
   - 材料証明書を確認
   - 寸法を確認（サンプル）
   - 表面品質を検査
   - システムに記録
   ```

2. **工程内検査**
   - 初品検査必須
   - 品質計画に従ったサンプリング
   - すべての測定を文書化
   - 不適合を即座にフラグ

3. **最終検査**
   - 100%外観検査
   - サンプリング計画に従った寸法チェック
   - 表面仕上げ確認
   - 梱包検査

#### 5.2 不適合処理
1. **即時対応**
   - 重大な場合は生産停止
   - 影響品を隔離
   - 監督者に通知
   - NCレポート作成

2. **調査**
   - 根本原因分析
   - 是正措置計画
   - 予防措置
   - 必要に応じて手順更新

### 6. メンテナンス作業

#### 6.1 日常メンテナンス
```
□ 切断エリアを清掃
□ クーラントレベルを確認
□ 工具状態を検査
□ 安全システムを確認
□ メンテナンス活動をログ記録
```

#### 6.2 定期メンテナンス
- メーカーのスケジュールに従う
- システムメンテナンスカレンダーを使用
- 部品を事前注文
- 低需要期間中にスケジュール
- 実施したすべての作業を文書化

### 7. 終業手順

#### 7.1 生産終了
1. すべての未完了ジョブを完了
2. 生産記録を更新
3. 翌日のスケジュールを準備
4. 作業エリアを清掃・整理
5. 工具と材料を保管

#### 7.2 システムシャットダウン
```
□ 進行中のすべての作業を保存
□ 日次レポートを実行
□ 重要データをバックアップ
□ システムからログアウト
□ 次のシフトに問題を通知
```

### 8. レポート要件

#### 8.1 日次レポート
- 生産サマリー
- 品質メトリクス
- 機械稼働率
- 材料消費
- 保留受注ステータス

#### 8.2 週次レポート
- 生産効率分析
- 品質トレンド分析
- 納期パフォーマンス
- 在庫ステータス
- メンテナンスサマリー

### 9. 緊急手順

#### 9.1 システム障害
1. エラーメッセージを記録
2. ITサポートに連絡
3. 手動バックアップ手順に切り替え
4. すべての手動トランザクションを文書化
5. システム復旧時にデータ入力

#### 9.2 品質緊急事態
1. 影響を受ける生産を停止
2. 疑わしい製品を隔離
3. 品質マネージャーに通知
4. 出荷済みの場合はリコール開始
5. すべての行動を文書化

---

## 🔗 Related Documentation / 関連ドキュメント

- [System Overview](SYSTEM_OVERVIEW.md) - System introduction
- [Features](FEATURES.md) - Complete feature list
- [Database Schema](DATABASE_SCHEMA.md) - Database design

---

Last Updated: 2025-01-24