#!/usr/bin/env python3
"""
Script to examine the structure of a Lark Base
"""

import requests
import json
import sys
from typing import Dict, List, Any, Optional

class LarkBaseExaminer:
    def __init__(self, config_file: str = "config.json"):
        self.load_config(config_file)
        self.domain = self.config.get("domain", "https://open.larksuite.com")
        self.access_token = self.get_fresh_token()
        
    def load_config(self, config_file: str):
        """Load Lark configuration from file"""
        try:
            with open(config_file, 'r') as f:
                self.config = json.load(f)
        except Exception as e:
            print(f"❌ Failed to load config: {e}")
            raise
    
    def get_fresh_token(self) -> Optional[str]:
        """Get fresh access token using app credentials"""
        url = f"{self.domain}/open-apis/auth/v3/tenant_access_token/internal"
        payload = {
            "app_id": self.config.get("appId"),
            "app_secret": self.config.get("appSecret")
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            result = response.json()
            
            if result.get("code") == 0:
                token = result.get("tenant_access_token")
                print(f"✅ Fresh access token obtained")
                return token
            else:
                print(f"❌ Token error: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Token request failed: {e}")
            return None
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers for API requests"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    def get_base_info(self, app_token: str) -> Optional[Dict[str, Any]]:
        """Get base information"""
        url = f"{self.domain}/open-apis/bitable/v1/apps/{app_token}"
        
        try:
            response = requests.get(url, headers=self.get_headers())
            result = response.json()
            
            if result.get("code") == 0:
                return result.get("data", {}).get("app", {})
            else:
                print(f"❌ Error getting base info: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None
    
    def list_tables(self, app_token: str) -> Optional[List[Dict[str, Any]]]:
        """List all tables in the base"""
        url = f"{self.domain}/open-apis/bitable/v1/apps/{app_token}/tables"
        
        try:
            response = requests.get(url, headers=self.get_headers())
            result = response.json()
            
            if result.get("code") == 0:
                return result.get("data", {}).get("items", [])
            else:
                print(f"❌ Error listing tables: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None
    
    def get_table_schema(self, app_token: str, table_id: str) -> Optional[Dict[str, Any]]:
        """Get table schema (fields)"""
        url = f"{self.domain}/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/fields"
        
        try:
            response = requests.get(url, headers=self.get_headers())
            result = response.json()
            
            if result.get("code") == 0:
                return result.get("data", {})
            else:
                print(f"❌ Error getting table schema: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None
    
    def get_table_records(self, app_token: str, table_id: str, limit: int = 10) -> Optional[Dict[str, Any]]:
        """Get sample records from table"""
        url = f"{self.domain}/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records"
        params = {"page_size": limit}
        
        try:
            response = requests.get(url, headers=self.get_headers(), params=params)
            result = response.json()
            
            if result.get("code") == 0:
                return result.get("data", {})
            else:
                print(f"❌ Error getting table records: {result}")
                return None
                
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None
    
    def get_field_type_name(self, field_type: int) -> str:
        """Convert field type number to readable name"""
        field_types = {
            1: "Text",
            2: "Number", 
            3: "Single Select",
            4: "Multi Select",
            5: "DateTime",
            7: "Checkbox",
            11: "User",
            13: "Phone",
            15: "URL",
            17: "Attachment",
            18: "Link",
            19: "Lookup",
            20: "Rollup",
            21: "Formula",
            22: "Auto Number"
        }
        return field_types.get(field_type, f"Unknown ({field_type})")
    
    def examine_base(self, app_token: str) -> Dict[str, Any]:
        """Examine complete base structure"""
        print(f"🔍 Examining Lark Base: {app_token}")
        print("=" * 60)
        
        # Get base info
        base_info = self.get_base_info(app_token)
        if not base_info:
            return {"status": "error", "message": "Failed to get base info"}
        
        print(f"📊 Base Information:")
        print(f"   Name: {base_info.get('name', 'N/A')}")
        print(f"   Description: {base_info.get('description', 'N/A')}")
        print(f"   App Token: {app_token}")
        print(f"   Time Zone: {base_info.get('time_zone', 'N/A')}")
        print()
        
        # Get tables
        tables = self.list_tables(app_token)
        if not tables:
            return {"status": "error", "message": "Failed to get tables"}
        
        print(f"🗂️  Tables ({len(tables)} total):")
        print("-" * 40)
        
        base_structure = {
            "base_info": base_info,
            "tables": [],
            "total_tables": len(tables),
            "total_fields": 0,
            "total_records": 0
        }
        
        for i, table in enumerate(tables, 1):
            table_id = table.get("table_id")
            table_name = table.get("name", "Unknown")
            
            print(f"{i}. {table_name} (ID: {table_id})")
            
            # Get table schema
            schema = self.get_table_schema(app_token, table_id)
            fields = []
            
            if schema:
                field_items = schema.get("items", [])
                print(f"   Fields ({len(field_items)} total):")
                
                for field in field_items:
                    field_name = field.get("field_name", "Unknown")
                    field_type = field.get("type", 0)
                    field_type_name = self.get_field_type_name(field_type)
                    
                    field_info = {
                        "name": field_name,
                        "type": field_type,
                        "type_name": field_type_name,
                        "ui_type": field.get("ui_type")
                    }
                    
                    # Add options for select fields
                    if field_type in [3, 4]:  # Single/Multi Select
                        options = field.get("property", {}).get("options", [])
                        if options:
                            field_info["options"] = [opt.get("name") for opt in options]
                    
                    fields.append(field_info)
                    print(f"     - {field_name} ({field_type_name})")
                    
                    if field_type in [3, 4] and field_info.get("options"):
                        print(f"       Options: {', '.join(field_info['options'])}")
            
            # Get sample records
            records_data = self.get_table_records(app_token, table_id, 5)
            record_count = 0
            sample_records = []
            
            if records_data:
                records = records_data.get("items", [])
                record_count = records_data.get("total", len(records))
                
                print(f"   Records: {record_count} total")
                
                if records:
                    print(f"   Sample Records (first {min(len(records), 3)}):")
                    for j, record in enumerate(records[:3], 1):
                        record_fields = record.get("fields", {})
                        sample_records.append(record_fields)
                        print(f"     Record {j}: {json.dumps(record_fields, ensure_ascii=False)[:100]}...")
            
            table_structure = {
                "table_id": table_id,
                "name": table_name,
                "fields": fields,
                "record_count": record_count,
                "sample_records": sample_records
            }
            
            base_structure["tables"].append(table_structure)
            base_structure["total_fields"] += len(fields)
            base_structure["total_records"] += record_count
            
            print()
        
        print("📈 Summary:")
        print(f"   Total Tables: {base_structure['total_tables']}")
        print(f"   Total Fields: {base_structure['total_fields']}")
        print(f"   Total Records: {base_structure['total_records']}")
        
        return {
            "status": "success",
            "structure": base_structure
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: python examine_base.py <app_token>")
        print("Example: python examine_base.py BI4RbpcKxaR7C2sLq9GjXJUjp2b")
        sys.exit(1)
    
    app_token = sys.argv[1]
    
    try:
        examiner = LarkBaseExaminer()
        result = examiner.examine_base(app_token)
        
        if result["status"] == "success":
            # Save detailed structure to file
            with open(f"base_structure_{app_token}.json", "w", encoding="utf-8") as f:
                json.dump(result["structure"], f, ensure_ascii=False, indent=2)
            
            print(f"\n💾 Detailed structure saved to: base_structure_{app_token}.json")
        else:
            print(f"❌ Examination failed: {result.get('message')}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()