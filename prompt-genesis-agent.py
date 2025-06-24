#!/usr/bin/env python3
"""
Prompt Genesis Agent - Lark Base System Creator
Creates comprehensive Lark Base systems from natural language requirements
Version: 2.0 - Enhanced with Prompt Design Template
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
        logging.FileHandler('/tmp/prompt-genesis-agent.log'),
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

class PromptGenesisAgent:
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
    
    def create_genesis_prompt(self) -> str:
        """Create the ultimate genesis prompt for Lark Base system creation"""
        return """
Role: Master System Architect & Lark Base Genesis Agent

あなたは、システムアナリスト、データベースアーキテクト、そしてLark Baseの専門家としての能力を兼ね備えた、究極のAIエージェントです。
あなたの使命は、ユーザーから提供される曖昧で自然言語の「要求仕様」を、厳密で実行可能なLark Baseアプリケーションの「完全な設計図」に変換することです。

あなたは、以下の思考プロセス（コマンドスタック）に厳密に従い、段階的に論理を構築し、最終的に単一の統合された設計ドキュメントを生成しなければなりません。

[Command Stack]

C1: Requirement Analysis - 要求仕様の構造的分解
1. #要求仕様 の全文を読み込み、その中から以下の構成要素をすべて抽出・リストアップせよ。
  - エンティティ（Entity）: 管理対象となる主要な「モノ」や「概念」。（例：顧客、案件、商品、従業員）
  - 属性（Attribute）: 各エンティティが持つべき「データ項目」。（例：企業名、案件金額、担当者名）
  - 活動（Activity）: システム内で発生する「コト」や「イベント」。（例：商談記録、問い合わせ対応、契約更新）これはエンティティになる可能性がある。
  - 関係性（Relation）: エンティティ間の繋がりを示す記述。（例：「一つの顧客に複数の案件が紐づく」「案件には担当者が一人つく」）
  - ビジネスルール（Business Rule）: 自動計算、制約、条件分岐など。（例：「受注確度がAの案件の合計金額を常に計算したい」「契約終了日の1ヶ月前に通知を送りたい」）

C2: Table Definition - テーブル定義の生成
1. C1で抽出した「エンティティ」と「活動」を元に、Lark Baseの**テーブル（Table）**を定義せよ。
2. 各テーブルに、推奨される「論理名（日本語名）」と「物理名（TBL_PascalCase形式）」を付与せよ。
3. この結果を、マークダウンのテーブル形式で出力せよ。

C3: Field Definition - フィールド定義の生成
1. C2で定義した各テーブルに対し、C1で抽出した「属性」を**フィールド（Field）**として割り当てよ。
2. 各フィールドに、「論理名」「物理名（FLD_camelCase形式）」「最適なフィールドタイプ（テキスト, 数値, 単一選択, 複数選択, 日付, 作成者, URL, 添付ファイルなどから選択）」を定義せよ。
3. データのユニーク性を担保する主キー（Primary Key）となりうるフィールドには、備考欄に (PK) と明記せよ。
4. この結果を、テーブルごとに整理されたマークダウンのリスト形式で出力せよ。

C4: Relation Mapping & ER Diagram - 関係性のマッピングとER図化
1. C1で分析した「関係性」に基づき、テーブル間のリレーションを定義せよ。
2. リレーションはLark Baseの「リンク（Link to other records）」と「ルックアップ（Lookup）」機能で実現するものとし、どのテーブルのどのフィールドをリンクさせるべきかを明記せよ。
3. 上記で定義したすべてのテーブルとリレーションシップを表現する**Mermaid記法のER図コード**を生成せよ。リレーションにはカーディナリティ（||--o{, }|--|| など）を適切に表現すること。

C5: Function & Formula Design - 数式（関数）の設計
1. C1で特定した「ビジネスルール」のうち、計算やデータ変換に関わるものを特定せよ。
2. それらを実現するためのLark Baseの**数式（Formula）フィールド**の具体的なコードを生成せよ。
3. どのテーブルの、どの新規フィールドにその数式をセットすべきかを明記せよ。

C6: Workflow Design - ワークフローの設計
1. C1で特定した「ビジネスルール」のうち、通知やステータス変更の自動化に関わるものを特定せよ。
2. それらを実現するためのLark Baseの**ワークフロー（Automation）**の設計案を、「トリガー（Trigger）」と「アクション（Action）」の形式で記述せよ。
  - トリガー: 「いつ」（例：レコードが追加されたとき、特定のフィールドが更新されたとき）
  - アクション: 「何をするか」（例：担当者に通知を送る、別のテーブルにレコードを作成する）

