import { http, Request, Response } from '@google-cloud/functions-framework';
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

// HTTPリクエストに応じてHTMLを生成する
http('viewEmergencyOrderDashboard', async (req: Request, res: Response) => {
  try {
    // 1. Firestoreからキャッシュされたデータを取得
    const cacheDoc = await firestore.collection('emergency_order_cache').doc('summary').get();
    if (!cacheDoc.exists) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <title>緊急注文対応ダッシュボード - データ未更新</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin-top: 100px; }
            .error { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1 class="error">データがまだ更新されていません</h1>
          <p>次回の自動更新をお待ちください。</p>
        </body>
        </html>
      `);
      return;
    }
    
    const data = cacheDoc.data() || {};
    const {
      totalProducts = 0,
      emergencyCount = 0,
      stockoutGroups = {},
      pendingOrdersCount = 0,
      topSellers = [],
      criticalProducts = [],
      lastUpdated = ''
    } = data;

    // 2. 緊急度別の色設定
    const getUrgencyColor = (days: number) => {
      if (days <= 7) return '#dc3545';  // 危険（赤）
      if (days <= 14) return '#fd7e14'; // 警告（オレンジ）
      if (days <= 30) return '#ffc107'; // 注意（黄）
      return '#28a745'; // 安全（緑）
    };

    // 3. 取得したデータを使ってHTMLを動的に生成
    const html = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚨 緊急注文対応ダッシュボード</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container { max-width: 1400px; margin: 0 auto; }
          h1 { 
            color: #212529;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .last-update { 
            color: #6c757d; 
            font-size: 0.9rem; 
            margin-bottom: 30px;
          }
          .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          .metric-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .metric-title {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 8px;
          }
          .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #212529;
          }
          .emergency { color: #dc3545; }
          .warning { color: #fd7e14; }
          .charts {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .chart-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .chart-container h2 {
            font-size: 1.25rem;
            margin-bottom: 20px;
            color: #212529;
          }
          .critical-table {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
          }
          th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 500;
          }
          .badge-danger { background-color: #dc3545; color: white; }
          .badge-warning { background-color: #fd7e14; color: white; }
          @media (max-width: 768px) {
            .charts { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚨 緊急注文対応ダッシュボード</h1>
          <div class="last-update">最終更新: ${new Date(lastUpdated).toLocaleString('ja-JP')}</div>

          <!-- 主要指標 -->
          <div class="metrics">
            <div class="metric-card">
              <div class="metric-title">総商品数</div>
              <div class="metric-value">${totalProducts.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">緊急発注商品</div>
              <div class="metric-value emergency">${emergencyCount.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">発注待ち商品</div>
              <div class="metric-value warning">${pendingOrdersCount.toLocaleString()}</div>
            </div>
            <div class="metric-card">
              <div class="metric-title">7日以内に在庫切れ</div>
              <div class="metric-value emergency">${(stockoutGroups.critical_7days || 0).toLocaleString()}</div>
            </div>
          </div>

          <!-- チャート -->
          <div class="charts">
            <div class="chart-container">
              <h2>在庫切れ予測分布</h2>
              <canvas id="stockoutChart"></canvas>
            </div>
            <div class="chart-container">
              <h2>売上TOP10商品</h2>
              <canvas id="topSellersChart"></canvas>
            </div>
          </div>

          <!-- 緊急対応商品リスト -->
          <div class="critical-table">
            <h2>⚠️ 緊急対応が必要な商品（7日以内に在庫切れ）</h2>
            <table>
              <thead>
                <tr>
                  <th>商品名</th>
                  <th>在庫切れまで</th>
                  <th>現在庫数</th>
                  <th>発注残数</th>
                  <th>30日販売数</th>
                  <th>ステータス</th>
                </tr>
              </thead>
              <tbody>
                ${criticalProducts.map((product: any) => `
                  <tr>
                    <td><strong>${product.name}</strong></td>
                    <td><span class="badge badge-danger">${product.stockoutDays}日</span></td>
                    <td>${product.currentStock.toLocaleString()}</td>
                    <td>${product.orderRemaining > 0 ? 
                      `<span class="badge badge-warning">${product.orderRemaining.toLocaleString()}</span>` : 
                      '-'}</td>
                    <td>${product.sales30Days.toLocaleString()}</td>
                    <td>${product.stockoutDays <= 3 ? 
                      '<span class="badge badge-danger">至急対応</span>' : 
                      '<span class="badge badge-warning">要対応</span>'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <script>
          // 在庫切れ予測分布チャート
          const stockoutData = ${JSON.stringify(stockoutGroups)};
          new Chart(document.getElementById('stockoutChart'), {
            type: 'doughnut',
            data: {
              labels: ['7日以内', '14日以内', '30日以内', '30日以上'],
              datasets: [{
                data: [
                  stockoutData.critical_7days || 0,
                  stockoutData.warning_14days || 0,
                  stockoutData.caution_30days || 0,
                  stockoutData.normal || 0
                ],
                backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745']
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              }
            }
          });

          // 売上TOP10チャート
          const topSellersData = ${JSON.stringify(topSellers)};
          new Chart(document.getElementById('topSellersChart'), {
            type: 'bar',
            data: {
              labels: topSellersData.map(p => p.name),
              datasets: [{
                label: '30日販売数',
                data: topSellersData.map(p => p.sales),
                backgroundColor: topSellersData.map(p => 
                  p.stockoutDays <= 7 ? '#dc3545' : 
                  p.stockoutDays <= 14 ? '#fd7e14' : 
                  p.stockoutDays <= 30 ? '#ffc107' : '#0d6efd'
                )
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    afterLabel: (context) => {
                      const product = topSellersData[context.dataIndex];
                      return \`在庫: \${product.stock} | 在庫切れ予測: \${product.stockoutDays}日\`;
                    }
                  }
                }
              }
            }
          });
        </script>
      </body>
      </html>
    `;

    // 3. HTMLをレスポンスとして返す
    res.status(200).type('text/html').send(html);
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>エラー</title>
        <style>
          body { font-family: sans-serif; text-align: center; margin-top: 100px; }
          .error { color: #dc3545; }
        </style>
      </head>
      <body>
        <h1 class="error">ダッシュボードの生成中にエラーが発生しました</h1>
        <p>しばらく時間をおいてから再度お試しください。</p>
      </body>
      </html>
    `);
  }
});