# Web Interface for Prompt Management System

## 概要
プロンプト管理システム用のWebインターフェース。プロンプトの管理、チェーンの実行、統計の確認などをブラウザから操作可能。

## 技術スタック
- **Frontend**: React + TypeScript
- **Backend**: FastAPI (Python)
- **Database**: SQLite (開発) / PostgreSQL (本番)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API**: RESTful API + WebSocket (リアルタイム更新)

## ディレクトリ構成
```
web-interface/
├── README.md
├── frontend/                   # React フロントエンド
│   ├── public/
│   ├── src/
│   │   ├── components/         # UI コンポーネント
│   │   │   ├── PromptManager/  # プロンプト管理画面
│   │   │   ├── ChainBuilder/   # チェーン構築画面
│   │   │   ├── Dashboard/      # ダッシュボード
│   │   │   └── common/         # 共通コンポーネント
│   │   ├── hooks/              # カスタムフック
│   │   ├── services/           # API クライアント
│   │   ├── stores/             # 状態管理
│   │   ├── types/              # TypeScript 型定義
│   │   └── utils/              # ユーティリティ
│   ├── package.json
│   └── tailwind.config.js
├── backend/                    # FastAPI バックエンド
│   ├── app/
│   │   ├── api/                # API エンドポイント
│   │   │   ├── prompts.py      # プロンプト API
│   │   │   ├── chains.py       # チェーン API
│   │   │   ├── executions.py   # 実行履歴 API
│   │   │   └── stats.py        # 統計 API
│   │   ├── core/               # コア機能
│   │   │   ├── config.py       # 設定
│   │   │   ├── database.py     # DB 接続
│   │   │   └── security.py     # 認証・認可
│   │   ├── models/             # データモデル
│   │   ├── services/           # ビジネスロジック
│   │   └── main.py             # アプリエントリポイント
│   ├── requirements.txt
│   └── alembic/                # DB マイグレーション
└── docker/                     # Docker 設定
    ├── Dockerfile.frontend
    ├── Dockerfile.backend
    └── docker-compose.yml
```

## 主要機能

### 1. プロンプト管理画面
```typescript
interface PromptManagerProps {
  prompts: Prompt[];
  categories: Category[];
  tags: Tag[];
}

function PromptManager({ prompts, categories, tags }: PromptManagerProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});

  return (
    <div className="prompt-manager">
      {/* 検索・フィルター */}
      <SearchAndFilter
        query={searchQuery}
        onQueryChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        tags={tags}
      />
      
      {/* プロンプト一覧 */}
      <PromptGrid
        prompts={filteredPrompts}
        onSelect={setSelectedPrompt}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
      
      {/* プロンプト詳細 */}
      {selectedPrompt && (
        <PromptDetail
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
```

### 2. チェーンビルダー画面
```typescript
interface ChainBuilderProps {
  availablePrompts: Prompt[];
}

function ChainBuilder({ availablePrompts }: ChainBuilderProps) {
  const [chain, setChain] = useState<Chain>({
    steps: [],
    config: defaultConfig
  });

  return (
    <div className="chain-builder">
      {/* チェーン設定 */}
      <ChainConfig
        config={chain.config}
        onChange={(config) => setChain({...chain, config})}
      />
      
      {/* ステップエディター */}
      <StepEditor
        steps={chain.steps}
        availablePrompts={availablePrompts}
        onStepsChange={(steps) => setChain({...chain, steps})}
      />
      
      {/* フローチャート表示 */}
      <ChainFlowChart
        steps={chain.steps}
        onStepSelect={handleStepSelect}
      />
      
      {/* 実行ボタン */}
      <ExecutionPanel
        chain={chain}
        onExecute={handleExecute}
        onSave={handleSave}
      />
    </div>
  );
}
```

