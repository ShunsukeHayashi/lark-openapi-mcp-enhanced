#!/bin/bash

# GitHub Issues Creation Script for lark-openapi-mcp-enhanced
# This script creates issues using GitHub API

REPO="ShunsukeHayashi/lark-openapi-mcp-enhanced"
TOKEN=$(git remote get-url origin | grep -oP 'github_pat_[^@]+')

if [ -z "$TOKEN" ]; then
    echo "Error: GitHub token not found in remote URL"
    exit 1
fi

echo "Creating GitHub Issues for repository improvements..."

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    
    echo "Creating issue: $title"
    
    response=$(curl -s -X POST \
        -H "Authorization: token $TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/$REPO/issues \
        -d @- <<EOF
{
  "title": "$title",
  "body": "$body",
  "labels": [$labels]
}
EOF
    )
    
    issue_number=$(echo "$response" | grep -oP '"number":\s*\K\d+' | head -1)
    if [ -n "$issue_number" ]; then
        echo "✅ Created issue #$issue_number: $title"
    else
        echo "❌ Failed to create issue: $title"
        echo "Response: $response"
    fi
    
    # Add delay to avoid rate limiting
    sleep 2
}

# Issue #1: TypeScript Compilation Errors
create_issue \
"Fix TypeScript compilation errors blocking build" \
"## 問題の説明
現在、複数のTypeScriptコンパイルエラーによりビルドが失敗しています。

### エラー箇所
- Discord統合ツール: \`discord.js\`依存関係が不足
- Mobi統合ツール: モジュールが見つからない  
- Webhookハンドラー: 型の不一致

### 対応案
1. \`discord.js\`を依存関係に追加するか、Discord機能を削除
2. Mobi統合を修正または削除
3. 型定義を修正

### 影響
- ビルドが完全にブロックされている
- CI/CDパイプラインが機能しない" \
'"bug", "build", "critical"'

# Issue #2: Test Timeout
create_issue \
"Fix test timeout issues - tests hanging after 2 minutes" \
"## 問題の説明
現在、テストスイートが2分後にタイムアウトしており、CI/CDパイプラインに影響を与えています。

### 調査項目
- 統合テストの実行時間
- テストのクリーンアップ処理
- 非同期処理の適切な完了待機

### 対応案
1. 個別のテストにタイムアウトを設定
2. 長時間実行テストを別のスイートに分離
3. テストの並列実行を検討" \
'"bug", "testing", "high-priority"'

# Issue #3: Disabled AI Features
create_issue \
"Complete or remove disabled AI-enhanced coordinator features" \
"## 問題の説明
以下のファイルが \`.disabled\` 拡張子で無効化されています：
- \`/src/agents/ai-enhanced-coordinator.ts.disabled\`
- \`/src/agents/examples/ai-coordinator-example.ts.disabled\`

### 対応案
1. 機能を完成させて有効化
2. または、不要な場合は削除
3. 関連ドキュメントの更新" \
'"enhancement", "cleanup", "high-priority"'

# Issue #4: Discord Integration Dependencies
create_issue \
"Add missing discord.js dependency for Discord integration tools" \
"## 問題の説明
Discord統合ツールがコードに含まれていますが、\`discord.js\`が依存関係にありません。

### 対応案
1. \`package.json\`に\`discord.js\`を追加
2. Discord統合のドキュメントを作成
3. 使用例を追加" \
'"bug", "dependencies", "medium-priority"'

# Issue #5: Error Handling Improvements
create_issue \
"Improve error handling consistency across tools" \
"## 問題の説明
ツール間でエラーハンドリングの形式が統一されていません。

### 改善点
- MCP標準のエラーレスポンス形式に統一
- 非同期関数のエラーハンドリング追加
- エラーメッセージの国際化対応" \
'"enhancement", "code-quality", "medium-priority"'

# Issue #6: Security Enhancement
create_issue \
"Enhance security for token management and storage" \
"## 問題の説明
トークン管理とストレージのセキュリティを強化する必要があります。

### 提案
1. トークンローテーション戦略の実装
2. セキュリティベストプラクティスのドキュメント作成
3. 環境変数の安全な管理方法の文書化" \
'"security", "enhancement", "medium-priority"'

# Issue #7: Documentation
create_issue \
"Add comprehensive documentation for integrations and troubleshooting" \
"## 問題の説明
以下の機能のドキュメントが不足しています：
- Discord統合のセットアップ
- Mobi ツールの使用方法
- Webhookサーバーの設定
- TypeScriptエラーのトラブルシューティング" \
'"documentation", "good-first-issue"'

# Issue #8: Performance Optimization
create_issue \
"Add caching mechanism for frequently accessed Lark API data" \
"## 問題の説明
頻繁にアクセスされるLark APIデータのキャッシュメカニズムを追加して、パフォーマンスを向上させます。

### 提案
1. Redisまたはインメモリキャッシュの実装
2. キャッシュ無効化戦略の設計
3. レート制限の高度化" \
'"enhancement", "performance"'

# Issue #9: API Limitations Documentation
create_issue \
"Document known Lark API limitations and workarounds" \
"## 問題の説明
既知のLark API制限事項を明確に文書化：
- リンクフィールドのプログラマティックな作成不可
- リレーションシップフィールドの手動設定要件" \
'"documentation"'

echo ""
echo "✨ All issues have been created!"
echo "Visit https://github.com/$REPO/issues to view them."