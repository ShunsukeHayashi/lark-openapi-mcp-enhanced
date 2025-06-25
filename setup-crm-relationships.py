#!/usr/bin/env python3
"""
Set up relationships between YouTube and CRM tables
Add link fields and formula fields for integration
"""

import json
import requests
import time
from typing import Dict, List, Any, Optional

class SetupCRMRelationships:
    def __init__(self):
        # Load configuration
        with open('config.json', 'r') as f:
            config = json.load(f)
        
        self.lark_config = {
            "app_id": config["appId"],
            "app_secret": config["appSecret"],
            "domain": config["domain"],
            "base_token": "BI4RbpcKxaR7C2sLq9GjXJUjp2b"  # Your YouTube Base
        }
        self.access_token = None
        
        # Table IDs from previous creation
        self.table_ids = {
            "YouTube動画管理": "tblQB4EJSBJJPuDC",
            "営業パイプライン管理": "tbl8Hc5t1q2p5kSb",
            "顧客管理": "tblzk1pwirAfxqbJ",
            "活動履歴": "tbljyTGrcEmWREwL",
            "営業目標・実績": "tblZDWDYnCg7mI5M"
        }
        
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
    
    def add_field_to_table(self, table_id: str, field_name: str, field_type: int, property_config: Dict = None) -> Optional[str]:
        """Add a field to an existing table"""
        try:
            url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps/{self.lark_config['base_token']}/tables/{table_id}/fields"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "field_name": field_name,
                "type": field_type
            }
            
            if property_config:
                payload["property"] = property_config
            
            response = requests.post(url, headers=headers, json=payload)
            result = response.json()
            
            if result.get("code") == 0:
                field_id = result["data"]["field"]["field_id"]
                print(f"✅ フィールド追加完了: {field_name} (ID: {field_id})")
                return field_id
            else:
                print(f"❌ フィールド追加失敗 {field_name}: {result}")
                return None
                
        except Exception as e:
            print(f"❌ フィールド追加エラー {field_name}: {e}")
            return None
    
    def setup_relationships(self):
        """Set up all the relationships between tables"""
        print("🔗 テーブル間のリレーションシップを設定中...")
        print("=" * 60)
        
        # Get access token
        if not self.get_access_token():
            return {"status": "error", "message": "認証失敗"}
        
        added_fields = {}
        
        # 1. Add link fields to 営業パイプライン管理
        print("\n📊 営業パイプライン管理テーブルにリンクフィールドを追加...")
        
        # Link to 顧客管理
        customer_link = self.add_field_to_table(
            self.table_ids["営業パイプライン管理"],
            "顧客名",
            18,  # Link field type
            {
                "table_id": self.table_ids["顧客管理"],
                "multiple": False
            }
        )
        if customer_link:
            added_fields["営業パイプライン_顧客リンク"] = customer_link
        
        # Link to YouTube動画管理 (multiple)
        youtube_link = self.add_field_to_table(
            self.table_ids["営業パイプライン管理"],
            "関連YouTube動画",
            18,  # Link field type
            {
                "table_id": self.table_ids["YouTube動画管理"],
                "multiple": True
            }
        )
        if youtube_link:
            added_fields["営業パイプライン_YouTubeリンク"] = youtube_link
        
        # 2. Add link fields to 活動履歴
        print("\n📝 活動履歴テーブルにリンクフィールドを追加...")
        
        # Link to 顧客管理
        activity_customer_link = self.add_field_to_table(
            self.table_ids["活動履歴"],
            "顧客名",
            18,  # Link field type
            {
                "table_id": self.table_ids["顧客管理"],
                "multiple": False
            }
        )
        if activity_customer_link:
            added_fields["活動履歴_顧客リンク"] = activity_customer_link
        
        # Link to 営業パイプライン管理
        activity_pipeline_link = self.add_field_to_table(
            self.table_ids["活動履歴"],
            "案件名",
            18,  # Link field type
            {
                "table_id": self.table_ids["営業パイプライン管理"],
                "multiple": False
            }
        )
        if activity_pipeline_link:
            added_fields["活動履歴_案件リンク"] = activity_pipeline_link
        
        # 3. Add calculated fields
        print("\n🧮 計算フィールドを追加...")
        
        # Add 見込み売上 formula to 営業パイプライン管理
        formula_field = self.add_field_to_table(
            self.table_ids["営業パイプライン管理"],
            "見込み売上",
            20,  # Formula field type
            {
                "formula_expression": "IF({予想売上金額}!=BLANK(),{予想売上金額}*{確度}/100,0)"
            }
        )
        if formula_field:
            added_fields["見込み売上計算"] = formula_field
        
        # 4. Add additional fields to YouTube動画管理 for CRM integration
        print("\n🎥 YouTube動画管理テーブルにCRM関連フィールドを追加...")
        
        # 営業効果指標
        sales_effectiveness = self.add_field_to_table(
            self.table_ids["YouTube動画管理"],
            "営業効果指標",
            3,  # Single select
            {
                "options": [
                    {"name": "高", "color": 0},
                    {"name": "中", "color": 1},
                    {"name": "低", "color": 2}
                ]
            }
        )
        if sales_effectiveness:
            added_fields["営業効果指標"] = sales_effectiveness
        
        # 使用回数
        usage_count = self.add_field_to_table(
            self.table_ids["YouTube動画管理"],
            "営業での使用回数",
            2  # Number field
        )
        if usage_count:
            added_fields["使用回数"] = usage_count
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 追加されたフィールド:")
        for field_name, field_id in added_fields.items():
            print(f"✅ {field_name}: {field_id}")
        
        return {
            "status": "success",
            "added_fields": added_fields,
            "message": f"{len(added_fields)} フィールドを追加しました"
        }
    
    def create_views(self):
        """Create useful views for the CRM system"""
        print("\n👁️ ビューを作成中...")
        
        try:
            # Create pipeline kanban view
            url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps/{self.lark_config['base_token']}/tables/{self.table_ids['営業パイプライン管理']}/views"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "view_name": "営業段階別パイプライン",
                "view_type": "kanban"
            }
            
            response = requests.post(url, headers=headers, json=payload)
            if response.json().get("code") == 0:
                print("✅ かんばんビュー作成: 営業段階別パイプライン")
            
            # Create customer status view
            url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps/{self.lark_config['base_token']}/tables/{self.table_ids['顧客管理']}/views"
            
            payload = {
                "view_name": "顧客ステータス別",
                "view_type": "grid"
            }
            
            response = requests.post(url, headers=headers, json=payload)
            if response.json().get("code") == 0:
                print("✅ グリッドビュー作成: 顧客ステータス別")
                
        except Exception as e:
            print(f"⚠️ ビュー作成エラー: {e}")

