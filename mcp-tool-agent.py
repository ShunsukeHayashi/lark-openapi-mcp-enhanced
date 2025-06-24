#!/usr/bin/env python3
"""
MCP Tool Use Agent - Direct Integration with Lark MCP Tools
Creates CRM system by directly calling MCP functions
"""

import json
import subprocess
import time
import os
import requests
from typing import Dict, List, Any, Optional

class MCPToolAgent:
    def __init__(self):
        self.lark_config = {
            "app_id": "cli_a8d2e0082978902e",
            "app_secret": "SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz",
            "domain": "https://open.feishu.cn"
        }
        self.access_token = None
        
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
                print(f"✅ Access token obtained: {self.access_token[:20]}...")
                return self.access_token
            else:
                print(f"❌ Token error: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Token request failed: {e}")
            return None
    
    def create_base_app(self, name: str, description: str = "") -> Optional[str]:
        """Create a new Base application"""
        if not self.access_token:
            self.get_access_token()
            
        try:
            url = f"{self.lark_config['domain']}/open-apis/bitable/v1/apps"
            headers = {
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "name": name,
                "description": description
            }
            
            response = requests.post(url, headers=headers, json=payload)
            result = response.json()
            
            if result.get("code") == 0:
                app_token = result["data"]["app"]["app_token"]
                print(f"✅ Base created: {name} (Token: {app_token})")
                return app_token
            else:
                print(f"❌ Base creation failed: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Base creation error: {e}")
            return None
    
    def create_table(self, app_token: str, table_name: str, fields: List[Dict]) -> Optional[str]:
        """Create a table in Base application"""
        try:
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
                    "type": self.convert_field_type(field["type"])
                }
                
                # Add options for single select
                if field["type"] == "single_select" and "options" in field:
                    field_config["property"] = {
                        "options": [{"name": opt} for opt in field["options"]]
                    }
                    
                api_fields.append(field_config)
            
            payload = {
                "table": {
                    "name": table_name,
                    "default_view_name": f"{table_name} View",
                    "fields": api_fields
                }
            }
            
            response = requests.post(url, headers=headers, json=payload)
            result = response.json()
            
            if result.get("code") == 0:
                table_id = result["data"]["table_id"]
                print(f"✅ Table created: {table_name} (ID: {table_id})")
                return table_id
            else:
                print(f"❌ Table creation failed for {table_name}: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Table creation error for {table_name}: {e}")
            return None
    
    def convert_field_type(self, field_type: str) -> int:
        """Convert field type to Lark API type code"""
        type_mapping = {
            "text": 1,
            "number": 2,
            "single_select": 3,
            "multi_select": 4,
            "datetime": 5,
            "checkbox": 7,
            "user": 11,
            "phone": 13,
            "url": 15,
            "attachment": 17,
            "link": 18,
            "lookup": 19,
            "rollup": 20,
            "formula": 21,
            "auto_number": 22
        }
        return type_mapping.get(field_type, 1)  # Default to text
    
    def create_crm_system(self) -> Dict[str, Any]:
        """Create complete TeachableCRM-Integration system"""
        print("🚀 Starting MCP Tool Agent CRM Creation...")
        print("=" * 50)
        
        # Step 1: Get access token
        if not self.get_access_token():
            return {"status": "error", "message": "Authentication failed"}
        
        # Step 2: Create Base application
        app_token = self.create_base_app(
            "TeachableCRM-Integration",
            "AI-generated CRM system for Teachable product management and VIP membership"
        )
        
        if not app_token:
            return {"status": "error", "message": "Base creation failed"}
        
        # Step 3: Create tables
        tables_created = {}
        
        # Products table
        products_fields = [
            {"name": "プロダクト名", "type": "text"},
            {"name": "プロダクトタイプ", "type": "single_select", "options": ["Course", "Coaching", "Digital Download", "Community", "Bundle"]},
            {"name": "価格", "type": "number"},
            {"name": "説明", "type": "text"},
            {"name": "作成日", "type": "datetime"},
            {"name": "販売ステータス", "type": "single_select", "options": ["Published", "Unpublished", "Unlisted"]}
        ]
        
        products_table_id = self.create_table(app_token, "Products", products_fields)
        if products_table_id:
            tables_created["Products"] = products_table_id
        
        # Customers table
        customers_fields = [
            {"name": "氏名", "type": "text"},
            {"name": "メールアドレス", "type": "text"}
        ]
        
        customers_table_id = self.create_table(app_token, "Customers", customers_fields)
        if customers_table_id:
            tables_created["Customers"] = customers_table_id
        
        # Membership_Tiers table
        tiers_fields = [
            {"name": "プラン名", "type": "text"},
            {"name": "月額料金", "type": "number"},
            {"name": "年額料金", "type": "number"},
            {"name": "説明", "type": "text"}
        ]
        
        tiers_table_id = self.create_table(app_token, "Membership_Tiers", tiers_fields)
        if tiers_table_id:
            tables_created["Membership_Tiers"] = tiers_table_id
        
        # Subscriptions_Sales table
        sales_fields = [
            {"name": "記録ID", "type": "auto_number"},
            {"name": "購入日", "type": "datetime"},
            {"name": "種別", "type": "single_select", "options": ["単体購入", "サブスクリプション"]},
            {"name": "購入金額", "type": "number"}
        ]
        
        sales_table_id = self.create_table(app_token, "Subscriptions_Sales", sales_fields)
        if sales_table_id:
            tables_created["Subscriptions_Sales"] = sales_table_id
        
        # Bundle_Items table
        bundle_fields = [
            {"name": "構成ID", "type": "auto_number"}
        ]
        
        bundle_table_id = self.create_table(app_token, "Bundle_Items", bundle_fields)
        if bundle_table_id:
            tables_created["Bundle_Items"] = bundle_table_id
        
        # Tier_Perks table
        perks_fields = [
            {"name": "特典ID", "type": "auto_number"}
        ]
        
        perks_table_id = self.create_table(app_token, "Tier_Perks", perks_fields)
        if perks_table_id:
            tables_created["Tier_Perks"] = perks_table_id
        
        print("\n📊 CRM System Creation Summary:")
        print(f"Base App Token: {app_token}")
        for table_name, table_id in tables_created.items():
            print(f"✅ {table_name}: {table_id}")
        
        # Generate Base URL
        base_url = f"https://feishu.cn/base/{app_token}"
        print(f"\n🔗 Base URL: {base_url}")
        
        return {
            "status": "success",
            "app_token": app_token,
            "tables": tables_created,
            "base_url": base_url,
            "message": f"Created {len(tables_created)} tables successfully"
        }
    
    def add_sample_data(self, app_token: str, tables: Dict[str, str]):
        """Add sample VIP data to the system"""
        try:
            # Add VIP membership tier
            if "Membership_Tiers" in tables:
                self.add_record(app_token, tables["Membership_Tiers"], {
                    "プラン名": "VIP",
                    "月額料金": 55000,
                    "年額料金": 600000,
                    "説明": "Premium membership with full access"
                })
            
            # Add sample products
            if "Products" in tables:
                sample_products = [
                    {"プロダクト名": "Advanced Course", "プロダクトタイプ": "Course", "価格": 29800, "販売ステータス": "Published"},
                    {"プロダクト名": "1-on-1 Coaching", "プロダクトタイプ": "Coaching", "価格": 98000, "販売ステータス": "Published"},
                    {"プロダクト名": "Premium Bundle", "プロダクトタイプ": "Bundle", "価格": 150000, "販売ステータス": "Published"}
                ]
                
                for product in sample_products:
                    self.add_record(app_token, tables["Products"], product)
            
            print("✅ Sample data added successfully")
            
        except Exception as e:
            print(f"❌ Sample data error: {e}")
    
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
                print(f"✅ Record added to table {table_id}")
                return True
            else:
                print(f"❌ Record addition failed: {result}")
                return False
                
        except Exception as e:
            print(f"❌ Record addition error: {e}")
            return False

def main():
    print("🤖 MCP Tool Use Agent for Lark CRM Creation")
    print("=" * 50)
    
    agent = MCPToolAgent()
    
    # Create CRM system
    result = agent.create_crm_system()
    
    if result["status"] == "success":
        print("\n🎉 CRM System Created Successfully!")
        print(f"🔗 Access your Base: {result['base_url']}")
        
        # Add sample data
        print("\n📝 Adding sample data...")
        agent.add_sample_data(result["app_token"], result["tables"])
        
        print("\n✨ TeachableCRM-Integration is ready!")
        print("🚀 You can now manage products, customers, and VIP memberships!")
        
    else:
        print(f"❌ Creation failed: {result['message']}")
        print("🔄 Try using Claude Desktop MCP tools as fallback")

if __name__ == "__main__":
    main()