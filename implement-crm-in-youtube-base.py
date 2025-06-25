#!/usr/bin/env python3
"""
Implementation script to add CRM tables to existing YouTube Base
Target Base: BI4RbpcKxaR7C2sLq9GjXJUjp2b
"""

import json
import requests
import time
from typing import Dict, List, Any, Optional
from datetime import datetime

class YouTubeCRMIntegration:
    def __init__(self):
        # Load configuration
        with open('config.json', 'r') as f:
            config = json.load(f)
        
        self.lark_config = {
            "app_id": config["appId"],
            "app_secret": config["appSecret"],
            "domain": config["domain"],
            "existing_base_token": "BI4RbpcKxaR7C2sLq9GjXJUjp2b"  # Your YouTube Base
        }
        self.access_token = None
        self.created_tables = {}
        
    def get_access_token(self) -> Optional[str]:
        """Get Lark access token"""
        try:
            url = f"{self.lark_config['domain']}/open-apis/auth/v3/tenant_access_token/internal"
            payload = {
                "app_id": self.lark_config["app_id"],
                "app_secret": self.lark_config["app_secret"]
            }
            
            response = requests.post(url, json=payload)
            result = response.json()
            
            if result.get("code") == 0:
                self.access_token = result.get("tenant_access_token")
                print(f"✅ 認証成功")
                return self.access_token
            else:
                print(f"❌ 認証エラー: {result}")
                return None
                
        except Exception as e:
            print(f"❌ トークン取得失敗: {e}")
            return None
    
    def create_table(self, table_name: str, fields: List[Dict]) -> Optional[str]:
        """Create a table in the existing Base"""
        try:
            app_token = self.lark_config['existing_base_token']
            url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps/{app_token}/tables"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            # Prepare fields for API
            api_fields = []
            for field in fields:
                field_config = {
                    "field_name": field["name"],
                    "type": field["type"]
                }
                
                # Add UI type if specified
                if "ui_type" in field:
                    field_config["ui_type"] = field["ui_type"]
                
                # Add options for single select
                if field.get("ui_type") == "SingleSelect" and "options" in field:
                    field_config["property"] = {
                        "options": [{"name": opt, "color": idx} for idx, opt in enumerate(field["options"])]
                    }
                
                # Add currency format for number fields
                if field.get("ui_type") == "Currency":
                    field_config["property"] = {
                        "formatter": "¥#,##0"  # Japanese Yen format
                    }
                    
                api_fields.append(field_config)
            
            payload = {
                "table": {
                    "name": table_name,
                    "default_view_name": f"{table_name}ビュー",
                    "fields": api_fields
                }
            }
            
            response = requests.post(url, headers=headers, json=payload)
            result = response.json()
            
            if result.get("code") == 0:
                table_id = result["data"]["table_id"]
                print(f"✅ テーブル作成完了: {table_name} (ID: {table_id})")
                return table_id
            else:
                print(f"❌ テーブル作成失敗 {table_name}: {result}")
                return None
                
        except Exception as e:
            print(f"❌ テーブル作成エラー {table_name}: {e}")
            return None
    
    def create_crm_tables(self) -> Dict[str, Any]:
        """Create all CRM tables in the YouTube Base"""
        print("🚀 YouTube Base に CRM テーブルを追加開始...")
        print(f"対象Base: {self.lark_config['existing_base_token']}")
        print("=" * 60)
        
        # Get access token
        if not self.get_access_token():
            return {"status": "error", "message": "認証失敗"}
        
        # Table 1: 営業パイプライン管理 (Sales Pipeline)
        print("\n📊 営業パイプライン管理テーブルを作成中...")
        pipeline_fields = [
            {"name": "案件ID", "type": 1005, "ui_type": "AutoNumber"},  # Auto number
            {"name": "案件名", "type": 1, "ui_type": "Text"},
            {"name": "営業段階", "type": 3, "ui_type": "SingleSelect", 
             "options": ["見込み", "商談", "提案", "成約", "完了", "失注"]},
            {"name": "予想売上金額", "type": 2, "ui_type": "Currency"},
            {"name": "確度", "type": 2, "ui_type": "Number"},  # Percentage
            {"name": "担当者", "type": 11, "ui_type": "User"},
            {"name": "商談予定日", "type": 5, "ui_type": "DateTime"},
            {"name": "備考", "type": 1, "ui_type": "Text"}
        ]
        
        pipeline_id = self.create_table("営業パイプライン管理", pipeline_fields)
        if pipeline_id:
            self.created_tables["営業パイプライン管理"] = pipeline_id
        
        # Table 2: 顧客管理 (Customer Management)
        print("\n👥 顧客管理テーブルを作成中...")
        customer_fields = [
            {"name": "顧客ID", "type": 1005, "ui_type": "AutoNumber"},
            {"name": "会社名", "type": 1, "ui_type": "Text"},
            {"name": "担当者名", "type": 1, "ui_type": "Text"},
            {"name": "電話番号", "type": 13, "ui_type": "Phone"},
            {"name": "メールアドレス", "type": 1, "ui_type": "Text"},  # Email type
            {"name": "業界", "type": 3, "ui_type": "SingleSelect",
             "options": ["IT・通信", "製造業", "小売・EC", "金融・保険", "その他"]},
            {"name": "顧客ステータス", "type": 3, "ui_type": "SingleSelect",
             "options": ["見込み客", "既存客", "VIP客", "休眠客"]},
            {"name": "最終接触日", "type": 5, "ui_type": "DateTime"},
            {"name": "担当営業", "type": 11, "ui_type": "User"},
            {"name": "備考", "type": 1, "ui_type": "Text"}
        ]
        
        customer_id = self.create_table("顧客管理", customer_fields)
        if customer_id:
            self.created_tables["顧客管理"] = customer_id
        
        # Table 3: 活動履歴 (Activity History)
        print("\n📝 活動履歴テーブルを作成中...")
        activity_fields = [
            {"name": "活動ID", "type": 1005, "ui_type": "AutoNumber"},
            {"name": "活動タイプ", "type": 3, "ui_type": "SingleSelect",
             "options": ["電話", "メール", "商談", "プレゼン", "訪問", "その他"]},
            {"name": "実施日", "type": 5, "ui_type": "DateTime"},
            {"name": "担当者", "type": 11, "ui_type": "User"},
            {"name": "活動内容", "type": 1, "ui_type": "Text"},
            {"name": "次回予定日", "type": 5, "ui_type": "DateTime"},
            {"name": "ステータス", "type": 3, "ui_type": "SingleSelect",
             "options": ["完了", "予定", "キャンセル"]},
            {"name": "重要度", "type": 3, "ui_type": "SingleSelect",
             "options": ["高", "中", "低"]}
        ]
        
        activity_id = self.create_table("活動履歴", activity_fields)
        if activity_id:
            self.created_tables["活動履歴"] = activity_id
        
        # Table 4: 営業目標・実績 (Sales Targets)
        print("\n🎯 営業目標・実績テーブルを作成中...")
        targets_fields = [
            {"name": "レコードID", "type": 1005, "ui_type": "AutoNumber"},
            {"name": "対象年月", "type": 5, "ui_type": "DateTime"},
            {"name": "担当者", "type": 11, "ui_type": "User"},
            {"name": "月次売上目標", "type": 2, "ui_type": "Currency"},
            {"name": "実績売上", "type": 2, "ui_type": "Currency"},
            {"name": "新規顧客数目標", "type": 2, "ui_type": "Number"},
            {"name": "新規顧客数実績", "type": 2, "ui_type": "Number"},
            {"name": "備考", "type": 1, "ui_type": "Text"}
        ]
        
        targets_id = self.create_table("営業目標・実績", targets_fields)
        if targets_id:
            self.created_tables["営業目標・実績"] = targets_id
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 CRM テーブル作成結果:")
        print(f"Base App Token: {self.lark_config['existing_base_token']}")
        
        for table_name, table_id in self.created_tables.items():
            print(f"✅ {table_name}: {table_id}")
        
        base_url = f"https://f82jyx0mblu.jp.larksuite.com/base/{self.lark_config['existing_base_token']}"
        print(f"\n🔗 Base URL: {base_url}")
        
        return {
            "status": "success",
            "app_token": self.lark_config['existing_base_token'],
            "tables": self.created_tables,
            "base_url": base_url,
            "message": f"{len(self.created_tables)} テーブルを正常に作成しました"
        }
    
    def add_sample_data(self):
        """Add sample data to demonstrate the system"""
        try:
            app_token = self.lark_config['existing_base_token']
            
            # Add sample customer
            if "顧客管理" in self.created_tables:
                self.add_record(app_token, self.created_tables["顧客管理"], {
                    "会社名": "株式会社サンプル",
                    "担当者名": "山田太郎",
                    "業界": "IT・通信",
                    "顧客ステータス": "見込み客"
                })
            
            # Add sample pipeline
            if "営業パイプライン管理" in self.created_tables:
                self.add_record(app_token, self.created_tables["営業パイプライン管理"], {
                    "案件名": "YouTube動画活用提案",
                    "営業段階": "商談",
                    "予想売上金額": 500000,
                    "確度": 70
                })
            
            print("✅ サンプルデータを追加しました")
            
        except Exception as e:
            print(f"⚠️ サンプルデータ追加エラー: {e}")
    
    def add_record(self, app_token: str, table_id: str, fields: Dict[str, Any]):
        """Add a record to a table"""
        try:
            url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "fields": fields
            }
            
            response = requests.post(url, headers=headers, json=payload)
            result = response.json()
            
            if result.get("code") == 0:
                return True
            else:
                print(f"⚠️ レコード追加エラー: {result}")
                return False
                
        except Exception as e:
            print(f"⚠️ レコード追加例外: {e}")
            return False

def main():
    print("🎯 YouTube Base CRM 統合システム実装")
    print("=" * 60)
    
    integrator = YouTubeCRMIntegration()
    
    # Create CRM tables
    result = integrator.create_crm_tables()
    
    if result["status"] == "success":
        print("\n🎉 CRM テーブルの作成に成功しました！")
        print(f"🔗 Baseにアクセス: {result['base_url']}")
        
        # Add sample data
        print("\n📝 サンプルデータを追加中...")
        integrator.add_sample_data()
        
        print("\n✨ YouTube CRM 統合システムの準備が完了しました！")
        print("\n🚀 次のステップ:")
        print("1. テーブル間のリレーションを設定")
        print("2. 計算フィールドとロールアップを追加")
        print("3. ビューとダッシュボードを作成")
        print("4. 自動化ルールを設定")
        
    else:
        print(f"❌ 作成失敗: {result['message']}")

if __name__ == "__main__":
    main()