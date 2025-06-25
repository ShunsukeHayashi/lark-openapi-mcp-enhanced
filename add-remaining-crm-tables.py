#!/usr/bin/env python3
"""
Add remaining CRM tables to YouTube Base with simpler field types
"""

import json
import requests
import time
from typing import Dict, List, Any, Optional

class AddRemainingTables:
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
        """Create a table with simplified field types"""
        try:
            app_token = self.lark_config['existing_base_token']
            url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps/{app_token}/tables"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            
            # Prepare fields for API with basic types
            api_fields = []
            for field in fields:
                field_config = {
                    "field_name": field["name"],
                    "type": field["type"]
                }
                
                # Add options for single select fields
                if field["type"] == 3 and "options" in field:
                    field_config["property"] = {
                        "options": [{"name": opt} for opt in field["options"]]
                    }
                    
                api_fields.append(field_config)
            
            payload = {
                "table": {
                    "name": table_name,
                    "default_view_name": f"{table_name}ビュー",
                    "fields": api_fields
                }
            }
            
            print(f"Creating table with payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
            
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
    
    def add_remaining_tables(self):
        """Add the remaining CRM tables"""
        print("🚀 残りのCRMテーブルを追加中...")
        print("=" * 60)
        
        # Get access token
        if not self.get_access_token():
            return {"status": "error", "message": "認証失敗"}
        
        # Table 1: 営業パイプライン管理 (Sales Pipeline) - Simplified
        print("\n📊 営業パイプライン管理テーブルを作成中...")
        pipeline_fields = [
            {"name": "案件名", "type": 1},  # Text
            {"name": "営業段階", "type": 3,  # Single Select
             "options": ["見込み", "商談", "提案", "成約", "完了", "失注"]},
            {"name": "予想売上金額", "type": 2},  # Number
            {"name": "確度", "type": 2},  # Number (percentage)
            {"name": "担当者", "type": 11},  # User
            {"name": "商談予定日", "type": 5},  # DateTime
            {"name": "備考", "type": 1}  # Text
        ]
        
        pipeline_id = self.create_table("営業パイプライン管理", pipeline_fields)
        if pipeline_id:
            self.created_tables["営業パイプライン管理"] = pipeline_id
        
        # Table 2: 営業目標・実績 (Sales Targets) - Simplified
        print("\n🎯 営業目標・実績テーブルを作成中...")
        targets_fields = [
            {"name": "対象年月", "type": 5},  # DateTime
            {"name": "担当者", "type": 11},  # User
            {"name": "月次売上目標", "type": 2},  # Number
            {"name": "実績売上", "type": 2},  # Number
            {"name": "新規顧客数目標", "type": 2},  # Number
            {"name": "新規顧客数実績", "type": 2},  # Number
            {"name": "備考", "type": 1}  # Text
        ]
        
        targets_id = self.create_table("営業目標・実績", targets_fields)
        if targets_id:
            self.created_tables["営業目標・実績"] = targets_id
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 追加されたCRMテーブル:")
        for table_name, table_id in self.created_tables.items():
            print(f"✅ {table_name}: {table_id}")
        
        return {
            "status": "success",
            "tables": self.created_tables,
            "message": f"{len(self.created_tables)} テーブルを追加しました"
        }
    
    def add_sample_pipeline_data(self):
        """Add sample data to the pipeline table"""
        try:
            app_token = self.lark_config['existing_base_token']
            
            if "営業パイプライン管理" in self.created_tables:
                url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps/{app_token}/tables/{self.created_tables['営業パイプライン管理']}/records"
                headers = {
                    "Authorization": f"Bearer {self.access_token}",
                    "Content-Type": "application/json"
                }
                
                sample_records = [
                    {
                        "fields": {
                            "案件名": "YouTube動画活用提案",
                            "営業段階": "商談",
                            "予想売上金額": 500000,
                            "確度": 70,
                            "備考": "動画コンテンツを活用した営業提案"
                        }
                    },
                    {
                        "fields": {
                            "案件名": "動画マーケティング支援",
                            "営業段階": "提案",
                            "予想売上金額": 800000,
                            "確度": 85,
                            "備考": "YouTubeチャンネル運用支援"
                        }
                    }
                ]
                
                for record in sample_records:
                    response = requests.post(url, headers=headers, json=record)
                    if response.json().get("code") == 0:
                        print(f"✅ サンプルデータ追加: {record['fields']['案件名']}")
                
        except Exception as e:
            print(f"⚠️ サンプルデータ追加エラー: {e}")

def main():
    print("🎯 残りのCRMテーブルを追加")
    print("=" * 60)
    
    adder = AddRemainingTables()
    
    # Add remaining tables
    result = adder.add_remaining_tables()
    
    if result["status"] == "success":
        print("\n🎉 テーブル追加成功！")
        
        # Add sample data
        print("\n📝 サンプルデータを追加中...")
        adder.add_sample_pipeline_data()
        
        print("\n✨ CRMテーブルの追加が完了しました！")
        print(f"\n🔗 Baseにアクセス: https://f82jyx0mblu.jp.larksuite.com/base/BI4RbpcKxaR7C2sLq9GjXJUjp2b")
        
    else:
        print(f"❌ 追加失敗: {result['message']}")

if __name__ == "__main__":
    main()