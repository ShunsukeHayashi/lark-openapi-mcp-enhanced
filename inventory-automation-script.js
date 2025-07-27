// 在庫管理自動化スクリプト
// Lark Base内で実行可能なスクリプト例

const LEAD_TIME_DAYS = 9; // リードタイム（日）
const SAFETY_FACTORS = {
  'A': 1.5,
  'B': 2.0,
  'C': 2.5
};

// 商品カテゴリを判定する関数
function getProductCategory(monthlySales) {
  if (monthlySales >= 30) return 'A';
  if (monthlySales >= 10) return 'B';
  return 'C';
}

// 発注点を計算する関数
function calculateReorderPoint(dailySales, leadTime, safetyFactor) {
  const safetyStock = dailySales * safetyFactor * Math.sqrt(leadTime);
  const reorderPoint = (dailySales * leadTime) + safetyStock;
  return Math.ceil(reorderPoint);
}

// 発注数量を計算する関数
function calculateOrderQuantity(product) {
  const monthlyAvg = product['📈30日販売数 (数値)'] || 0;
  const currentStock = product['📊現在庫'] || 0;
  const pendingOrders = parseInt(product['📦発注残数 (数値)']?.[0]?.text || '0');
  
  // カテゴリ判定
  const category = getProductCategory(monthlyAvg);
  
  // 目標在庫月数
  const targetMonths = { 'A': 3, 'B': 2, 'C': 1 };
  
  // 発注数量 = 目標在庫 - 現在庫 - 発注残
  const targetStock = monthlyAvg * targetMonths[category];
  const orderQty = Math.max(0, targetStock - currentStock - pendingOrders);
  
  // 最小発注単位（仮に10単位）
  const minOrderUnit = 10;
  return Math.ceil(orderQty / minOrderUnit) * minOrderUnit;
}

// 在庫状態を評価する関数
function evaluateInventoryHealth(product) {
  const monthlySales = product['📈30日販売数 (数値)'] || 0;
  const currentStock = product['📊現在庫'] || 0;
  const dailySales = monthlySales / 30;
  
  if (dailySales === 0) {
    return currentStock > 50 ? '過剰在庫' : '適正';
  }
  
  const daysOfStock = currentStock / dailySales;
  
  if (daysOfStock < 7) return '緊急発注';
  if (daysOfStock < 14) return '要発注';
  if (daysOfStock < 30) return '発注準備';
  if (daysOfStock < 90) return '適正';
  if (daysOfStock < 180) return '過剰気味';
  return '過剰在庫';
}

// メイン処理
async function processInventoryManagement() {
  const alerts = {
    urgent: [],    // 緊急発注
    required: [],  // 要発注
    prepare: [],   // 発注準備
    excess: []     // 過剰在庫
  };
  
  // 全商品をループ処理
  const products = await getAllProducts(); // 実際のAPI呼び出しに置き換え
  
  for (const product of products) {
    const status = evaluateInventoryHealth(product);
    const productInfo = {
      name: product['📝商品名'][0].text,
      stock: product['📊現在庫'],
      sales: product['📈30日販売数 (数値)'],
      status: status,
      suggestedOrder: calculateOrderQuantity(product)
    };
    
    switch(status) {
      case '緊急発注':
        alerts.urgent.push(productInfo);
        break;
      case '要発注':
        alerts.required.push(productInfo);
        break;
      case '発注準備':
        alerts.prepare.push(productInfo);
        break;
      case '過剰在庫':
      case '過剰気味':
        alerts.excess.push(productInfo);
        break;
    }
  }
  
  return alerts;
}

// アラート通知関数
function sendInventoryAlerts(alerts) {
  const message = `
📊 在庫管理日次レポート ${new Date().toLocaleDateString('ja-JP')}

🚨 緊急発注 (${alerts.urgent.length}件)
${alerts.urgent.map(p => `・${p.name}: 在庫${p.stock}個, 推奨発注${p.suggestedOrder}個`).join('\\n')}

⚠️ 要発注 (${alerts.required.length}件)
${alerts.required.map(p => `・${p.name}: 在庫${p.stock}個, 推奨発注${p.suggestedOrder}個`).join('\\n')}

📋 発注準備 (${alerts.prepare.length}件)
${alerts.prepare.map(p => `・${p.name}: 在庫${p.stock}個`).join('\\n')}

📦 過剰在庫 (${alerts.excess.length}件)
${alerts.excess.map(p => `・${p.name}: 在庫${p.stock}個 (月販${p.sales}個)`).join('\\n')}
  `;
  
  // Larkメッセージ送信 or メール送信
  console.log(message);
  return message;
}

// 実行例
// processInventoryManagement().then(sendInventoryAlerts);