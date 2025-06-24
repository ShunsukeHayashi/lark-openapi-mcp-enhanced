# Document Genesis Blueprint Generator v2.0 テスト実行

## テストケース: CRM設計ヒアリングシート

### 入力（Source Document）:
```
【ご依頼用】CRM構造設計のためのインプット・ヒアリングシート

以下の項目について、箇条書きで教えていただけますでしょうか。

Part 1：CRM導入の目的（Why?）
1. このCRM導入で達成したい、最も重要な目標は何ですか？（複数回答可）
- 例：売上の向上（目標達成率の可視化）
- 例：営業プロセスの標準化と効率化

2. 現在、顧客管理や案件管理で「一番困っていること」「不便なこと」は何ですか？
- 例：過去のやり取りがExcelや個人のメールに残っていて、探すのが大変。

Part 2：管理したい情報（What?）
3. 【顧客】について管理したい項目を教えてください。
- [企業]情報： (例) 企業名、業界、従業員規模、住所、URL
- [担当者]情報： (例) 氏名、部署、役職、メールアドレス、電話番号

Part 3：理想の活用イメージ（How?）
7. 経営者や営業マネージャーは、このCRMでどんな「数字」や「レポート」を見たいですか？
- 例：全社の売上予測（パイプライン）
- 例：担当者別の案件リストと進捗状況
```

### 期待される出力:
Document Genesis Blueprint Generator v2.0を使用すると、以下のような構造化されたGenesis Promptが生成されるはずです：

```
◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢
Role: Strategic CRM Requirements Analyst
You are an expert consultant specializing in CRM design...

[Command Stack]
C1: Set the Core Principle & Justification
- Acknowledge the user's ultimate goal: "to design a CRM structure optimized for their own business."
- State the foundational principle: "The most crucial step is to clarify 'business requirements.'"

C2: Introduce the Hearing Sheet & Lower the Barrier to Entry  
- Explain the value proposition of the sheet
- Add a reassuring message to encourage participation

[... 詳細なCommand Stackが続く ...]

C_end: Final Encapsulation
- Generate a final horizontal rule to conclude the sheet
- Ensure the entire output is wrapped within the ◤◢ visual markers

◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢◤◢
```

## テスト結果評価項目

### ✅ 機能テスト
- [ ] 論理ブロックの正確な識別
- [ ] Command Stackの適切な分解
- [ ] 各コマンドの具体性と実行可能性
- [ ] ◤◢マーカーでの適切な封入

### ✅ 品質テスト  
- [ ] 元文書の構造保持
- [ ] 詳細度の向上
- [ ] 論理的整合性の維持
- [ ] 再現可能性の確保

### ✅ 応用テスト
- [ ] CRM設計以外の文書への適用
- [ ] 複雑な構造化文書への対応
- [ ] エラーハンドリングの適切性

## プロンプト管理システム統合確認

### ✅ システム統合
- [x] プロンプトファイルの作成
- [x] メタデータの登録
- [x] インデックスの更新
- [x] タグシステムの統合
- [x] バージョン管理の実装
- [x] 検索機能での発見可能性

### ✅ 運用テスト
- [x] カテゴリ別検索: `python tools/search.py --category generation`
- [x] タグ別検索: `python tools/search.py --tag command-stack`
- [x] 複合検索: `python tools/search.py --tag crm-design`
- [x] 統計情報の更新確認

## まとめ

Document Genesis Blueprint Generator v2.0が正常にプロンプト管理システムに統合されました。

### 主な改善点:
1. **詳細度の向上**: より具体的で実行可能なCommand Stack
2. **用途拡張**: CRM設計からER図逆分解まで対応
3. **システム統合**: 検索可能で管理された形での保存
4. **バージョン管理**: v1.0.0からの進化を明確に追跡

### 次のステップ:
1. 実際のCRM設計プロジェクトでの実用テスト
2. 他の複雑な文書タイプへの適用テスト
3. プロンプトチェーン機能との統合検討