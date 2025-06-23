#!/usr/bin/env python3
"""
OpenAI Agents SDK-based SFA Agent for Lark MCP
Automatically creates a Sales Force Automation system in Lark Base using the Agents SDK.
"""

import os
import subprocess
from agents import Agent, Runner, function_tool

# Path to Lark MCP config
config_path = os.path.join(os.path.dirname(__file__), "config.json")
# Base command to call Lark MCP CLI in stdio mode
base_cmd = ["node", "dist/cli.js", "mcp", "--config", config_path, "stdio"]

@function_tool
def run_mcp_cli(command: str) -> str:
    full_cmd = base_cmd + command.split()
    result = subprocess.run(full_cmd, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout

@function_tool
def create_base(name: str, description: str) -> str:
    return run_mcp_cli(f"bitable.v1.app.create --name \"{name}\" --description \"{description}\"")

@function_tool
def create_table(app_token: str, table_name: str) -> str:
    return run_mcp_cli(f"bitable.v1.appTable.create --app_token {app_token} --table_name \"{table_name}\"")

@function_tool
def create_field(app_token: str, table_id: str, field_name: str, field_type: int) -> str:
    return run_mcp_cli(
        f"bitable.v1.appTableField.create --app_token {app_token} --table_id {table_id} --field_name \"{field_name}\" --type {field_type}"
    )

def main():
    instructions = (
        "You are an autonomous Lark MCP agent. "
        "Create a Sales Force Automation system named 'SFA-System' with tables: "
        "Leads, Contacts, Accounts, Opportunities, Sales_Activities, Sales_Pipeline, Sales_Metrics, Tasks. "
        "Use the provided tools to create the base, tables, and fields step by step, "
        "and return a summary of each step."
    )
    # Register the subprocess-based CLI executor and creation tools
    tools = [run_mcp_cli, create_base, create_table, create_field]
    agent = Agent(name="Lark SFA Agent", instructions=instructions, tools=tools)
    result = Runner.run_sync(agent, "Create the SFA-System in Lark Base")
    # Output the result and any tool responses
    print(result)

if __name__ == "__main__":
    main()