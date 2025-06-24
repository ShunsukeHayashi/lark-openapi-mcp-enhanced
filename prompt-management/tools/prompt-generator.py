#!/usr/bin/env python3
"""
Prompt Generator Tool
プロンプト生成ツール
"""

import json
import argparse
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

class PromptGenerator:
    def __init__(self, base_path: str = None):
        if base_path is None:
            base_path = Path(__file__).parent.parent
        self.base_path = Path(base_path)
        self.templates_path = self.base_path / "prompts" / "templates"
        self.categories_path = self.base_path / "prompts" / "categories"
        self.index_path = self.base_path / "metadata" / "index.json"
        
        self.load_metadata()
    
    def load_metadata(self):
        """メタデータをロード"""
        try:
            with open(self.index_path, 'r', encoding='utf-8') as f:
                self.index = json.load(f)
        except FileNotFoundError:
            self.index = {"prompts": [], "categories": {}, "stats": {"total_prompts": 0}}
    
    def get_next_id(self, category: str) -> str:
        """次のIDを生成"""
        category_prompts = [p for p in self.index["prompts"] if p["category"] == category]
        next_num = len(category_prompts) + 1
        return f"{category}-{next_num:03d}"
    
    def load_template(self, template_name: str) -> str:
        """テンプレートをロード"""
        template_path = self.templates_path / f"{template_name}-template.md"
        if not template_path.exists():
            template_path = self.templates_path / "base-template.md"
        
        with open(template_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def generate_prompt(self, 
                       title: str,
                       category: str,
                       template: str = "base",
                       tags: list = None,
                       author: str = "System",
                       description: str = "",
                       complexity: str = "intermediate") -> Dict[str, Any]:
        """新しいプロンプトを生成"""
        
        if tags is None:
            tags = [category]
        
        # IDを生成
        prompt_id = self.get_next_id(category)
        
        # 現在の日付
        today = datetime.now().strftime("%Y-%m-%d")
        
        # テンプレートをロード
        template_content = self.load_template(template)
        
        # プレースホルダーを置換
        replacements = {
            "{{PROMPT_TITLE}}": title,
            "{{ROLE_DEFINITION}}": "[Role definition here]",
            "{{TASK_DESCRIPTION}}": "[Task description here]",
            "{{INPUT_SPECIFICATION}}": "[Input specification here]",
            "{{PROCESS_STEPS}}": "[Process steps here]",
            "{{OUTPUT_SPECIFICATION}}": "[Output specification here]",
            "{{CONSTRAINTS}}": "[Constraints here]",
            "{{EXAMPLES}}": "[Examples here]",
            "{{USE_CASE_1}}": "[Use case 1]",
            "{{USE_CASE_2}}": "[Use case 2]",
            "{{EXPECTED_RESULTS}}": "[Expected results here]",
            "{{TROUBLESHOOTING_TIPS}}": "[Troubleshooting tips here]"
        }
        
        content = template_content
        for placeholder, value in replacements.items():
            content = content.replace(placeholder, value)
        
        # メタデータを更新
        metadata_updates = {
            "id": prompt_id,
            "title": title,
            "category": category,
            "tags": tags,
            "author": author,
            "created": today,
            "updated": today,
            "description": description,
            "complexity": complexity
        }
        
        # ヘッダー部分を更新
        lines = content.split('\n')
        in_frontmatter = False
        frontmatter_end = 0
        
        for i, line in enumerate(lines):
            if line.strip() == '---':
                if not in_frontmatter:
                    in_frontmatter = True
                else:
                    frontmatter_end = i
                    break
        
        # フロントマターを再構築
        new_frontmatter = [
            "---",
            f"id: {prompt_id}",
            f"title: \"{title}\"",
            f"category: {category}",
            f"tags: {json.dumps(tags)}",
            f"version: 1.0.0",
            f"author: \"{author}\"",
            f"created: {today}",
            f"updated: {today}",
            f"description: \"{description}\"",
            "input_requirements:",
            "  - \"[入力要件を記述]\"",
            "output_format: \"[出力形式を記述]\"",
            "dependencies: []",
            "related_prompts: []",
            "---"
        ]
        
        # 新しいコンテンツを構築
        new_content = '\n'.join(new_frontmatter + lines[frontmatter_end + 1:])
        
        return {
            "id": prompt_id,
            "content": new_content,
            "metadata": metadata_updates
        }
    
    def save_prompt(self, prompt_data: Dict[str, Any]):
        """プロンプトをファイルに保存"""
        category = prompt_data["metadata"]["category"]
        filename = f"{prompt_data['id'].replace('-', '_')}.md"
        
        # カテゴリディレクトリを作成
        category_dir = self.categories_path / category
        category_dir.mkdir(parents=True, exist_ok=True)
        
        # ファイルに保存
        file_path = category_dir / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(prompt_data["content"])
        
        # インデックスを更新
        self.update_index(prompt_data["metadata"], str(file_path.relative_to(self.base_path)))
        
        print(f"プロンプトが作成されました: {file_path}")
        return file_path
    
    def update_index(self, metadata: Dict[str, Any], file_path: str):
        """インデックスを更新"""
        # 新しいエントリを追加
        new_entry = {
            **metadata,
            "path": file_path,
            "status": "active",
            "estimated_tokens": 500
        }
        
        self.index["prompts"].append(new_entry)
        
        # カテゴリ統計を更新
        category = metadata["category"]
        if category not in self.index["categories"]:
            self.index["categories"][category] = {
                "description": f"{category}関連プロンプト",
                "count": 0,
                "prompts": []
            }
        
        self.index["categories"][category]["count"] += 1
        self.index["categories"][category]["prompts"].append(metadata["id"])
        
        # 全体統計を更新
        self.index["stats"]["total_prompts"] = len(self.index["prompts"])
        self.index["stats"]["last_updated"] = datetime.now().strftime("%Y-%m-%d")
        
        # ファイルに保存
        with open(self.index_path, 'w', encoding='utf-8') as f:
            json.dump(self.index, f, ensure_ascii=False, indent=2)

def main():
    parser = argparse.ArgumentParser(description="プロンプト生成ツール")
    parser.add_argument("--title", "-t", required=True, help="プロンプトのタイトル")
    parser.add_argument("--category", "-c", required=True, 
                       choices=["analysis", "generation", "planning", "transformation", "troubleshooting"],
                       help="プロンプトのカテゴリ")
    parser.add_argument("--template", default="base", help="使用するテンプレート（デフォルト: base）")
    parser.add_argument("--tags", nargs="+", help="タグ（スペース区切り）")
    parser.add_argument("--author", default="System", help="作成者名")
    parser.add_argument("--description", default="", help="プロンプトの説明")
    parser.add_argument("--complexity", choices=["beginner", "intermediate", "advanced", "expert"],
                       default="intermediate", help="複雑度")
    
    args = parser.parse_args()
    
    generator = PromptGenerator()
    
    # プロンプトを生成
    prompt_data = generator.generate_prompt(
        title=args.title,
        category=args.category,
        template=args.template,
        tags=args.tags,
        author=args.author,
        description=args.description,
        complexity=args.complexity
    )
    
    # ファイルに保存
    generator.save_prompt(prompt_data)

if __name__ == "__main__":
    main()