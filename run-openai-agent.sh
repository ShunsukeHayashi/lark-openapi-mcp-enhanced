#!/bin/bash

# OpenAI Agent Execution Script for Lark CRM Creation
# Auto-generates and executes CRM system using AI

echo "🤖 Starting OpenAI Agent for Lark CRM Creation..."
echo "=================================================="

# Check if OpenAI API key is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not found in environment"
    echo "Please set your OpenAI API key:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    echo ""
    echo "🔄 Proceeding with direct MCP execution instead..."
    echo ""
fi

# Navigate to project directory
cd /Users/shunsukehayashi/Dev/lark/lark-openapi-mcp

# Check MCP server status
echo "🔧 Checking MCP Server Status..."
if pgrep -f "lark-openapi-mcp" > /dev/null; then
    echo "✅ MCP Server is running"
else
    echo "🚀 Starting MCP Server..."
    ./run-mcp.sh &
    sleep 3
fi

# Execute OpenAI Agent (if API key available)
if [ -n "$OPENAI_API_KEY" ]; then
    echo "🤖 Executing OpenAI Agent..."
    python3 openai-agent-creator.py
else
    echo "🔄 Direct execution mode..."
    echo ""
    echo "📋 Execute this command in Claude Desktop:"
    echo "----------------------------------------"
    cat << 'EOF'
Lark MCPツールを使用して、TeachableCRM-Integrationシステムを作成してください。

🎯 AI Agent設計仕様:
Base名: TeachableCRM-Integration

テーブル構成:
1. Products (プロダクトマスタ)
   - プロダクト名, プロダクトタイプ, 価格
   - 総売上(ロールアップ), 参加者数(ロールアップ)

2. Customers (顧客マスタ)  
   - 氏名, メールアドレス
   - LTV(ロールアップ自動計算)

3. Membership_Tiers (VIPプラン)
   - プラン名, 月額料金(¥55,000), 年額料金

4. Subscriptions_Sales (購入記録)
   - 購入者→Customers, 購入プロダクト→Products
   - 加入プラン→Membership_Tiers
   - 購入日, 種別, 購入金額

5. Bundle_Items (バンドル構成)
   - 親バンドル→Products, 子プロダクト→Products

6. Tier_Perks (プラン特典)
   - 対象プラン→Membership_Tiers
   - 特典プロダクト→Products

🔧 重要設定:
- テーブル間リレーション自動設定
- LTV/売上のロールアップ計算
- VIPプラン特典管理
- エラー時は段階的作成

AI Agentの設計に基づいて実行してください。
EOF
fi

echo ""
echo "✨ OpenAI Agent for Lark CRM - Ready!"
echo "=================================================="