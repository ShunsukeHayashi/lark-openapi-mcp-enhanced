/**
 * 処理結果ハンドラー
 */

/**
 * 処理結果を取得（クライアントサイドから呼び出される）
 */
function getProcessingResult(recordId) {
  try {
    // まずLark Baseからレコードデータを取得
    const recordData = getRecordDetailsFromLark(recordId);
    
    // 最新の処理結果を取得
    const latestResult = getLatestProcessingResult(recordId);
    
    // 塗装見積もりの場合
    if (recordData['物件種別'] || recordData['塗装面積']) {
      const estimation = calculatePaintEstimation({
        inquiry_number: recordData['見積もり番号'] || recordId,
        customer_name: recordData['顧客名'],
        property_type: recordData['物件種別'],
        area_size: recordData['塗装面積'],
        paint_type: recordData['塗料種別'],
        budget_range: recordData['予算範囲'],
        special_requests: recordData['特記事項']
      });
      
      return {
        status: latestResult?.status || 'completed',
        inquiryNumber: recordData['見積もりID'] || recordId,
        processingTime: latestResult?.processingTime || 1000,
        processedBy: latestResult?.processedBy || 'システム',
        message: generateEstimationSummary(estimation),
        estimation: estimation,
        timeline: generateTimeline(recordData, latestResult)
      };
    }
    
    // 通常の問い合わせの場合
    return {
      status: latestResult?.status || 'completed',
      inquiryNumber: recordData['見積もりID'] || recordId,
      processingTime: latestResult?.processingTime || 1000,
      processedBy: latestResult?.processedBy || 'システム',
      message: latestResult?.message || recordData['AI提案内容'] || '処理が完了しました',
      result: latestResult?.result || {
        status: 'completed',
        message: '正常に処理されました'
      },
      timeline: generateTimeline(recordData, latestResult)
    };
    
  } catch (error) {
    console.error('Error getting processing result:', error);
    throw error;
  }
}

/**
 * 最新の処理結果を取得
 */
function getLatestProcessingResult(recordId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty('LOG_SPREADSHEET_ID')
    );
    
    const actionSheet = spreadsheet.getSheetByName('ボタンアクションログ');
    if (!actionSheet) return null;
    
    const data = actionSheet.getDataRange().getValues();
    const headers = data[0];
    const recordIdIndex = headers.indexOf('レコードID');
    
    // 該当レコードの最新ログを探す
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][recordIdIndex] === recordId) {
        return {
          status: data[i][headers.indexOf('結果')],
          processingTime: data[i][headers.indexOf('処理時間(ms)')],
          processedBy: data[i][headers.indexOf('実行者')],
          message: data[i][headers.indexOf('詳細')]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting latest processing result:', error);
    return null;
  }
}

/**
 * タイムラインを生成
 */
function generateTimeline(recordData, processingResult) {
  const timeline = [];
  
  // 作成時刻
  if (recordData['作成日時'] || recordData['Created time']) {
    timeline.push({
      time: recordData['作成日時'] || recordData['Created time'],
      action: 'フォーム送信',
      icon: '📝'
    });
  }
  
  // 処理開始時刻
  if (recordData['処理開始時刻']) {
    timeline.push({
      time: recordData['処理開始時刻'],
      action: '処理開始',
      icon: '▶️'
    });
  }
  
  // ステータスに応じたアクション
  const status = processingResult?.status || recordData['処理ステータス'];
  if (status === 'escalated') {
    timeline.push({
      time: new Date(),
      action: '管理者へエスカレーション',
      icon: '⚡'
    });
  } else if (status === 'auto_responded') {
    timeline.push({
      time: new Date(),
      action: '自動返信送信',
      icon: '📧'
    });
  } else if (status === 'queued') {
    timeline.push({
      time: new Date(),
      action: 'キューに追加',
      icon: '📋'
    });
  }
  
  // 処理完了時刻
  if (recordData['処理完了時刻']) {
    timeline.push({
      time: recordData['処理完了時刻'],
      action: '処理完了',
      icon: '✅'
    });
  }
  
  return timeline;
}

/**
 * 見積もり結果をHTMLフォーマットで返す
 */
function formatEstimationResult(estimation) {
  let html = '<div class="estimation-result">';
  
  // 見積もり概要
  html += '<h3>見積もり金額</h3>';
  html += `<div class="total-amount">¥${estimation.total.toLocaleString()}</div>`;
  
  // 内訳
  html += '<h4>内訳</h4>';
  html += '<table class="breakdown-table">';
  Object.values(estimation.breakdown).forEach(item => {
    html += `
      <tr>
        <td>${item.label}</td>
        <td style="text-align: right;">¥${item.amount.toLocaleString()}</td>
      </tr>
    `;
  });
  html += `
    <tr class="subtotal-row">
      <td>小計</td>
      <td style="text-align: right;">¥${estimation.subtotal.toLocaleString()}</td>
    </tr>
    <tr>
      <td>消費税</td>
      <td style="text-align: right;">¥${estimation.tax.toLocaleString()}</td>
    </tr>
    <tr class="total-row">
      <td><strong>合計</strong></td>
      <td style="text-align: right;"><strong>¥${estimation.total.toLocaleString()}</strong></td>
    </tr>
  `;
  html += '</table>';
  
  // 予算分析
  if (estimation.budgetAnalysis) {
    html += '<h4>予算との比較</h4>';
    html += '<div class="budget-analysis">';
    html += `<p>お客様の予算: ${estimation.budgetAnalysis.customerBudget}</p>`;
    if (estimation.budgetAnalysis.withinBudget) {
      html += '<p class="within-budget">✅ 予算内に収まっています</p>';
    } else {
      html += `<p class="over-budget">⚠️ 予算を${Math.round(estimation.budgetAnalysis.difference / 10000)}万円超過しています</p>`;
      
      if (estimation.alternatives) {
        html += '<h5>コスト削減案</h5>';
        html += '<ul>';
        estimation.alternatives.forEach(alt => {
          html += `<li>${alt.description} - 約${Math.round(alt.estimatedSaving / 10000)}万円削減</li>`;
        });
        html += '</ul>';
      }
    }
    html += '</div>';
  }
  
  // 注記
  if (estimation.notes && estimation.notes.length > 0) {
    html += '<h4>備考</h4>';
    html += '<ul class="notes">';
    estimation.notes.forEach(note => {
      html += `<li>${note}</li>`;
    });
    html += '</ul>';
  }
  
  html += '</div>';
  
  return html;
}