#!/usr/bin/env python3
"""
Test CMS-SFA Agent (Demo Version)
Demonstrates the agent functionality without requiring OpenAI API key
"""

import json
import os
from typing import Dict, List, Any

class TestCMSSFAAgent:
    def __init__(self, config_file: str = "config.json"):
        self.load_config(config_file)
        
    def load_config(self, config_file: str):
        """Load Lark configuration from file"""
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                self.lark_config = {
                    "app_id": config.get("appId"),
                    "app_secret": config.get("appSecret"),
                    "domain": config.get("domain", "https://open.feishu.cn"),
                    "language": config.get("language", "en")
                }
                print("✅ Lark configuration loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load config: {e}")
            raise
    
    def generate_cms_system_plan(self) -> Dict[str, Any]:
        """Generate CMS system creation plan"""
        return {
            "status": "success",
            "system_type": "cms",
            "execution_plan": [
                "🚀 CMS System Creation Plan:",
                "",
                "Step 1: Create CMS-System Base Application",
                "Step 2: Create Content_Articles table (title, content, author, status, publish_date, seo_meta)",
                "Step 3: Create Content_Pages table (title, slug, content, template, status)",
                "Step 4: Create Media_Library table (file_name, file_url, file_type, file_size, alt_text)",
                "Step 5: Create Categories table (name, description, parent_category, slug)",
                "Step 6: Create Tags table (name, description, usage_count)",
                "Step 7: Create Users table (name, email, role, permissions, last_login)",
                "Step 8: Create Content_Analytics table (content_id, views, shares, engagement_score)",
                "Step 9: Create Publishing_Workflow table (content_id, status, reviewer, review_date)",
                "Step 10: Set up table relations (Articles -> Categories, Articles -> Tags, etc.)",
                "Step 11: Configure rollup calculations (category article count, tag usage count)",
                "Step 12: Add sample content and test publishing workflow"
            ],
            "mcp_commands": [
                "# Create CMS Base Application",
                "bitable.v1.app.create --name 'CMS-System' --description 'Content Management System'",
                "",
                "# Create CMS Tables",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Content_Articles'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Content_Pages'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Media_Library'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Categories'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Tags'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Users'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Content_Analytics'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Publishing_Workflow'",
                "",
                "# Add Fields to Tables",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'title' --type 1",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'content' --type 1",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'author' --type 11",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'status' --type 3",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'publish_date' --type 5"
            ],
            "claude_prompt": """
Lark MCPツールを使用して、OpenAI Agentが設計したCMS（Content Management System）を実行してください。

CMSシステム仕様:
- Base名: CMS-System
- 8テーブル構成 (Content_Articles, Content_Pages, Media_Library, Categories, Tags, Users, Content_Analytics, Publishing_Workflow)
- コンテンツ管理機能
- ユーザー管理機能
- カテゴリ・タグ管理
- 公開ワークフロー
- SEO管理
- アナリティクス追跡

段階的に作成し、各ステップの成功を確認してから次に進んでください。
エラーが発生した場合は、シンプルな構成から開始して徐々に機能を追加してください。

使用するMCPツール:
- bitable.v1.app.create (Base作成)
- bitable.v1.appTable.create (テーブル作成)
- bitable.v1.appTableField.create (フィールド作成)
- bitable.v1.appTableRecord.create (データ作成)
- bitable.v1.appTableRecord.search (データ検索)
"""
        }
    
    def generate_sfa_system_plan(self) -> Dict[str, Any]:
        """Generate SFA system creation plan"""
        return {
            "status": "success",
            "system_type": "sfa",
            "execution_plan": [
                "🚀 SFA System Creation Plan:",
                "",
                "Step 1: Create SFA-System Base Application",
                "Step 2: Create Leads table (name, email, phone, company, source, status, assigned_to)",
                "Step 3: Create Contacts table (name, email, phone, company, position, lead_source)",
                "Step 4: Create Accounts table (company_name, industry, size, website, address)",
                "Step 5: Create Opportunities table (name, account, amount, stage, close_date, probability)",
                "Step 6: Create Sales_Activities table (type, subject, contact, date, outcome, notes)",
                "Step 7: Create Sales_Pipeline table (stage_name, probability, expected_value)",
                "Step 8: Create Sales_Metrics table (salesperson, period, revenue, deals_closed, conversion_rate)",
                "Step 9: Create Tasks table (subject, assigned_to, due_date, priority, status, related_to)",
                "Step 10: Set up table relations (Leads -> Contacts, Contacts -> Accounts, etc.)",
                "Step 11: Configure rollup calculations (account total opportunities, lead conversion rate)",
                "Step 12: Add sample sales data and test pipeline workflow"
            ],
            "mcp_commands": [
                "# Create SFA Base Application",
                "bitable.v1.app.create --name 'SFA-System' --description 'Sales Force Automation System'",
                "",
                "# Create SFA Tables",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Leads'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Contacts'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Accounts'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Opportunities'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Sales_Activities'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Sales_Pipeline'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Sales_Metrics'",
                "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Tasks'",
                "",
                "# Add Fields to Tables",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'name' --type 1",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'email' --type 1",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'phone' --type 13",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'company' --type 1",
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'status' --type 3"
            ],
            "claude_prompt": """
Lark MCPツールを使用して、OpenAI Agentが設計したSFA（Sales Force Automation）システムを実行してください。

SFAシステム仕様:
- Base名: SFA-System
- 8テーブル構成 (Leads, Contacts, Accounts, Opportunities, Sales_Activities, Sales_Pipeline, Sales_Metrics, Tasks)
- リード管理機能
- コンタクト管理機能
- アカウント管理機能
- オポチュニティ管理機能
- 営業活動管理
- パフォーマンス分析

段階的に作成し、各ステップの成功を確認してから次に進んでください。
エラーが発生した場合は、シンプルな構成から開始して徐々に機能を追加してください。

使用するMCPツール:
- bitable.v1.app.create (Base作成)
- bitable.v1.appTable.create (テーブル作成)
- bitable.v1.appTableField.create (フィールド作成)
- bitable.v1.appTableRecord.create (データ作成)
- bitable.v1.appTableRecord.search (データ検索)
"""
        }
    
    def create_both_systems(self) -> Dict[str, Any]:
        """Create both CMS and SFA systems (demo version)"""
        print("🚀 Creating both CMS and SFA systems (Demo Version)...")
        
        results = {}
        
        # Create CMS System
        print("📝 Creating CMS System...")
        cms_result = self.generate_cms_system_plan()
        results["cms"] = cms_result
        
        # Create SFA System
        print("💼 Creating SFA System...")
        sfa_result = self.generate_sfa_system_plan()
        results["sfa"] = sfa_result
        
        return {
            "status": "success",
            "systems": results,
            "summary": {
                "cms_status": cms_result.get("status"),
                "sfa_status": sfa_result.get("status"),
                "total_systems": 2
            }
        }

