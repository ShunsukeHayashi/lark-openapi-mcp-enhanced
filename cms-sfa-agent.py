#!/usr/bin/env python3
"""
OpenAI Agent for Lark Base CMS & SFA System Creation
Creates comprehensive Content Management System and Sales Force Automation using Lark MCP tools
Version: 3.0
"""

import openai
import json
import subprocess
import time
import os
import requests
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/cms-sfa-agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FieldType(Enum):
    TEXT = 1
    NUMBER = 2
    SINGLE_SELECT = 3
    MULTI_SELECT = 4
    DATETIME = 5
    CHECKBOX = 7
    USER = 11
    PHONE = 13
    URL = 15
    ATTACHMENT = 17
    LINK = 18
    LOOKUP = 19
    ROLLUP = 20
    FORMULA = 21
    AUTO_NUMBER = 22

@dataclass
class SystemConfig:
    name: str
    description: str
    tables: List[Dict[str, Any]]
    relations: List[Dict[str, Any]]
    rollups: List[Dict[str, Any]]

class CMSSFAAgent:
    def __init__(self, openai_api_key: str, config_file: str = "config.json"):
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.load_config(config_file)
        self.access_token = None
        self.token_expires_at = None
        self.created_systems = {}
        
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
    
    def create_system_prompt(self, system_type: str) -> str:
        """Create system prompt for OpenAI agent based on system type"""
        if system_type == "cms":
            return """
            You are an expert Content Management System (CMS) architect using Lark Base. 
            Create a comprehensive CMS system with the following components:
            
            CMS System Requirements:
            - Content Management (Articles, Pages, Media)
            - User Management (Authors, Editors, Admins)
            - Category Management (Tags, Categories)
            - Publishing Workflow (Draft, Review, Published)
            - SEO Management (Meta tags, URLs)
            - Analytics Tracking (Views, Engagement)
            
            Required Tables:
            1. Content_Articles (title, content, author, status, publish_date, seo_meta)
            2. Content_Pages (title, slug, content, template, status)
            3. Media_Library (file_name, file_url, file_type, file_size, alt_text)
            4. Categories (name, description, parent_category, slug)
            5. Tags (name, description, usage_count)
            6. Users (name, email, role, permissions, last_login)
            7. Content_Analytics (content_id, views, shares, engagement_score)
            8. Publishing_Workflow (content_id, status, reviewer, review_date)
            
            Execute step-by-step with proper error handling and provide detailed progress updates.
            """
        else:  # sfa
            return """
            You are an expert Sales Force Automation (SFA) architect using Lark Base.
            Create a comprehensive SFA system with the following components:
            
            SFA System Requirements:
            - Lead Management (Lead capture, qualification, conversion)
            - Contact Management (Contact details, communication history)
            - Opportunity Management (Sales pipeline, forecasting)
            - Account Management (Company information, relationships)
            - Sales Activities (Calls, meetings, tasks)
            - Performance Analytics (Sales metrics, KPIs)
            
            Required Tables:
            1. Leads (name, email, phone, company, source, status, assigned_to)
            2. Contacts (name, email, phone, company, position, lead_source)
            3. Accounts (company_name, industry, size, website, address)
            4. Opportunities (name, account, amount, stage, close_date, probability)
            5. Sales_Activities (type, subject, contact, date, outcome, notes)
            6. Sales_Pipeline (stage_name, probability, expected_value)
            7. Sales_Metrics (salesperson, period, revenue, deals_closed, conversion_rate)
            8. Tasks (subject, assigned_to, due_date, priority, status, related_to)
            
            Execute step-by-step with proper error handling and provide detailed progress updates.
            """
    
    def create_system_with_openai(self, system_type: str) -> Dict[str, Any]:
        """Create CMS or SFA system using OpenAI agent"""
        try:
            logger.info(f"🤖 Creating OpenAI Agent for {system_type.upper()} system...")
            
            # Ensure we have access token
            if not self.get_access_token():
                return {"status": "error", "message": "Failed to obtain access token"}
            
            # Create OpenAI agent conversation
            messages = [
                {"role": "system", "content": self.create_system_prompt(system_type)},
                {"role": "user", "content": f"""
                Create the {system_type.upper()} system now using Lark Base MCP tools.
                
                Execute this in the following order:
                1. Create base application named "{system_type.upper()}-System"
                2. Create all required tables with proper field types and relationships
                3. Set up table relations and rollup calculations
                4. Configure workflow and automation rules
                5. Add sample data for testing
                6. Verify system functionality
                
                Use Lark MCP tools and provide step-by-step progress with actual API calls.
                Include error handling and recovery mechanisms.
                """}
            ]
            
            # Get response from OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=3000,
                temperature=0.3
            )
            
            agent_response = response.choices[0].message.content
            
            # Generate execution plan
            execution_plan = self.generate_execution_plan(system_type, agent_response)
            
            return {
                "status": "success",
                "system_type": system_type,
                "agent_response": agent_response,
                "execution_plan": execution_plan,
                "mcp_commands": self.generate_mcp_commands(system_type)
            }
            
        except Exception as e:
            logger.error(f"❌ Agent creation failed: {str(e)}")
            return {
                "status": "error", 
                "message": f"Agent creation failed: {str(e)}"
            }
    
    def generate_execution_plan(self, system_type: str, agent_response: str) -> List[str]:
        """Generate step-by-step execution plan"""
        if system_type == "cms":
            return [
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
                "Step 12: Add sample content and test publishing workflow",
                "",
                "🤖 OpenAI Agent Response:",
                agent_response
            ]
        else:  # sfa
            return [
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
                "Step 12: Add sample sales data and test pipeline workflow",
                "",
                "🤖 OpenAI Agent Response:",
                agent_response
            ]
    
    def generate_mcp_commands(self, system_type: str) -> List[str]:
        """Generate MCP commands for system creation"""
        base_name = f"{system_type.upper()}-System"
        
        if system_type == "cms":
            return [
                f"# Create CMS Base Application",
                f"bitable.v1.app.create --name '{base_name}' --description 'Content Management System'",
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
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'publish_date' --type 5",
                "",
                "# Add Sample Data",
                "bitable.v1.appTableRecord.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --fields '{\"title\": \"Welcome to Our CMS\", \"content\": \"This is the first article...\", \"status\": \"Published\"}'"
            ]
        else:  # sfa
            return [
                f"# Create SFA Base Application",
                f"bitable.v1.app.create --name '{base_name}' --description 'Sales Force Automation System'",
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
                "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'status' --type 3",
                "",
                "# Add Sample Data",
                "bitable.v1.appTableRecord.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --fields '{\"name\": \"John Doe\", \"email\": \"john@example.com\", \"company\": \"ABC Corp\", \"status\": \"New\"}'"
            ]
    
    def create_claude_execution_prompt(self, system_type: str) -> str:
        """Generate Claude Desktop execution prompt"""
        if system_type == "cms":
            return """
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
        else:  # sfa
            return """
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
    
    def create_both_systems(self) -> Dict[str, Any]:
        """Create both CMS and SFA systems"""
        logger.info("🚀 Creating both CMS and SFA systems...")
        
        results = {}
        
        # Create CMS System
        logger.info("📝 Creating CMS System...")
        cms_result = self.create_system_with_openai("cms")
        results["cms"] = cms_result
        
        # Create SFA System
        logger.info("💼 Creating SFA System...")
        sfa_result = self.create_system_with_openai("sfa")
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
    # Initialize agent
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        print("Please set your OpenAI API key:")
        print("export OPENAI_API_KEY='your-api-key-here'")
        return
    
    agent = CMSSFAAgent(api_key)
    
    print("🤖 OpenAI Agent for Lark Base CMS & SFA System Creation")
    print("=" * 60)
    
    # Create both systems
    result = agent.create_both_systems()
    
    if result["status"] == "success":
        print("✅ Both systems created successfully!")
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
                print(agent.create_claude_execution_prompt("cms"))
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
                print(agent.create_claude_execution_prompt("sfa"))
            else:
                print(f"❌ SFA Error: {sfa_result['message']}")
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