C7: Final Assembly - 最終設計図の統合
1. これまでのステップC2からC6で生成したすべての情報を集約し、以下の構造を持つ単一のマークダウンドキュメントとして最終出力せよ。

    ```markdown
    # Lark Base アプリケーション自動設計図

    ## 1. 概要
    （アプリケーションの目的を要約）

    ## 2. ER図 (エンティティ関連図)
    （C4で生成したMermaidコードブロック）

    ## 3. テーブル定義
    ### 3.1. （テーブル1の論理名）
    （C3で生成したフィールド定義リスト）
    ### 3.2. （テーブル2の論理名）
    （C3で生成したフィールド定義リスト）
    ...

    ## 4. 数式（Formula）定義
    （C5で生成した数式リスト）

    ## 5. ワークフロー（Automation）定義
    （C6で生成したワークフロー定義リスト）
    ```

#要求仕様
（ここに、ユーザーが提供する要求仕様が入力される）
"""
    
    def create_system_with_genesis(self, requirements: str) -> Dict[str, Any]:
        """Create Lark Base system using the genesis prompt"""
        try:
            logger.info("🤖 Creating Lark Base system using Genesis Agent...")
            
            # Ensure we have access token
            if not self.get_access_token():
                return {"status": "error", "message": "Failed to obtain access token"}
            
            # Create OpenAI agent conversation with genesis prompt
            messages = [
                {"role": "system", "content": self.create_genesis_prompt()},
                {"role": "user", "content": f"""
                #要求仕様
                {requirements}
                
                上記の要求仕様に基づいて、Lark Baseアプリケーションの完全な設計図を生成してください。
                コマンドスタックC1からC7まで、段階的に実行し、最終的に統合された設計ドキュメントを出力してください。
                """}
            ]
            
            # Get response from OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                max_tokens=4000,
                temperature=0.3
            )
            
            agent_response = response.choices[0].message.content
            
            # Generate execution plan
            execution_plan = self.generate_execution_plan(agent_response)
            
            return {
                "status": "success",
                "agent_response": agent_response,
                "execution_plan": execution_plan,
                "mcp_commands": self.generate_mcp_commands(agent_response)
            }
            
        except Exception as e:
            logger.error(f"❌ Genesis agent creation failed: {str(e)}")
            return {
                "status": "error", 
                "message": f"Genesis agent creation failed: {str(e)}"
            }
    
    def generate_execution_plan(self, agent_response: str) -> List[str]:
        """Generate step-by-step execution plan"""
        return [
            "🚀 Lark Base Genesis System Creation Plan:",
            "",
            "Step 1: Analyze requirements and extract entities, attributes, activities, relations, and business rules",
            "Step 2: Define tables based on entities and activities",
            "Step 3: Define fields for each table with appropriate field types",
            "Step 4: Map relationships and create ER diagram",
            "Step 5: Design formulas and calculations",
            "Step 6: Design automation workflows",
            "Step 7: Integrate all components into final design document",
            "",
            "🤖 Genesis Agent Response:",
            agent_response
        ]
    
    def generate_mcp_commands(self, agent_response: str) -> List[str]:
        """Generate MCP commands for system creation"""
        return [
            "# Create Base Application",
            "bitable.v1.app.create --name 'Generated-System' --description 'AI-Generated Lark Base System'",
            "",
            "# Create Tables (replace with actual table names from design)",
            "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Table1'",
            "bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name 'Table2'",
            "",
            "# Add Fields to Tables",
            "bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name 'fieldName' --type 1",
            "",
            "# Add Sample Data",
            "bitable.v1.appTableRecord.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --fields '{\"fieldName\": \"sample value\"}'"
        ]
    
    def create_claude_execution_prompt(self, agent_response: str) -> str:
        """Generate Claude Desktop execution prompt"""
        return f"""
Lark MCPツールを使用して、Genesis Agentが設計したLark Baseシステムを実行してください。

システム仕様:
- このシステムは、AIが要求仕様から自動生成した設計図に基づいて作成されます
- 複数のテーブルとリレーション、数式、ワークフローを含む完全なシステムです

段階的に作成し、各ステップの成功を確認してから次に進んでください。
エラーが発生した場合は、シンプルな構成から開始して徐々に機能を追加してください。

使用するMCPツール:
- bitable.v1.app.create (Base作成)
- bitable.v1.appTable.create (テーブル作成)
- bitable.v1.appTableField.create (フィールド作成)
- bitable.v1.appTableRecord.create (データ作成)
- bitable.v1.appTableRecord.search (データ検索)

