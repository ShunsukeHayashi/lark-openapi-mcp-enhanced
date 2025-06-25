# Database Schema / データベーススキーマ

## 🌐 Language / 言語

[English](#english) | [日本語](#japanese)

---

## English

### Database Schema Overview

The Special Pipe Cutting Management System uses a comprehensive database schema implemented in Lark Base. The schema is designed for scalability, data integrity, and efficient querying.

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Customers    │     │     Orders      │     │   Order_Items   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ customer_id (PK)│────<│ order_id (PK)   │────<│ item_id (PK)    │
│ company_name    │     │ customer_id (FK)│     │ order_id (FK)   │
│ contact_person  │     │ order_date      │     │ pipe_spec_id(FK)│
│ email          │     │ due_date        │     │ quantity        │
│ phone          │     │ status          │     │ unit_price      │
│ address        │     │ total_amount    │     │ status          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Pipe_Specs      │     │Production_Jobs  │     │ Quality_Checks  │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ spec_id (PK)    │────<│ job_id (PK)     │────>│ check_id (PK)   │
│ material_type   │     │ item_id (FK)    │     │ job_id (FK)     │
│ outer_diameter  │     │ machine_id (FK) │     │ check_type      │
│ wall_thickness  │     │ operator_id (FK)│     │ result          │
│ length         │     │ start_time      │     │ inspector_id(FK)│
│ grade          │     │ end_time        │     │ check_time      │
│ cutting_angle   │     │ status          │     │ notes           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Machines     │     │   Operators     │     │   Materials     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ machine_id (PK) │     │ operator_id (PK)│     │ material_id (PK)│
│ machine_name    │     │ name            │     │ material_type   │
│ machine_type    │     │ employee_id     │     │ grade           │
│ capacity        │     │ certification   │     │ supplier_id (FK)│
│ status          │     │ shift           │     │ quantity_stock  │
│ last_maintenance│     │ contact         │     │ unit_cost       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Table Definitions

#### 1. Customers Table

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| customer_id | String | PRIMARY KEY | Unique customer identifier |
| company_name | String | NOT NULL | Company name |
| contact_person | String | NOT NULL | Primary contact name |
| email | String | UNIQUE | Contact email |
| phone | String | | Contact phone |
| address | Text | | Company address |
| credit_limit | Number | DEFAULT 0 | Credit limit amount |
| created_at | DateTime | DEFAULT NOW | Record creation time |
| updated_at | DateTime | | Last update time |

#### 2. Orders Table

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| order_id | String | PRIMARY KEY | Unique order identifier |
| customer_id | String | FOREIGN KEY | Reference to customer |
| order_date | DateTime | NOT NULL | Order placement date |
| due_date | DateTime | NOT NULL | Expected delivery date |
| status | Enum | NOT NULL | Order status |
| priority | Enum | DEFAULT 'Normal' | Order priority |
| total_amount | Number | | Total order value |
| notes | Text | | Additional notes |
| created_by | String | | User who created order |

**Status Enum Values:**
- `Draft`
- `Confirmed`
- `In_Production`
- `Quality_Check`
- `Ready_to_Ship`
- `Shipped`
- `Completed`
- `Cancelled`

#### 3. Order_Items Table

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| item_id | String | PRIMARY KEY | Unique item identifier |
| order_id | String | FOREIGN KEY | Reference to order |
| pipe_spec_id | String | FOREIGN KEY | Reference to pipe spec |
| quantity | Number | NOT NULL | Quantity ordered |
| unit_price | Number | NOT NULL | Price per unit |
| total_price | Number | COMPUTED | quantity × unit_price |
| status | Enum | NOT NULL | Item production status |
| completion_rate | Number | DEFAULT 0 | Production completion % |

#### 4. Pipe_Specs Table

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| spec_id | String | PRIMARY KEY | Unique specification ID |
| material_type | Enum | NOT NULL | Material classification |
| outer_diameter | Number | NOT NULL | OD in mm |
| wall_thickness | Number | NOT NULL | Wall thickness in mm |
| length | Number | NOT NULL | Length in mm |
| grade | String | | Material grade |
| cutting_angle | Number | DEFAULT 90 | Cut angle in degrees |
| tolerance_od | Number | DEFAULT 0.1 | OD tolerance ± mm |
| tolerance_length | Number | DEFAULT 1 | Length tolerance ± mm |
| surface_treatment | String | | Surface treatment type |

#### 5. Production_Jobs Table

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| job_id | String | PRIMARY KEY | Unique job identifier |
| item_id | String | FOREIGN KEY | Reference to order item |
| machine_id | String | FOREIGN KEY | Assigned machine |
| operator_id | String | FOREIGN KEY | Assigned operator |
| start_time | DateTime | | Job start time |
| end_time | DateTime | | Job completion time |
| setup_time | Number | | Setup duration (minutes) |
| run_time | Number | | Actual run time (minutes) |
| quantity_produced | Number | DEFAULT 0 | Pieces produced |
| quantity_passed | Number | DEFAULT 0 | Pieces passed QC |
| status | Enum | NOT NULL | Job status |

#### 6. Quality_Checks Table

| Field Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| check_id | String | PRIMARY KEY | Unique check ID |
| job_id | String | FOREIGN KEY | Reference to production job |
| check_type | Enum | NOT NULL | Type of quality check |
| dimension_od | Number | | Measured OD |
| dimension_length | Number | | Measured length |
| surface_quality | Enum | | Surface quality rating |
| result | Enum | NOT NULL | Pass/Fail/Rework |
| inspector_id | String | FOREIGN KEY | Quality inspector |
| check_time | DateTime | NOT NULL | Inspection time |
| defect_codes | Array | | List of defect codes |
| notes | Text | | Inspection notes |

### Indexes and Performance Optimization

```sql
-- Primary Indexes (automatically created)
CREATE INDEX idx_orders_customer ON Orders(customer_id);
CREATE INDEX idx_order_items_order ON Order_Items(order_id);
CREATE INDEX idx_production_jobs_item ON Production_Jobs(item_id);
CREATE INDEX idx_quality_checks_job ON Quality_Checks(job_id);

-- Performance Indexes
CREATE INDEX idx_orders_status_date ON Orders(status, order_date);
CREATE INDEX idx_production_jobs_status ON Production_Jobs(status);
CREATE INDEX idx_materials_type_grade ON Materials(material_type, grade);
CREATE INDEX idx_quality_checks_result ON Quality_Checks(result);
```

### Data Integrity Rules

1. **Referential Integrity**
   - All foreign keys must reference existing records
   - Cascade updates for customer information
   - Restrict deletion of records with dependencies

2. **Business Rules**
   - Order due_date must be after order_date
   - Production quantity cannot exceed ordered quantity
   - Quality check must be performed before status change to 'Completed'

3. **Validation Rules**
   - Pipe dimensions must be within valid ranges
   - Dates cannot be in the future for completed operations
   - Quantity values must be positive

---

## Japanese

### データベーススキーマ概要

特殊パイプ切断管理システムは、Lark Baseで実装された包括的なデータベーススキーマを使用しています。このスキーマは、拡張性、データ整合性、効率的なクエリのために設計されています。

### エンティティ関係図

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      顧客       │     │      受注       │     │    受注明細     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ customer_id (PK)│────<│ order_id (PK)   │────<│ item_id (PK)    │
│ company_name    │     │ customer_id (FK)│     │ order_id (FK)   │
│ contact_person  │     │ order_date      │     │ pipe_spec_id(FK)│
│ email          │     │ due_date        │     │ quantity        │
│ phone          │     │ status          │     │ unit_price      │
│ address        │     │ total_amount    │     │ status          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   パイプ仕様    │     │    生産ジョブ    │     │    品質検査     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ spec_id (PK)    │────<│ job_id (PK)     │────>│ check_id (PK)   │
│ material_type   │     │ item_id (FK)    │     │ job_id (FK)     │
│ outer_diameter  │     │ machine_id (FK) │     │ check_type      │
│ wall_thickness  │     │ operator_id (FK)│     │ result          │
│ length         │     │ start_time      │     │ inspector_id(FK)│
│ grade          │     │ end_time        │     │ check_time      │
│ cutting_angle   │     │ status          │     │ notes           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      機械       │     │    オペレーター  │     │      材料       │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ machine_id (PK) │     │ operator_id (PK)│     │ material_id (PK)│
│ machine_name    │     │ name            │     │ material_type   │
│ machine_type    │     │ employee_id     │     │ grade           │
│ capacity        │     │ certification   │     │ supplier_id (FK)│
│ status          │     │ shift           │     │ quantity_stock  │
│ last_maintenance│     │ contact         │     │ unit_cost       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### テーブル定義

#### 1. 顧客テーブル

| フィールド名 | データ型 | 制約 | 説明 |
|------------|---------|------|------|
| customer_id | 文字列 | 主キー | 一意の顧客識別子 |
| company_name | 文字列 | NOT NULL | 会社名 |
| contact_person | 文字列 | NOT NULL | 主要連絡先名 |
| email | 文字列 | UNIQUE | 連絡先メール |
| phone | 文字列 | | 連絡先電話 |
| address | テキスト | | 会社住所 |
| credit_limit | 数値 | DEFAULT 0 | 与信限度額 |
| created_at | 日時 | DEFAULT NOW | レコード作成時刻 |
| updated_at | 日時 | | 最終更新時刻 |

#### 2. 受注テーブル

| フィールド名 | データ型 | 制約 | 説明 |
|------------|---------|------|------|
| order_id | 文字列 | 主キー | 一意の受注識別子 |
| customer_id | 文字列 | 外部キー | 顧客への参照 |
| order_date | 日時 | NOT NULL | 受注日 |
| due_date | 日時 | NOT NULL | 納期 |
| status | 列挙型 | NOT NULL | 受注ステータス |
| priority | 列挙型 | DEFAULT '通常' | 受注優先度 |
| total_amount | 数値 | | 受注総額 |
| notes | テキスト | | 追加メモ |
| created_by | 文字列 | | 受注作成者 |

**ステータス列挙値：**
- `下書き`
- `確定`
- `生産中`
- `品質検査`
- `出荷準備完了`
- `出荷済み`
- `完了`
- `キャンセル`

#### 3. 受注明細テーブル

| フィールド名 | データ型 | 制約 | 説明 |
|------------|---------|------|------|
| item_id | 文字列 | 主キー | 一意の明細識別子 |
| order_id | 文字列 | 外部キー | 受注への参照 |
| pipe_spec_id | 文字列 | 外部キー | パイプ仕様への参照 |
| quantity | 数値 | NOT NULL | 注文数量 |
| unit_price | 数値 | NOT NULL | 単価 |
| total_price | 数値 | 計算フィールド | 数量 × 単価 |
| status | 列挙型 | NOT NULL | 明細生産ステータス |
| completion_rate | 数値 | DEFAULT 0 | 生産完了率 % |

#### 4. パイプ仕様テーブル

| フィールド名 | データ型 | 制約 | 説明 |
|------------|---------|------|------|
| spec_id | 文字列 | 主キー | 一意の仕様ID |
| material_type | 列挙型 | NOT NULL | 材料分類 |
| outer_diameter | 数値 | NOT NULL | 外径（mm） |
| wall_thickness | 数値 | NOT NULL | 肉厚（mm） |
| length | 数値 | NOT NULL | 長さ（mm） |
| grade | 文字列 | | 材料グレード |
| cutting_angle | 数値 | DEFAULT 90 | 切断角度（度） |
| tolerance_od | 数値 | DEFAULT 0.1 | 外径公差 ± mm |
| tolerance_length | 数値 | DEFAULT 1 | 長さ公差 ± mm |
| surface_treatment | 文字列 | | 表面処理タイプ |

#### 5. 生産ジョブテーブル

| フィールド名 | データ型 | 制約 | 説明 |
|------------|---------|------|------|
| job_id | 文字列 | 主キー | 一意のジョブ識別子 |
| item_id | 文字列 | 外部キー | 受注明細への参照 |
| machine_id | 文字列 | 外部キー | 割り当て機械 |
| operator_id | 文字列 | 外部キー | 割り当てオペレーター |
| start_time | 日時 | | ジョブ開始時刻 |
| end_time | 日時 | | ジョブ完了時刻 |
| setup_time | 数値 | | セットアップ時間（分） |
| run_time | 数値 | | 実行時間（分） |
| quantity_produced | 数値 | DEFAULT 0 | 生産数 |
| quantity_passed | 数値 | DEFAULT 0 | 品質合格数 |
| status | 列挙型 | NOT NULL | ジョブステータス |

#### 6. 品質検査テーブル

| フィールド名 | データ型 | 制約 | 説明 |
|------------|---------|------|------|
| check_id | 文字列 | 主キー | 一意の検査ID |
| job_id | 文字列 | 外部キー | 生産ジョブへの参照 |
| check_type | 列挙型 | NOT NULL | 品質検査タイプ |
| dimension_od | 数値 | | 測定外径 |
| dimension_length | 数値 | | 測定長さ |
| surface_quality | 列挙型 | | 表面品質評価 |
| result | 列挙型 | NOT NULL | 合格/不合格/再作業 |
| inspector_id | 文字列 | 外部キー | 品質検査員 |
| check_time | 日時 | NOT NULL | 検査時刻 |
| defect_codes | 配列 | | 不良コードリスト |
| notes | テキスト | | 検査メモ |

### インデックスとパフォーマンス最適化

```sql
-- プライマリインデックス（自動作成）
CREATE INDEX idx_orders_customer ON Orders(customer_id);
CREATE INDEX idx_order_items_order ON Order_Items(order_id);
CREATE INDEX idx_production_jobs_item ON Production_Jobs(item_id);
CREATE INDEX idx_quality_checks_job ON Quality_Checks(job_id);

-- パフォーマンスインデックス
CREATE INDEX idx_orders_status_date ON Orders(status, order_date);
CREATE INDEX idx_production_jobs_status ON Production_Jobs(status);
CREATE INDEX idx_materials_type_grade ON Materials(material_type, grade);
CREATE INDEX idx_quality_checks_result ON Quality_Checks(result);
```

### データ整合性ルール

1. **参照整合性**
   - すべての外部キーは既存のレコードを参照する必要があります
   - 顧客情報のカスケード更新
   - 依存関係のあるレコードの削除制限

2. **ビジネスルール**
   - 受注納期は受注日より後でなければなりません
   - 生産数量は注文数量を超えてはいけません
   - ステータスを「完了」に変更する前に品質検査を実施する必要があります

3. **検証ルール**
   - パイプ寸法は有効範囲内でなければなりません
   - 完了した操作の日付は未来であってはいけません
   - 数量値は正の値でなければなりません

---

## 🔗 Related Documentation / 関連ドキュメント

- [System Overview](SYSTEM_OVERVIEW.md) - System introduction
- [Features](FEATURES.md) - Complete feature list
- [API Reference](../03-TECHNICAL/API_REFERENCE.md) - API documentation

---

Last Updated: 2025-01-24