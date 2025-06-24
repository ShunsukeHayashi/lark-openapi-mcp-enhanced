#!/usr/bin/env python3
"""
OpenAI Agent for Lark Base CRM Creation
Automatically executes CRM system creation using Lark MCP tools
"""

import openai
import json
import subprocess
import time
import os
from typing import Dict, List, Any

class LarkCRMAgent:
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.lark_config = {
            "app_id": "cli_a8d2e0082978902e",
            "app_secret": "SQkCdptYmzrNa3MIfwmN2f7V5BXR2Ghz",
            "domain": "https://open.feishu.cn"
        }
        
    def check_mcp_status(self) -> bool:
        """Check if Lark MCP server is running"""
        try:
            result = subprocess.run(
                ["ps", "aux"], 
                capture_output=True, 
                text=True
            )
            return "lark-openapi-mcp" in result.stdout
        except Exception as e:
            print(f"Error checking MCP status: {e}")
            return False
    
    def start_mcp_server(self) -> bool:
        """Start Lark MCP server"""
        try:
            cmd = [
                "node", "dist/cli.js", "mcp",
                "--app-id", self.lark_config["app_id"],
                "--app-secret", self.lark_config["app_secret"],
                "--mode", "stdio"
            ]
            
            # Start in background
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd="/Users/shunsukehayashi/Dev/lark/lark-openapi-mcp"
            )
            
            time.sleep(3)  # Wait for startup
            return self.check_mcp_status()
            
        except Exception as e:
            print(f"Error starting MCP server: {e}")
            return False
    
    def create_system_prompt(self) -> str:
        """Create system prompt for OpenAI agent"""
        return """
        You are an expert Lark Base CRM system architect. Your task is to create a comprehensive CRM system using Lark MCP tools.
        
        System Requirements:
        - Create TeachableCRM-Integration Base
        - 6 interconnected tables with proper relations
        - Automatic calculations (LTV, revenue rollups)
        - VIP membership management (¥55,000/month)
        
        Table Structure:
        1. Products (product master with revenue rollup)
        2. Customers (customer master with LTV calculation)
        3. Membership_Tiers (VIP plans)
        4. Subscriptions_Sales (purchase records)
        5. Bundle_Items (bundle configuration)
        6. Tier_Perks (VIP benefits)
        
        Execute step-by-step with error handling and provide detailed progress updates.
        """
    
    def create_crm_system(self) -> Dict[str, Any]:
        """Create CRM system using OpenAI agent"""
        try:
            # Ensure MCP server is running
            if not self.check_mcp_status():
                print("🔧 Starting MCP server...")
                if not self.start_mcp_server():
                    return {"status": "error", "message": "Failed to start MCP server"}
            
            print("✅ MCP Server is running")
            
            # Create OpenAI agent conversation
            messages = [
                {"role": "system", "content": self.create_system_prompt()},
                {"role": "user", "content": """
                Create the TeachableCRM-Integration system now. 
                
                Execute this in the following order:
                1. Create base application
                2. Create all 6 tables with proper field types
                3. Set up table relations
                4. Configure rollup calculations
                5. Add sample VIP data
                
                Use Lark MCP tools and provide step-by-step progress.
                """}
            ]
            
            # Get response from OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=2000,
                temperature=0.3
            )
            
            agent_response = response.choices[0].message.content
            
            return {
                "status": "success",
                "agent_response": agent_response,
                "instructions": self.generate_execution_instructions(agent_response)
            }
            
        except Exception as e:
            return {
                "status": "error", 
                "message": f"Agent creation failed: {str(e)}"
            }
    
    def generate_execution_instructions(self, agent_response: str) -> List[str]:
        """Generate step-by-step execution instructions"""
        return [
            "🚀 OpenAI Agent CRM Creation Plan:",
            "",
            "Step 1: Verify MCP connection",
            "Step 2: Create TeachableCRM-Integration Base",
            "Step 3: Build Products table with rollup fields",
            "Step 4: Build Customers table with LTV calculation", 
            "Step 5: Create Membership_Tiers (VIP ¥55,000)",
            "Step 6: Create Subscriptions_Sales with relations",
            "Step 7: Create Bundle_Items table",
            "Step 8: Create Tier_Perks table",
            "Step 9: Configure all table relations",
            "Step 10: Test rollup calculations",
            "",
            "🤖 Agent Response:",
            agent_response
        ]
    
    def execute_with_claude(self) -> str:
        """Generate Claude Desktop execution command"""
        return """
Lark MCPツールを使用して、OpenAI Agentが設計したTeachableCRM-Integrationシステムを実行してください。

システム仕様:
- Base名: TeachableCRM-Integration
- 6テーブル構成 (Products, Customers, Membership_Tiers, Subscriptions_Sales, Bundle_Items, Tier_Perks)
- LTV自動計算
- 売上ロールアップ
- VIPメンバーシップ管理
- 複雑なテーブル関係

段階的に作成し、各ステップの成功を確認してから次に進んでください。
エラーが発生した場合は、シンプルな構成から開始して徐々に機能を追加してください。
"""

def main():
    # Initialize agent
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        return
    
    agent = LarkCRMAgent(api_key)
    
    print("🤖 Creating OpenAI Agent for Lark CRM System...")
    print("=" * 50)
    
    # Create CRM system
    result = agent.create_crm_system()
    
    if result["status"] == "success":
        print("✅ OpenAI Agent created successfully!")
        print()
        
        # Display instructions
        for instruction in result["instructions"]:
            print(instruction)
        
        print()
        print("🚀 Execute in Claude Desktop:")
        print("-" * 30)
        print(agent.execute_with_claude())
        
    else:
        print(f"❌ Error: {result['message']}")
        
        # Provide fallback
        print()
        print("🔄 Fallback: Execute directly in Claude Desktop:")
        print(agent.execute_with_claude())

if __name__ == "__main__":
    main()