設計図:
{agent_response}
"""
    
    def create_cms_sfa_systems(self) -> Dict[str, Any]:
        """Create both CMS and SFA systems using genesis approach"""
        logger.info("🚀 Creating CMS and SFA systems using Genesis Agent...")
        
        # CMS System Requirements
        cms_requirements = """
        # 1. このアプリケーションの目的は何ですか？
        コンテンツ管理システム（CMS）を実現したい。ブログ記事、ページ、メディアファイルを管理し、ユーザー管理、カテゴリ管理、公開ワークフロー、SEO管理、アナリティクス追跡を含む。

        # 2. 管理したい主要な「モノ」や「概念」は何ですか？
        - コンテンツ記事
        - コンテンツページ
        - メディアライブラリ
        - カテゴリ
        - タグ
        - ユーザー

        # 3. 管理したい「活動」や「イベント」は何ですか？
        - コンテンツ分析
        - 公開ワークフロー

        # 4. それぞれの「モノ」「コト」「活動」について、どんな情報を記録したいですか？
        - コンテンツ記事には：タイトル、内容、著者、ステータス、公開日、SEOメタデータを記録したい
        - コンテンツページには：タイトル、スラッグ、内容、テンプレート、ステータスを記録したい
        - メディアライブラリには：ファイル名、ファイルURL、ファイルタイプ、ファイルサイズ、alt属性を記録したい
        - カテゴリには：名前、説明、親カテゴリ、スラッグを記録したい
        - タグには：名前、説明、使用回数を記録したい
        - ユーザーには：名前、メール、役割、権限、最終ログインを記録したい
        - コンテンツ分析には：コンテンツID、閲覧数、シェア数、エンゲージメントスコアを記録したい
        - 公開ワークフローには：コンテンツID、ステータス、レビュアー、レビュー日を記録したい

        # 5. 自動化したい計算や処理はありますか？
        - カテゴリ別の記事数を自動計算したい
        - タグの使用回数を自動集計したい
        - コンテンツのエンゲージメントスコアを自動計算したい

        # 6. 特定の状況で、誰かに何かを知らせたいですか？
        - 新しい記事が投稿されたら、編集チームに通知したい
        - 記事の公開日が近づいたら、著者にリマインド通知を送りたい
        """
        
        # SFA System Requirements
        sfa_requirements = """
        # 1. このアプリケーションの目的は何ですか？
        営業力自動化（SFA）システムを実現したい。リード管理、コンタクト管理、アカウント管理、オポチュニティ管理、営業活動管理、パフォーマンス分析を含む。

        # 2. 管理したい主要な「モノ」や「概念」は何ですか？
        - リード
        - コンタクト
        - アカウント
        - オポチュニティ
        - 営業活動
        - 営業パイプライン
        - 営業メトリクス
        - タスク

        # 3. 管理したい「活動」や「イベント」は何ですか？
        - 営業活動の記録
        - パフォーマンス分析

        # 4. それぞれの「モノ」「コト」「活動」について、どんな情報を記録したいですか？
        - リードには：名前、メール、電話、会社、ソース、ステータス、担当者を記録したい
        - コンタクトには：名前、メール、電話、会社、役職、リードソースを記録したい
        - アカウントには：会社名、業界、規模、ウェブサイト、住所を記録したい
        - オポチュニティには：名前、アカウント、金額、ステージ、クローズ予定日、確度を記録したい
        - 営業活動には：タイプ、件名、コンタクト、日付、結果、メモを記録したい
        - 営業パイプラインには：ステージ名、確度、期待値を記録したい
        - 営業メトリクスには：営業担当者、期間、売上、成約数、コンバージョン率を記録したい
        - タスクには：件名、担当者、期限、優先度、ステータス、関連先を記録したい

        # 5. 自動化したい計算や処理はありますか？
        - アカウント別のオポチュニティ合計金額を自動計算したい
        - リードのコンバージョン率を自動計算したい
        - 営業担当者別の売上を自動集計したい

        # 6. 特定の状況で、誰かに何かを知らせたいですか？
        - 新しいリードが登録されたら、営業担当者に通知したい
        - オポチュニティのクローズ予定日が近づいたら、担当者にリマインド通知を送りたい
        """
        
        results = {}
        
        # Create CMS System
        logger.info("📝 Creating CMS System...")
        cms_result = self.create_system_with_genesis(cms_requirements)
        results["cms"] = cms_result
        
        # Create SFA System
        logger.info("💼 Creating SFA System...")
        sfa_result = self.create_system_with_genesis(sfa_requirements)
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
    
    agent = PromptGenesisAgent(api_key)
    
    print("🤖 Prompt Genesis Agent for Lark Base System Creation")
    print("=" * 60)
    
    # Create both systems
    result = agent.create_cms_sfa_systems()
    
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
                print(agent.create_claude_execution_prompt(cms_result["agent_response"]))
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
                print(agent.create_claude_execution_prompt(sfa_result["agent_response"]))
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