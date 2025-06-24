#!/usr/bin/env python3
"""
Prompt Search Tool
プロンプト検索ツール
"""

import json
import argparse
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

class PromptSearcher:
    def __init__(self, base_path: str = None):
        if base_path is None:
            base_path = Path(__file__).parent.parent
        self.base_path = Path(base_path)
        self.index_path = self.base_path / "metadata" / "index.json"
        self.tags_path = self.base_path / "metadata" / "tags.json"
        
        self.load_metadata()
    
    def load_metadata(self):
        """メタデータをロード"""
        try:
            with open(self.index_path, 'r', encoding='utf-8') as f:
                self.index = json.load(f)
            with open(self.tags_path, 'r', encoding='utf-8') as f:
                self.tags_data = json.load(f)
        except FileNotFoundError as e:
            print(f"エラー: メタデータファイルが見つかりません: {e}")
            self.index = {"prompts": [], "categories": {}}
            self.tags_data = {"tag_categories": {}}
    
    def search_by_category(self, category: str) -> List[Dict[str, Any]]:
        """カテゴリで検索"""
        return [p for p in self.index["prompts"] if p["category"] == category]
    
    def search_by_tag(self, tag: str) -> List[Dict[str, Any]]:
        """タグで検索"""
        return [p for p in self.index["prompts"] if tag in p.get("tags", [])]
    
    def search_by_title(self, keyword: str) -> List[Dict[str, Any]]:
        """タイトルでキーワード検索"""
        keyword_lower = keyword.lower()
        return [p for p in self.index["prompts"] 
                if keyword_lower in p["title"].lower()]
    
    def search_by_complexity(self, level: str) -> List[Dict[str, Any]]:
        """複雑度で検索"""
        return [p for p in self.index["prompts"] 
                if p.get("complexity") == level]
    
    def advanced_search(self, 
                       category: Optional[str] = None,
                       tags: Optional[List[str]] = None,
                       title_keyword: Optional[str] = None,
                       complexity: Optional[str] = None,
                       author: Optional[str] = None) -> List[Dict[str, Any]]:
        """高度な検索"""
        results = self.index["prompts"]
        
        if category:
            results = [p for p in results if p["category"] == category]
        
        if tags:
            for tag in tags:
                results = [p for p in results if tag in p.get("tags", [])]
        
        if title_keyword:
            keyword_lower = title_keyword.lower()
            results = [p for p in results 
                      if keyword_lower in p["title"].lower()]
        
        if complexity:
            results = [p for p in results 
                      if p.get("complexity") == complexity]
        
        if author:
            results = [p for p in results if p.get("author") == author]
        
        return results
    
    def list_categories(self):
        """カテゴリ一覧を表示"""
        print("利用可能なカテゴリ:")
        for cat, info in self.index["categories"].items():
            print(f"  - {cat}: {info['description']} ({info['count']}件)")
    
    def list_tags(self):
        """タグ一覧を表示"""
        print("利用可能なタグ:")
        for cat_name, cat_info in self.tags_data["tag_categories"].items():
            print(f"\n{cat_name}:")
            for tag, desc in cat_info["tags"].items():
                print(f"  - {tag}: {desc}")
    
    def display_results(self, results: List[Dict[str, Any]]):
        """検索結果を表示"""
        if not results:
            print("該当するプロンプトが見つかりませんでした。")
            return
        
        print(f"\n検索結果: {len(results)}件")
        print("=" * 60)
        
        for prompt in results:
            print(f"ID: {prompt['id']}")
            print(f"タイトル: {prompt['title']}")
            print(f"カテゴリ: {prompt['category']}")
            print(f"タグ: {', '.join(prompt.get('tags', []))}")
            print(f"バージョン: {prompt['version']}")
            print(f"作成者: {prompt.get('author', 'Unknown')}")
            print(f"複雑度: {prompt.get('complexity', 'N/A')}")
            print(f"パス: {prompt['path']}")
            print("-" * 40)

def main():
    parser = argparse.ArgumentParser(description="プロンプト検索ツール")
    parser.add_argument("--category", "-c", help="カテゴリで検索")
    parser.add_argument("--tag", "-t", action="append", help="タグで検索（複数指定可）")
    parser.add_argument("--title", help="タイトルでキーワード検索")
    parser.add_argument("--complexity", choices=["beginner", "intermediate", "advanced", "expert"], 
                       help="複雑度で検索")
    parser.add_argument("--author", help="作成者で検索")
    parser.add_argument("--list-categories", action="store_true", help="カテゴリ一覧を表示")
    parser.add_argument("--list-tags", action="store_true", help="タグ一覧を表示")
    
    args = parser.parse_args()
    
    searcher = PromptSearcher()
    
    if args.list_categories:
        searcher.list_categories()
        return
    
    if args.list_tags:
        searcher.list_tags()
        return
    
    # 検索実行
    results = searcher.advanced_search(
        category=args.category,
        tags=args.tag,
        title_keyword=args.title,
        complexity=args.complexity,
        author=args.author
    )
    
    searcher.display_results(results)

if __name__ == "__main__":
    main()