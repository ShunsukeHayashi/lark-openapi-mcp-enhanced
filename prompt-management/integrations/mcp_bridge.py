#!/usr/bin/env python3
"""
MCP Bridge for Prompt Management System
プロンプト管理システム用MCP連携ブリッジ
"""

import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

# MCP関連インポート（実際の実装では適切なMCPライブラリを使用）
try:
    from mcp_client import MCPClient
except ImportError:
    # Fallback for development
    class MCPClient:
        def __init__(self, config): pass
        async def call_tool(self, tool, params): return {"success": True}

@dataclass
class MCPToolCall:
    """MCP ツール呼び出し定義"""
    tool: str
    parameters: Dict[str, Any]
    timeout: int = 30
    retry_count: int = 3

@dataclass
class MCPResult:
    """MCP実行結果"""
    success: bool
    data: Any = None
    error: str = None
    execution_time: float = 0.0
    tool_name: str = None

class MCPBridge:
    """プロンプト管理システム用MCP連携ブリッジ"""
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.client = None
        self.logger = logging.getLogger(__name__)
        
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """設定ファイルを読み込み"""
        if config_path:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # デフォルト設定
        return {
            "lark": {
                "appId": "cli_a8d2fdb1f1f8d02d",
                "appSecret": "V7mzILXEgIaqLwLXtyZstekRJsjRsFfJ",
                "domain": "https://open.feishu.cn"
            },
            "mcp": {
                "timeout": 30,
                "retry_count": 3,
                "retry_delay": 1.0
            }
        }
    
    async def connect(self) -> bool:
        """MCP クライアントに接続"""
        try:
            self.client = MCPClient(self.config)
            await self.client.connect()
            self.logger.info("MCP client connected successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to connect to MCP: {e}")
            return False
    
    async def disconnect(self):
        """MCP クライアント切断"""
        if self.client:
            await self.client.disconnect()
            self.client = None
    
    async def execute_tool(self, tool_call: MCPToolCall) -> MCPResult:
        """MCP ツールを実行"""
        if not self.client:
            return MCPResult(
                success=False, 
                error="MCP client not connected",
                tool_name=tool_call.tool
            )
        
        start_time = datetime.now()
        
        try:
            # パラメータの前処理
            processed_params = await self._preprocess_parameters(
                tool_call.parameters
            )
            
            # MCP ツール実行
            result = await self.client.call_tool(
                tool_call.tool, 
                processed_params
            )
            
            execution_time = (datetime.now() - start_time).total_seconds()
            
            return MCPResult(
                success=True,
                data=result,
                execution_time=execution_time,
                tool_name=tool_call.tool
            )
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            self.logger.error(f"MCP tool execution failed: {e}")
            
            return MCPResult(
                success=False,
                error=str(e),
                execution_time=execution_time,
                tool_name=tool_call.tool
            )
    
    async def batch_execute(self, tool_calls: List[MCPToolCall]) -> List[MCPResult]:
        """複数のMCPツールを順次実行"""
        results = []
        
        for tool_call in tool_calls:
            result = await self.execute_tool(tool_call)
            results.append(result)
            
            # エラー時の処理
            if not result.success:
                self.logger.warning(
                    f"Tool {tool_call.tool} failed: {result.error}"
                )
                # 必要に応じて処理を中断
                if self._should_stop_on_error(tool_call):
                    break
        
        return results
    
    async def _preprocess_parameters(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """パラメータの前処理（変数展開など）"""
        processed = {}
        
        for key, value in params.items():
            if isinstance(value, str) and value.startswith("{{") and value.endswith("}}"):
                # 変数展開
                var_name = value[2:-2].strip()
                processed[key] = await self._resolve_variable(var_name)
            else:
                processed[key] = value
        
        return processed
    
    async def _resolve_variable(self, var_name: str) -> Any:
        """変数を解決"""
        # 実装では適切な変数解決機構を使用
        variable_map = {
            "current_timestamp": datetime.now().isoformat(),
            "base_domain": self.config["lark"]["domain"],
            "app_id": self.config["lark"]["appId"]
        }
        
        return variable_map.get(var_name, f"{{{{ {var_name} }}}}")
    
    def _should_stop_on_error(self, tool_call: MCPToolCall) -> bool:
        """エラー時に処理を停止すべきかを判定"""
        # 重要なツール（Base作成など）でエラーが発生した場合は停止
        critical_tools = [
            "bitable.v1.app.create",
            "bitable.v1.table.create",
            "docx.v1.document.create"
        ]
        
        return tool_call.tool in critical_tools

class LarkBaseManager:
    """Lark Base 専用管理クラス"""
    
    def __init__(self, mcp_bridge: MCPBridge):
        self.bridge = mcp_bridge
        self.logger = logging.getLogger(__name__)
    
    async def create_base(self, name: str, folder_token: str = None) -> MCPResult:
        """新しいBaseを作成"""
        tool_call = MCPToolCall(
            tool="bitable.v1.app.create",
            parameters={
                "name": name,
                "folder_token": folder_token
            }
        )
        
        return await self.bridge.execute_tool(tool_call)
    
    async def create_table(self, app_token: str, table_config: Dict[str, Any]) -> MCPResult:
        """テーブルを作成"""
        tool_call = MCPToolCall(
            tool="bitable.v1.table.create",
            parameters={
                "app_token": app_token,
                "table": table_config
            }
        )
        
        return await self.bridge.execute_tool(tool_call)
    
    async def create_field(self, app_token: str, table_id: str, field_config: Dict[str, Any]) -> MCPResult:
        """フィールドを作成"""
        tool_call = MCPToolCall(
            tool="bitable.v1.field.create",
            parameters={
                "app_token": app_token,
                "table_id": table_id,
                "field": field_config
            }
        )
        
        return await self.bridge.execute_tool(tool_call)
    
    async def insert_records(self, app_token: str, table_id: str, records: List[Dict[str, Any]]) -> MCPResult:
        """レコードを一括挿入"""
        tool_call = MCPToolCall(
            tool="bitable.v1.record.batch_create",
            parameters={
                "app_token": app_token,
                "table_id": table_id,
                "records": records
            }
        )
        
        return await self.bridge.execute_tool(tool_call)
    
    async def get_base_structure(self, app_token: str) -> Dict[str, Any]:
        """Baseの構造を取得"""
        # アプリ情報取得
        app_result = await self.bridge.execute_tool(
            MCPToolCall("bitable.v1.app.get", {"app_token": app_token})
        )
        
        # テーブル一覧取得
        tables_result = await self.bridge.execute_tool(
            MCPToolCall("bitable.v1.table.list", {"app_token": app_token})
        )
        
        structure = {
            "app_info": app_result.data if app_result.success else None,
            "tables": [],
            "relationships": []
        }
        
        if tables_result.success:
            for table in tables_result.data.get("items", []):
                table_id = table["table_id"]
                
                # フィールド情報取得
                fields_result = await self.bridge.execute_tool(
                    MCPToolCall(
                        "bitable.v1.field.list",
                        {"app_token": app_token, "table_id": table_id}
                    )
                )
                
                table_info = {
                    "table_id": table_id,
                    "name": table["name"],
                    "fields": fields_result.data.get("items", []) if fields_result.success else []
                }
                
                structure["tables"].append(table_info)
        
        return structure

class DocumentManager:
    """ドキュメント管理クラス"""
    
    def __init__(self, mcp_bridge: MCPBridge):
        self.bridge = mcp_bridge
    
    async def create_document(self, title: str, content: str) -> MCPResult:
        """新しいドキュメントを作成"""
        tool_call = MCPToolCall(
            tool="docx.v1.document.create",
            parameters={
                "title": title,
                "content": content
            }
        )
        
        return await self.bridge.execute_tool(tool_call)
    
    async def send_notification(self, chat_id: str, message: str) -> MCPResult:
        """Larkメッセージを送信"""
        tool_call = MCPToolCall(
            tool="im.v1.message.create",
            parameters={
                "receive_id": chat_id,
                "msg_type": "text",
                "content": json.dumps({"text": message})
            }
        )
        
        return await self.bridge.execute_tool(tool_call)

# 使用例
async def example_usage():
    """使用例"""
    # MCP Bridge初期化
    bridge = MCPBridge()
    await bridge.connect()
    
    try:
        # Base管理
        base_manager = LarkBaseManager(bridge)
        
        # 新しいBaseを作成
        create_result = await base_manager.create_base("テストCRM")
        
        if create_result.success:
            app_token = create_result.data["app_token"]
            print(f"Base created successfully: {app_token}")
            
            # テーブル作成
            table_config = {
                "name": "顧客情報",
                "default_view_name": "すべての顧客"
            }
            
            table_result = await base_manager.create_table(app_token, table_config)
            print(f"Table creation result: {table_result.success}")
        
        # ドキュメント管理
        doc_manager = DocumentManager(bridge)
        
        # 設計書作成
        doc_result = await doc_manager.create_document(
            "CRM設計書",
            "# CRM システム設計書\n\n## 概要\n..."
        )
        
        print(f"Document creation result: {doc_result.success}")
        
    finally:
        await bridge.disconnect()

if __name__ == "__main__":
    asyncio.run(example_usage())