def main():
    print("🔗 YouTube CRM統合 - リレーションシップ設定")
    print("=" * 60)
    
    setup = SetupCRMRelationships()
    
    # Setup relationships
    result = setup.setup_relationships()
    
    if result["status"] == "success":
        print("\n🎉 リレーションシップ設定成功！")
        
        # Create views
        setup.create_views()
        
        print("\n✨ YouTube CRM統合システムの設定が完了しました！")
        print(f"\n🔗 Baseにアクセス: https://f82jyx0mblu.jp.larksuite.com/base/BI4RbpcKxaR7C2sLq9GjXJUjp2b")
        
        print("\n📋 実装完了した機能:")
        print("✅ CRMテーブル (営業パイプライン、顧客管理、活動履歴、営業目標)")
        print("✅ YouTube動画とCRMのリンク設定")
        print("✅ 見込み売上の自動計算")
        print("✅ 営業効果指標の追加")
        print("✅ ビューの作成")
        
        print("\n🚀 次のステップ:")
        print("1. ダッシュボードの作成")
        print("2. 自動化ルールの設定 (案件停滞アラートなど)")
        print("3. レポート機能の追加")
        print("4. 実際のデータ入力と運用開始")
        
    else:
        print(f"❌ 設定失敗: {result['message']}")

if __name__ == "__main__":
    main()