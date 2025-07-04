// Mobi AI Master統合ツール
export { mobiVideoTools } from './video-data-extractor';
export { mobiKOLTools } from './kol-sync';

// 全ツールをまとめてエクスポート
import { mobiVideoTools } from './video-data-extractor';
import { mobiKOLTools } from './kol-sync';

export const mobiTools = [
  ...mobiVideoTools,
  ...mobiKOLTools
];

// ツール名の型定義
export type MobiToolName = 
  | 'mobi.builtin.video.extract'
  | 'mobi.builtin.kol.sync'
  | 'mobi.builtin.kol.batch_sync';