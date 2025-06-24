#!/usr/bin/env python3
"""
Test Genesis Agent - Lark Base System Creator (Mock Version)
Demonstrates the system structure without requiring OpenAI API
Version: 2.0 - Enhanced with Prompt Design Template
"""

import json
import os
import requests
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/test-genesis-agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TestGenesisAgent:
    def __init__(self, config_file: str = "config-larksuite-corrected.json"):
        self.load_config(config_file)
        self.access_token = None
        self.token_expires_at = None
        
    def load_config(self, config_file: str):
        """Load Lark configuration from file"""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                self.lark_config = {
                    "app_id": config.get("appId"),
                    "app_secret": config.get("appSecret"),
                    "domain": config.get("domain", "https://open.larksuite.com"),
                    "language": config.get("language", "en")
                }
                logger.info("✅ Lark configuration loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load config: {e}")
            raise
    
    def get_access_token(self, force_refresh: bool = False) -> Optional[str]:
        """Get Lark access token with caching and auto-refresh"""
        current_time = datetime.now()
        
        if (not force_refresh and self.access_token and self.token_expires_at and 
            current_time < self.token_expires_at - timedelta(minutes=5)):
            return self.access_token
            
        try:
            url = f"{self.lark_config['domain']}/open-apis/auth/v3/tenant_access_token/internal"
            payload = {
                "app_id": self.lark_config["app_id"],
                "app_secret": self.lark_config["app_secret"]
            }
            
            response = requests.post(url, json=payload, timeout=10)
            result = response.json()
            
            if result.get("code") == 0:
                self.access_token = result.get("tenant_access_token")
                expires_in = result.get("expire", 7200)
                self.token_expires_at = current_time + timedelta(seconds=expires_in)
                
                logger.info(f"✅ Access token obtained (expires in {expires_in}s)")
                return self.access_token
            else:
                logger.error(f"❌ Token error: {result}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Token request failed: {e}")
            return None
    
    def create_cms_system_design(self) -> Dict[str, Any]:
        """Create CMS system design (mock version)"""
        return {
            "name": "CMS - Content Management System",
            "description": "Complete content management system with blog posts, pages, media, categories, and analytics",
            "er_diagram": """
```mermaid
erDiagram
    CONTENT_ARTICLES ||--o{ CONTENT_ANALYTICS : "tracks"
    CONTENT_ARTICLES }o--|| CATEGORIES : "belongs_to"
    CONTENT_ARTICLES }o--o{ TAGS : "has"
    CONTENT_ARTICLES }o--|| USERS : "created_by"
    CONTENT_PAGES }o--|| USERS : "created_by"
    MEDIA_LIBRARY }o--|| USERS : "uploaded_by"
    PUBLISH_WORKFLOW }o--|| CONTENT_ARTICLES : "manages"
    PUBLISH_WORKFLOW }o--|| USERS : "reviewed_by"
    CATEGORIES }o--|| CATEGORIES : "parent_category"
```
            """,
            "tables": [
                {
                    "name": "コンテンツ記事",
                    "physical_name": "TBL_ContentArticles",
                    "fields": [
                        {"name": "記事ID", "physical_name": "FLD_articleId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "タイトル", "physical_name": "FLD_title", "type": "TEXT"},
                        {"name": "内容", "physical_name": "FLD_content", "type": "TEXT"},
                        {"name": "著者", "physical_name": "FLD_author", "type": "USER"},
                        {"name": "ステータス", "physical_name": "FLD_status", "type": "SINGLE_SELECT", "options": ["下書き", "レビュー中", "公開済み", "非公開"]},
                        {"name": "公開日", "physical_name": "FLD_publishDate", "type": "DATETIME"},
                        {"name": "SEOタイトル", "physical_name": "FLD_seoTitle", "type": "TEXT"},
                        {"name": "SEO説明", "physical_name": "FLD_seoDescription", "type": "TEXT"},
                        {"name": "カテゴリ", "physical_name": "FLD_category", "type": "LINK"},
                        {"name": "タグ", "physical_name": "FLD_tags", "type": "LINK"},
                        {"name": "閲覧数", "physical_name": "FLD_viewCount", "type": "NUMBER"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"},
                        {"name": "更新日", "physical_name": "FLD_updatedAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "コンテンツページ",
                    "physical_name": "TBL_ContentPages",
                    "fields": [
                        {"name": "ページID", "physical_name": "FLD_pageId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "タイトル", "physical_name": "FLD_title", "type": "TEXT"},
                        {"name": "スラッグ", "physical_name": "FLD_slug", "type": "TEXT"},
                        {"name": "内容", "physical_name": "FLD_content", "type": "TEXT"},
                        {"name": "テンプレート", "physical_name": "FLD_template", "type": "SINGLE_SELECT", "options": ["デフォルト", "ランディング", "ブログ", "カスタム"]},
                        {"name": "ステータス", "physical_name": "FLD_status", "type": "SINGLE_SELECT", "options": ["下書き", "公開済み", "非公開"]},
                        {"name": "作成者", "physical_name": "FLD_createdBy", "type": "USER"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"},
                        {"name": "更新日", "physical_name": "FLD_updatedAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "メディアライブラリ",
                    "physical_name": "TBL_MediaLibrary",
                    "fields": [
                        {"name": "メディアID", "physical_name": "FLD_mediaId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "ファイル名", "physical_name": "FLD_fileName", "type": "TEXT"},
                        {"name": "ファイルURL", "physical_name": "FLD_fileUrl", "type": "URL"},
                        {"name": "ファイルタイプ", "physical_name": "FLD_fileType", "type": "SINGLE_SELECT", "options": ["画像", "動画", "PDF", "ドキュメント", "その他"]},
                        {"name": "ファイルサイズ", "physical_name": "FLD_fileSize", "type": "NUMBER"},
                        {"name": "Alt属性", "physical_name": "FLD_altText", "type": "TEXT"},
                        {"name": "アップロード者", "physical_name": "FLD_uploadedBy", "type": "USER"},
                        {"name": "アップロード日", "physical_name": "FLD_uploadedAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "カテゴリ",
                    "physical_name": "TBL_Categories",
                    "fields": [
                        {"name": "カテゴリID", "physical_name": "FLD_categoryId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "説明", "physical_name": "FLD_description", "type": "TEXT"},
                        {"name": "親カテゴリ", "physical_name": "FLD_parentCategory", "type": "LINK"},
                        {"name": "スラッグ", "physical_name": "FLD_slug", "type": "TEXT"},
                        {"name": "記事数", "physical_name": "FLD_articleCount", "type": "FORMULA", "formula": "COUNT(関連記事)"}
                    ]
                },
                {
                    "name": "タグ",
                    "physical_name": "TBL_Tags",
                    "fields": [
                        {"name": "タグID", "physical_name": "FLD_tagId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "説明", "physical_name": "FLD_description", "type": "TEXT"},
                        {"name": "使用回数", "physical_name": "FLD_usageCount", "type": "FORMULA", "formula": "COUNT(関連記事)"}
                    ]
                },
                {
                    "name": "ユーザー",
                    "physical_name": "TBL_Users",
                    "fields": [
                        {"name": "ユーザーID", "physical_name": "FLD_userId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "メール", "physical_name": "FLD_email", "type": "TEXT"},
                        {"name": "役割", "physical_name": "FLD_role", "type": "SINGLE_SELECT", "options": ["管理者", "編集者", "投稿者", "閲覧者"]},
                        {"name": "権限", "physical_name": "FLD_permissions", "type": "MULTI_SELECT", "options": ["記事作成", "記事編集", "記事削除", "ユーザー管理", "システム設定"]},
                        {"name": "最終ログイン", "physical_name": "FLD_lastLogin", "type": "DATETIME"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "コンテンツ分析",
                    "physical_name": "TBL_ContentAnalytics",
                    "fields": [
                        {"name": "分析ID", "physical_name": "FLD_analyticsId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "コンテンツID", "physical_name": "FLD_contentId", "type": "LINK"},
                        {"name": "閲覧数", "physical_name": "FLD_viewCount", "type": "NUMBER"},
                        {"name": "シェア数", "physical_name": "FLD_shareCount", "type": "NUMBER"},
                        {"name": "エンゲージメントスコア", "physical_name": "FLD_engagementScore", "type": "FORMULA", "formula": "(閲覧数 * 0.5) + (シェア数 * 2)"},
                        {"name": "分析日", "physical_name": "FLD_analyticsDate", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "公開ワークフロー",
                    "physical_name": "TBL_PublishWorkflow",
                    "fields": [
                        {"name": "ワークフローID", "physical_name": "FLD_workflowId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "コンテンツID", "physical_name": "FLD_contentId", "type": "LINK"},
                        {"name": "ステータス", "physical_name": "FLD_status", "type": "SINGLE_SELECT", "options": ["レビュー待ち", "レビュー中", "承認済み", "却下", "公開済み"]},
                        {"name": "レビュアー", "physical_name": "FLD_reviewer", "type": "USER"},
                        {"name": "レビュー日", "physical_name": "FLD_reviewDate", "type": "DATETIME"},
                        {"name": "レビューコメント", "physical_name": "FLD_reviewComment", "type": "TEXT"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"}
                    ]
                }
            ],
            "formulas": [
                {
                    "table": "カテゴリ",
                    "field": "記事数",
                    "formula": "COUNT(関連記事)",
                    "description": "カテゴリに属する記事数を自動計算"
                },
                {
                    "table": "タグ",
                    "field": "使用回数",
                    "formula": "COUNT(関連記事)",
                    "description": "タグが使用されている記事数を自動計算"
                },
                {
                    "table": "コンテンツ分析",
                    "field": "エンゲージメントスコア",
                    "formula": "(閲覧数 * 0.5) + (シェア数 * 2)",
                    "description": "コンテンツのエンゲージメントスコアを自動計算"
                }
            ],
            "workflows": [
                {
                    "name": "新記事通知",
                    "trigger": "レコードが追加されたとき",
                    "condition": "テーブル = コンテンツ記事",
                    "action": "編集チームに通知を送る",
                    "description": "新しい記事が投稿されたら編集チームに通知"
                },
                {
                    "name": "公開リマインダー",
                    "trigger": "フィールドが更新されたとき",
                    "condition": "公開日が設定された",
                    "action": "著者にリマインド通知を送る",
                    "description": "記事の公開日が近づいたら著者にリマインド"
                }
            ]
        }
    
    def create_sfa_system_design(self) -> Dict[str, Any]:
        """Create SFA system design (mock version)"""
        return {
            "name": "SFA - Sales Force Automation",
            "description": "Complete sales force automation system with lead management, contacts, accounts, opportunities, and performance analytics",
            "er_diagram": """
```mermaid
erDiagram
    LEADS }o--|| CONTACTS : "converts_to"
    CONTACTS }o--|| ACCOUNTS : "belongs_to"
    ACCOUNTS ||--o{ OPPORTUNITIES : "has"
    OPPORTUNITIES }o--o{ SALES_ACTIVITIES : "includes"
    SALES_ACTIVITIES }o--|| CONTACTS : "with"
    SALES_PIPELINE }o--|| OPPORTUNITIES : "manages"
    SALES_METRICS }o--|| USERS : "for"
    TASKS }o--|| USERS : "assigned_to"
    TASKS }o--o{ OPPORTUNITIES : "related_to"
```
            """,
            "tables": [
                {
                    "name": "リード",
                    "physical_name": "TBL_Leads",
                    "fields": [
                        {"name": "リードID", "physical_name": "FLD_leadId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "メール", "physical_name": "FLD_email", "type": "TEXT"},
                        {"name": "電話", "physical_name": "FLD_phone", "type": "PHONE"},
                        {"name": "会社", "physical_name": "FLD_company", "type": "TEXT"},
                        {"name": "ソース", "physical_name": "FLD_source", "type": "SINGLE_SELECT", "options": ["ウェブサイト", "紹介", "イベント", "広告", "その他"]},
                        {"name": "ステータス", "physical_name": "FLD_status", "type": "SINGLE_SELECT", "options": ["新規", "連絡済み", "資格あり", "資格なし", "コンバート済み"]},
                        {"name": "担当者", "physical_name": "FLD_owner", "type": "USER"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"},
                        {"name": "更新日", "physical_name": "FLD_updatedAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "コンタクト",
                    "physical_name": "TBL_Contacts",
                    "fields": [
                        {"name": "コンタクトID", "physical_name": "FLD_contactId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "メール", "physical_name": "FLD_email", "type": "TEXT"},
                        {"name": "電話", "physical_name": "FLD_phone", "type": "PHONE"},
                        {"name": "会社", "physical_name": "FLD_company", "type": "LINK"},
                        {"name": "役職", "physical_name": "FLD_title", "type": "TEXT"},
                        {"name": "リードソース", "physical_name": "FLD_leadSource", "type": "SINGLE_SELECT", "options": ["ウェブサイト", "紹介", "イベント", "広告", "その他"]},
                        {"name": "担当者", "physical_name": "FLD_owner", "type": "USER"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"},
                        {"name": "更新日", "physical_name": "FLD_updatedAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "アカウント",
                    "physical_name": "TBL_Accounts",
                    "fields": [
                        {"name": "アカウントID", "physical_name": "FLD_accountId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "会社名", "physical_name": "FLD_companyName", "type": "TEXT"},
                        {"name": "業界", "physical_name": "FLD_industry", "type": "SINGLE_SELECT", "options": ["IT", "製造", "金融", "医療", "小売", "その他"]},
                        {"name": "規模", "physical_name": "FLD_size", "type": "SINGLE_SELECT", "options": ["1-10人", "11-50人", "51-200人", "201-1000人", "1000人以上"]},
                        {"name": "ウェブサイト", "physical_name": "FLD_website", "type": "URL"},
                        {"name": "住所", "physical_name": "FLD_address", "type": "TEXT"},
                        {"name": "担当者", "physical_name": "FLD_owner", "type": "USER"},
                        {"name": "オポチュニティ合計金額", "physical_name": "FLD_totalOpportunityAmount", "type": "FORMULA", "formula": "SUM(関連オポチュニティ.金額)"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"},
                        {"name": "更新日", "physical_name": "FLD_updatedAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "オポチュニティ",
                    "physical_name": "TBL_Opportunities",
                    "fields": [
                        {"name": "オポチュニティID", "physical_name": "FLD_opportunityId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "アカウント", "physical_name": "FLD_account", "type": "LINK"},
                        {"name": "金額", "physical_name": "FLD_amount", "type": "NUMBER"},
                        {"name": "ステージ", "physical_name": "FLD_stage", "type": "SINGLE_SELECT", "options": ["見込み", "提案", "商談", "クローズ", "失注"]},
                        {"name": "クローズ予定日", "physical_name": "FLD_closeDate", "type": "DATETIME"},
                        {"name": "確度", "physical_name": "FLD_probability", "type": "NUMBER"},
                        {"name": "担当者", "physical_name": "FLD_owner", "type": "USER"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"},
                        {"name": "更新日", "physical_name": "FLD_updatedAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "営業活動",
                    "physical_name": "TBL_SalesActivities",
                    "fields": [
                        {"name": "活動ID", "physical_name": "FLD_activityId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "タイプ", "physical_name": "FLD_type", "type": "SINGLE_SELECT", "options": ["電話", "メール", "会議", "デモ", "提案書", "その他"]},
                        {"name": "件名", "physical_name": "FLD_subject", "type": "TEXT"},
                        {"name": "コンタクト", "physical_name": "FLD_contact", "type": "LINK"},
                        {"name": "日付", "physical_name": "FLD_date", "type": "DATETIME"},
                        {"name": "結果", "physical_name": "FLD_result", "type": "TEXT"},
                        {"name": "メモ", "physical_name": "FLD_notes", "type": "TEXT"},
                        {"name": "担当者", "physical_name": "FLD_owner", "type": "USER"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "営業パイプライン",
                    "physical_name": "TBL_SalesPipeline",
                    "fields": [
                        {"name": "パイプラインID", "physical_name": "FLD_pipelineId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "ステージ名", "physical_name": "FLD_stageName", "type": "TEXT"},
                        {"name": "確度", "physical_name": "FLD_probability", "type": "NUMBER"},
                        {"name": "期待値", "physical_name": "FLD_expectedValue", "type": "NUMBER"},
                        {"name": "順序", "physical_name": "FLD_order", "type": "NUMBER"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "営業メトリクス",
                    "physical_name": "TBL_SalesMetrics",
                    "fields": [
                        {"name": "メトリクスID", "physical_name": "FLD_metricsId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "営業担当者", "physical_name": "FLD_salesRep", "type": "USER"},
                        {"name": "期間", "physical_name": "FLD_period", "type": "SINGLE_SELECT", "options": ["日次", "週次", "月次", "四半期", "年次"]},
                        {"name": "売上", "physical_name": "FLD_revenue", "type": "NUMBER"},
                        {"name": "成約数", "physical_name": "FLD_dealsClosed", "type": "NUMBER"},
                        {"name": "コンバージョン率", "physical_name": "FLD_conversionRate", "type": "FORMULA", "formula": "成約数 / 総オポチュニティ数 * 100"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "タスク",
                    "physical_name": "TBL_Tasks",
                    "fields": [
                        {"name": "タスクID", "physical_name": "FLD_taskId", "type": "AUTO_NUMBER", "notes": "(PK)"},
                        {"name": "件名", "physical_name": "FLD_subject", "type": "TEXT"},
                        {"name": "担当者", "physical_name": "FLD_assignedTo", "type": "USER"},
                        {"name": "期限", "physical_name": "FLD_dueDate", "type": "DATETIME"},
                        {"name": "優先度", "physical_name": "FLD_priority", "type": "SINGLE_SELECT", "options": ["低", "中", "高", "緊急"]},
                        {"name": "ステータス", "physical_name": "FLD_status", "type": "SINGLE_SELECT", "options": ["未着手", "進行中", "完了", "保留"]},
                        {"name": "関連先", "physical_name": "FLD_relatedTo", "type": "LINK"},
                        {"name": "説明", "physical_name": "FLD_description", "type": "TEXT"},
                        {"name": "作成日", "physical_name": "FLD_createdAt", "type": "DATETIME"},
                        {"name": "更新日", "physical_name": "FLD_updatedAt", "type": "DATETIME"}
                    ]
                }
            ],
            "formulas": [
                {
                    "table": "アカウント",
                    "field": "オポチュニティ合計金額",
                    "formula": "SUM(関連オポチュニティ.金額)",
                    "description": "アカウントに紐づくオポチュニティの合計金額を自動計算"
                },
                {
                    "table": "営業メトリクス",
                    "field": "コンバージョン率",
                    "formula": "成約数 / 総オポチュニティ数 * 100",
                    "description": "営業担当者のコンバージョン率を自動計算"
                }
            ],
            "workflows": [
                {
                    "name": "新リード通知",
                    "trigger": "レコードが追加されたとき",
                    "condition": "テーブル = リード",
                    "action": "営業担当者に通知を送る",
                    "description": "新しいリードが登録されたら営業担当者に通知"
                },
                {
                    "name": "クローズリマインダー",
                    "trigger": "フィールドが更新されたとき",
                    "condition": "クローズ予定日が設定された",
                    "action": "担当者にリマインド通知を送る",
                    "description": "オポチュニティのクローズ予定日が近づいたら担当者にリマインド"
                }
            ]
        }
    
    def generate_execution_plan(self, system_design: Dict[str, Any]) -> List[str]:
        """Generate execution plan for the system"""
        plan = []
        plan.append(f"# {system_design['name']} 作成計画")
        plan.append("")
        plan.append("## 1. Base アプリケーション作成")
        plan.append(f"bitable.v1.app.create --name '{system_design['name']}' --description '{system_design['description']}'")
        plan.append("")
        plan.append("## 2. テーブル作成")
        
        for table in system_design['tables']:
            plan.append(f"### {table['name']}")
            plan.append(f"bitable.v1.appTable.create --table_name '{table['physical_name']}'")
            plan.append("")
        
        plan.append("## 3. フィールド作成")
        for table in system_design['tables']:
            plan.append(f"### {table['name']}")
            for field in table['fields']:
                if field['type'] != 'FORMULA':  # Skip formula fields for now
                    plan.append(f"bitable.v1.appTableField.create --table_id <{table['physical_name']}_ID> --field_name '{field['physical_name']}' --type {self.get_field_type_code(field['type'])}")
            plan.append("")
        
        plan.append("## 4. リレーション設定")
        plan.append("# リンクフィールドの設定は手動で行う必要があります")
        plan.append("")
        
        plan.append("## 5. 数式設定")
        for formula in system_design['formulas']:
            plan.append(f"### {formula['table']} - {formula['field']}")
            plan.append(f"# 数式: {formula['formula']}")
            plan.append(f"# 説明: {formula['description']}")
            plan.append("")
        
        plan.append("## 6. ワークフロー設定")
        for workflow in system_design['workflows']:
            plan.append(f"### {workflow['name']}")
            plan.append(f"# トリガー: {workflow['trigger']}")
            plan.append(f"# 条件: {workflow['condition']}")
            plan.append(f"# アクション: {workflow['action']}")
            plan.append(f"# 説明: {workflow['description']}")
            plan.append("")
        
        return plan
    
    def get_field_type_code(self, field_type: str) -> int:
        """Get Lark Base field type code"""
        type_mapping = {
            "TEXT": 1,
            "NUMBER": 2,
            "SINGLE_SELECT": 3,
            "MULTI_SELECT": 4,
            "DATETIME": 5,
            "CHECKBOX": 7,
            "USER": 11,
            "PHONE": 13,
            "URL": 15,
            "ATTACHMENT": 17,
            "LINK": 18,
            "LOOKUP": 19,
            "ROLLUP": 20,
            "FORMULA": 21,
            "AUTO_NUMBER": 22
        }
        return type_mapping.get(field_type, 1)
    
    def create_claude_execution_prompt(self, system_design: Dict[str, Any]) -> str:
        """Generate Claude Desktop execution prompt"""
        execution_plan = self.generate_execution_plan(system_design)
        
        return f"""
Lark MCPツールを使用して、{system_design['name']}システムを実行してください。

システム仕様:
- このシステムは、AIが要求仕様から自動生成した設計図に基づいて作成されます
- 複数のテーブルとリレーション、数式、ワークフローを含む完全なシステムです

段階的に作成し、各ステップの成功を確認してから次に進んでください。
エラーが発生した場合は、シンプルな構成から開始して徐々に機能を追加してください。

使用するMCPツール:
- bitable.v1.app.create (Base作成)
- bitable.v1.appTable.create (テーブル作成)
- bitable.v1.appTableField.create (フィールド作成)
- bitable.v1.appTableRecord.create (データ作成)
- bitable.v1.appTableRecord.search (データ検索)

設計図:
{system_design['er_diagram']}

実行計画:
{chr(10).join(execution_plan)}
"""
    
    def create_cms_sfa_systems(self) -> Dict[str, Any]:
        """Create both CMS and SFA systems using mock approach"""
        logger.info("🚀 Creating CMS and SFA systems using Test Genesis Agent...")
        
        results = {}
        
        # Create CMS System
        logger.info("📝 Creating CMS System...")
        cms_design = self.create_cms_system_design()
        results["cms"] = {
            "status": "success",
            "design": cms_design,
            "execution_plan": self.generate_execution_plan(cms_design)
        }
        
        # Create SFA System
        logger.info("💼 Creating SFA System...")
        sfa_design = self.create_sfa_system_design()
        results["sfa"] = {
            "status": "success",
            "design": sfa_design,
            "execution_plan": self.generate_execution_plan(sfa_design)
        }
        
        return {
            "status": "success",
            "systems": results,
            "summary": {
                "cms_status": "success",
                "sfa_status": "success",
                "total_systems": 2
            }
        }

def main():
    # Initialize agent
    agent = TestGenesisAgent()
    
    print("🤖 Test Genesis Agent for Lark Base System Creation")
    print("=" * 60)
    
    # Create both systems
    result = agent.create_cms_sfa_systems()
    
    if result["status"] == "success":
        print("✅ Both systems designed successfully!")
        print()
        
        # Display CMS results
        if "cms" in result["systems"]:
            cms_result = result["systems"]["cms"]
            print("📝 CMS System Results:")
            print("-" * 30)
            print(f"Name: {cms_result['design']['name']}")
            print(f"Description: {cms_result['design']['description']}")
            print(f"Tables: {len(cms_result['design']['tables'])}")
            print(f"Formulas: {len(cms_result['design']['formulas'])}")
            print(f"Workflows: {len(cms_result['design']['workflows'])}")
            print()
            print("🚀 Execute CMS in Claude Desktop:")
            print("-" * 30)
            print(agent.create_claude_execution_prompt(cms_result['design']))
            print()
        
        # Display SFA results
        if "sfa" in result["systems"]:
            sfa_result = result["systems"]["sfa"]
            print("💼 SFA System Results:")
            print("-" * 30)
            print(f"Name: {sfa_result['design']['name']}")
            print(f"Description: {sfa_result['design']['description']}")
            print(f"Tables: {len(sfa_result['design']['tables'])}")
            print(f"Formulas: {len(sfa_result['design']['formulas'])}")
            print(f"Workflows: {len(sfa_result['design']['workflows'])}")
            print()
            print("🚀 Execute SFA in Claude Desktop:")
            print("-" * 30)
            print(agent.create_claude_execution_prompt(sfa_result['design']))
            print()
        
        # Display summary
        summary = result["summary"]
        print("📊 Summary:")
        print(f"   CMS Status: {summary['cms_status']}")
        print(f"   SFA Status: {summary['sfa_status']}")
        print(f"   Total Systems: {summary['total_systems']}")
        
    else:
        print(f"❌ Error: {result.get('message', 'Unknown error')}")

if __name__ == "__main__":
    main() 