### 3. ダッシュボード
```typescript
function Dashboard() {
  const { data: stats } = useStats();
  const { data: recentExecutions } = useRecentExecutions();

  return (
    <div className="dashboard">
      {/* 統計カード */}
      <div className="stats-grid">
        <StatCard
          title="総プロンプト数"
          value={stats?.totalPrompts}
          trend={stats?.promptsTrend}
        />
        <StatCard
          title="実行回数（今月）"
          value={stats?.monthlyExecutions}
          trend={stats?.executionsTrend}
        />
        <StatCard
          title="成功率"
          value={`${stats?.successRate}%`}
          trend={stats?.successRateTrend}
        />
      </div>
      
      {/* チャート */}
      <div className="charts-section">
        <ExecutionChart data={stats?.executionHistory} />
        <PopularPromptsChart data={stats?.popularPrompts} />
      </div>
      
      {/* 最近の実行 */}
      <RecentExecutions executions={recentExecutions} />
    </div>
  );
}
```

## API エンドポイント

### プロンプト管理
```python
# backend/app/api/prompts.py
from fastapi import APIRouter, Depends, HTTPException
from app.services.prompt_service import PromptService

router = APIRouter()

@router.get("/prompts")
async def list_prompts(
    category: str = None,
    tags: list[str] = Query(None),
    search: str = None,
    limit: int = 50,
    offset: int = 0,
    service: PromptService = Depends()
):
    return await service.search_prompts(
        category=category,
        tags=tags,
        search=search,
        limit=limit,
        offset=offset
    )

@router.post("/prompts")
async def create_prompt(
    prompt: PromptCreate,
    service: PromptService = Depends()
):
    return await service.create_prompt(prompt)

@router.put("/prompts/{prompt_id}")
async def update_prompt(
    prompt_id: str,
    prompt: PromptUpdate,
    service: PromptService = Depends()
):
    return await service.update_prompt(prompt_id, prompt)

@router.delete("/prompts/{prompt_id}")
async def delete_prompt(
    prompt_id: str,
    service: PromptService = Depends()
):
    return await service.delete_prompt(prompt_id)
```

### チェーン実行
```python
# backend/app/api/chains.py
@router.post("/chains/{chain_id}/execute")
async def execute_chain(
    chain_id: str,
    input_data: dict,
    background_tasks: BackgroundTasks,
    service: ChainService = Depends()
):
    execution_id = await service.start_execution(chain_id, input_data)
    
    # バックグラウンドで実行
    background_tasks.add_task(service.execute_chain, execution_id)
    
    return {"execution_id": execution_id, "status": "started"}

@router.get("/executions/{execution_id}")
async def get_execution_status(
    execution_id: str,
    service: ChainService = Depends()
):
    return await service.get_execution_status(execution_id)

@router.websocket("/executions/{execution_id}/ws")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: str
):
    await websocket.accept()
    
    # リアルタイム進捗更新
    async for update in service.get_execution_updates(execution_id):
        await websocket.send_json(update)
```

## セットアップ・実行

### 開発環境
```bash
# バックエンド
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# フロントエンド
cd frontend
npm install
npm start
```

### 本番環境（Docker）
```bash
# 全体ビルド・起動
docker-compose up --build

# 個別サービス
docker-compose up backend
docker-compose up frontend
```

## 設定ファイル例

### Frontend (.env)
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_WS_BASE_URL=ws://localhost:8000
REACT_APP_MCP_INTEGRATION=true
```

### Backend (.env)
```env
DATABASE_URL=sqlite:///./prompt_management.db
SECRET_KEY=your-secret-key
MCP_CONFIG_PATH=../config.json
LARK_WEBHOOK_SECRET=your-webhook-secret
```

## 今後の機能拡張

### Phase 1 (基本機能)
- [ ] プロンプト CRUD 操作
- [ ] 基本的な検索・フィルター
- [ ] シンプルなチェーン実行
- [ ] 基本統計表示

### Phase 2 (高度機能)
- [ ] ビジュアルチェーンエディター
- [ ] リアルタイム実行監視
- [ ] プロンプトバージョン管理
- [ ] チーム機能・権限管理

### Phase 3 (AI統合)
- [ ] プロンプト品質分析
- [ ] 自動最適化提案
- [ ] パフォーマンス予測
- [ ] インテリジェント検索

この Web インターフェースにより、プロンプト管理システムが格段に使いやすくなり、チーム全体での活用が促進されます！