def main():
    print("🤖 Test CMS-SFA Agent (Demo Version)")
    print("=" * 50)
    print("This is a demo version that shows the agent's capabilities")
    print("without requiring an OpenAI API key.")
    print()
    
    agent = TestCMSSFAAgent()
    
    # Create both systems
    result = agent.create_both_systems()
    
    if result["status"] == "success":
        print("✅ Both systems designed successfully!")
        print()
        
        # Display CMS results
        if "cms" in result["systems"]:
            cms_result = result["systems"]["cms"]
            print("📝 CMS System Results:")
            print("-" * 30)
            if cms_result["status"] == "success":
                for instruction in cms_result["execution_plan"]:
                    print(instruction)
                print()
                print("🚀 Execute CMS in Claude Desktop:")
                print("-" * 30)
                print(cms_result["claude_prompt"])
            else:
                print(f"❌ CMS Error: {cms_result['message']}")
            print()
        
        # Display SFA results
        if "sfa" in result["systems"]:
            sfa_result = result["systems"]["sfa"]
            print("💼 SFA System Results:")
            print("-" * 30)
            if sfa_result["status"] == "success":
                for instruction in sfa_result["execution_plan"]:
                    print(instruction)
                print()
                print("🚀 Execute SFA in Claude Desktop:")
                print("-" * 30)
                print(sfa_result["claude_prompt"])
            else:
                print(f"❌ SFA Error: {sfa_result['message']}")
            print()
        
        # Display summary
        summary = result["summary"]
        print("📊 Summary:")
        print(f"   CMS Status: {summary['cms_status']}")
        print(f"   SFA Status: {summary['sfa_status']}")
        print(f"   Total Systems: {summary['total_systems']}")
        print()
        print("🎯 To use the full OpenAI-powered version:")
        print("   1. Set your OpenAI API key: export OPENAI_API_KEY='your-key'")
        print("   2. Run: python3 cms-sfa-agent.py")
        print("   3. Or use: ./run-cms-sfa-agent.sh")
        
    else:
        print(f"❌ Error: {result.get('message', 'Unknown error')}")

if __name__ == "__main__":
    main() 