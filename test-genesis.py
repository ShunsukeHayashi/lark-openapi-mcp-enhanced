#!/usr/bin/env python3
"""
Test Genesis Agent - Lark Base System Creator (Mock Version)
Demonstrates the system structure without requiring OpenAI API
"""

import json
import logging
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TestGenesisAgent:
    def __init__(self):
        logger.info("✅ Test Genesis Agent initialized")
    
    def create_cms_system_design(self) -> Dict[str, Any]:
        """Create CMS system design (mock version)"""
        return {
            "name": "CMS - Content Management System",
            "description": "Complete content management system with blog posts, pages, media, categories, and analytics",
            "tables": [
                {
                    "name": "コンテンツ記事",
                    "physical_name": "TBL_ContentArticles",
                    "fields": [
                        {"name": "記事ID", "physical_name": "FLD_articleId", "type": "AUTO_NUMBER"},
                        {"name": "タイトル", "physical_name": "FLD_title", "type": "TEXT"},
                        {"name": "内容", "physical_name": "FLD_content", "type": "TEXT"},
                        {"name": "著者", "physical_name": "FLD_author", "type": "USER"},
                        {"name": "ステータス", "physical_name": "FLD_status", "type": "SINGLE_SELECT"},
                        {"name": "公開日", "physical_name": "FLD_publishDate", "type": "DATETIME"}
                    ]
                },
                {
                    "name": "カテゴリ",
                    "physical_name": "TBL_Categories",
                    "fields": [
                        {"name": "カテゴリID", "physical_name": "FLD_categoryId", "type": "AUTO_NUMBER"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "説明", "physical_name": "FLD_description", "type": "TEXT"}
                    ]
                }
            ],
            "formulas": [
                {
                    "table": "カテゴリ",
                    "field": "記事数",
                    "formula": "COUNT(関連記事)",
                    "description": "カテゴリに属する記事数を自動計算"
                }
            ],
            "workflows": [
                {
                    "name": "新記事通知",
                    "trigger": "レコードが追加されたとき",
                    "action": "編集チームに通知を送る"
                }
            ]
        }
    
    def create_sfa_system_design(self) -> Dict[str, Any]:
        """Create SFA system design (mock version)"""
        return {
            "name": "SFA - Sales Force Automation",
            "description": "Complete sales force automation system with lead management, contacts, accounts, opportunities",
            "tables": [
                {
                    "name": "リード",
                    "physical_name": "TBL_Leads",
                    "fields": [
                        {"name": "リードID", "physical_name": "FLD_leadId", "type": "AUTO_NUMBER"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "メール", "physical_name": "FLD_email", "type": "TEXT"},
                        {"name": "会社", "physical_name": "FLD_company", "type": "TEXT"},
                        {"name": "ステータス", "physical_name": "FLD_status", "type": "SINGLE_SELECT"}
                    ]
                },
                {
                    "name": "オポチュニティ",
                    "physical_name": "TBL_Opportunities",
                    "fields": [
                        {"name": "オポチュニティID", "physical_name": "FLD_opportunityId", "type": "AUTO_NUMBER"},
                        {"name": "名前", "physical_name": "FLD_name", "type": "TEXT"},
                        {"name": "金額", "physical_name": "FLD_amount", "type": "NUMBER"},
                        {"name": "ステージ", "physical_name": "FLD_stage", "type": "SINGLE_SELECT"}
                    ]
                }
            ],
            "formulas": [
                {
                    "table": "アカウント",
                    "field": "オポチュニティ合計金額",
                    "formula": "SUM(関連オポチュニティ.金額)",
                    "description": "アカウントに紐づくオポチュニティの合計金額を自動計算"
                }
            ],
            "workflows": [
                {
                    "name": "新リード通知",
                    "trigger": "レコードが追加されたとき",
                    "action": "営業担当者に通知を送る"
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
                plan.append(f"bitable.v1.appTableField.create --table_id <{table['physical_name']}_ID> --field_name '{field['physical_name']}' --type {self.get_field_type_code(field['type'])}")
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
            "USER": 11,
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

使用するMCPツール:
- bitable.v1.app.create (Base作成)
- bitable.v1.appTable.create (テーブル作成)
- bitable.v1.appTableField.create (フィールド作成)

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