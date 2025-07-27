/**
 * 塗装見積もり処理ハンドラー
 */

/**
 * 塗装見積もりを処理
 */
function processPaintEstimation(recordData, priority) {
  console.log('Processing paint estimation:', JSON.stringify(recordData));
  
  const estimation = calculatePaintEstimation(recordData);
  const result = {
    status: 'completed',
    estimationType: 'paint_estimation',
    priority: priority,
    estimation: estimation
  };
  
  // 優先度に応じた処理
  if (priority === 'high') {
    // 即座に見積もりを作成して送信
    result.message = '緊急見積もりを作成しました';
    result.immediateAction = true;
    
    // 見積もりPDFを生成（実装例）
    // const pdfUrl = generateEstimationPDF(estimation);
    // sendEstimationEmail(recordData.email, pdfUrl);
    
  } else if (priority === 'medium') {
    // 24時間以内に見積もり送信
    result.message = '見積もりを作成中です（1営業日以内）';
    result.estimatedDelivery = '24時間以内';
    
  } else {
    // 通常の見積もりプロセス
    result.message = '見積もりリクエストを受け付けました（3営業日以内）';
    result.estimatedDelivery = '3営業日以内';
  }
  
  return result;
}

/**
 * 塗装見積もりを計算
 * @param {Object} data - 入力データ
 * @returns {Object} 見積もり結果
 */
function calculatePaintEstimation(data) {
  try {
    // 入力データのバリデーション
    validateEstimationInput(data);
    
    // 基本情報を取得し数値を正規化
    const areaSize = parseAndValidateArea(data['施工面積㎡']);
    const paintType = data['希望塗料'] || 'シリコン塗料';
    const propertyType = data['塗装タイプ'] || '外壁塗装';
    
    console.log('Calculating estimation for:', {
      areaSize,
      paintType,
      propertyType
    });
  
  // 塗料単価（円/㎡）
  const paintPrices = {
    'アクリル塗料': 1500,
    'ウレタン塗料': 2000,
    'シリコン塗料': 2500,
    'フッ素塗料': 3500,
    '無機塗料': 4500
  };
  
  // 物件タイプ別の係数
  const propertyFactors = {
    '戸建て': 1.0,
    'マンション': 0.9,
    '商業施設': 1.2,
    '工場': 1.3
  };
  
  const basePricePerSqm = paintPrices[paintType] || 2500;
  const propertyFactor = propertyFactors[propertyType] || 1.0;
  
  // 見積もり計算
  const paintCost = Math.round(areaSize * basePricePerSqm * propertyFactor);
  const laborCost = Math.round(paintCost * 0.6); // 人件費は材料費の60%
  const scaffoldingCost = Math.round(areaSize * 800); // 足場代
  const miscCost = Math.round((paintCost + laborCost) * 0.1); // 諸経費10%
  
  const subtotal = paintCost + laborCost + scaffoldingCost + miscCost;
  const tax = Math.round(subtotal * 0.1); // 消費税10%
  const total = subtotal + tax;
  
  // 見積もり詳細
  const estimation = {
    inquiryNumber: data['見積もりID'],
    customerName: data['お名前'],
    companyName: data['会社名'],
    propertyType: propertyType,
    areaSize: areaSize,
    paintType: paintType,
    breakdown: {
      paintCost: {
        label: '塗料費',
        amount: paintCost,
        calculation: `${areaSize}㎡ × ${basePricePerSqm}円/㎡ × ${propertyFactor}`
      },
      laborCost: {
        label: '施工費',
        amount: laborCost,
        calculation: '塗料費の60%'
      },
      scaffoldingCost: {
        label: '足場費用',
        amount: scaffoldingCost,
        calculation: `${areaSize}㎡ × 800円/㎡`
      },
      miscCost: {
        label: '諸経費',
        amount: miscCost,
        calculation: '(塗料費+施工費)の10%'
      }
    },
    subtotal: subtotal,
    tax: tax,
    total: total,
    notes: [
      '本見積もりは概算です。正確な金額は現地調査後に確定します。',
      '有効期限：見積もり日より30日間',
      data['その他要望'] ? `特記事項: ${data['その他要望']}` : null
    ].filter(Boolean),
    createdAt: new Date().toISOString()
  };
  
  // 予算範囲との比較
  if (data['その他要望'] && data['その他要望'].includes('予算')) {
    const budgetMatch = data['その他要望'].match(/(\d+)[\-~](\d+)/);
    if (budgetMatch) {
      const minBudget = parseInt(budgetMatch[1]) * 10000;
      const maxBudget = parseInt(budgetMatch[2]) * 10000;
      
      estimation.budgetAnalysis = {
        customerBudget: data['その他要望'],
        minBudget: minBudget,
        maxBudget: maxBudget,
        withinBudget: total >= minBudget && total <= maxBudget,
        difference: total - maxBudget
      };
      
      if (!estimation.budgetAnalysis.withinBudget) {
        estimation.notes.push(`※予算オーバー: ${Math.round(estimation.budgetAnalysis.difference / 10000)}万円超過`);
        estimation.alternatives = generateAlternatives(data, total, maxBudget);
      }
    }
  }
  
  return estimation;
    
  } catch (error) {
    console.error('Error in calculatePaintEstimation:', error);
    
    // エラー時のフォールバック見積もり
    return createFallbackEstimation(data, error);
  }
}

/**
 * 入力データのバリデーション
 * @param {Object} data - 入力データ
 */
function validateEstimationInput(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input data for estimation');
  }
  
  const requiredFields = ['施工面積㎡', '希望塗料', '塗装タイプ'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    console.warn('Missing fields for estimation:', missingFields);
    // 警告のみでエラーにはしない（フォールバックで処理）
  }
}

/**
 * 面積のパースとバリデーション
 * @param {string|number} areaInput - 面積入力値
 * @returns {number} 正規化された面積
 */
function parseAndValidateArea(areaInput) {
  if (!areaInput) {
    console.warn('No area provided, using default 100');
    return 100;
  }
  
  // 文字列から数値を抽出（「120㎡」から「120」を抽出）
  const numericValue = typeof areaInput === 'string' ? 
    parseFloat(areaInput.replace(/[^\d.]/g, '')) : 
    parseFloat(areaInput);
  
  if (isNaN(numericValue) || numericValue <= 0) {
    console.warn('Invalid area value:', areaInput, 'using default 100');
    return 100;
  }
  
  if (numericValue > 10000) {
    console.warn('Area seems too large:', numericValue, 'capping at 10000');
    return 10000;
  }
  
  return numericValue;
}

/**
 * エラー時のフォールバック見積もり
 * @param {Object} data - 入力データ
 * @param {Error} error - 発生したエラー
 * @returns {Object} フォールバック見積もり
 */
function createFallbackEstimation(data, error) {
  const defaultArea = 100;
  const defaultPaintType = 'シリコン塗料';
  const defaultTotal = 300000; // デフォルトの見積もり金額
  
  return {
    inquiryNumber: data['見積もりID'] || 'FALLBACK-' + Date.now(),
    customerName: data['お名前'] || 'お客様',
    companyName: data['会社名'] || '',
    propertyType: data['塗装タイプ'] || '外壁塗装',
    areaSize: defaultArea,
    paintType: defaultPaintType,
    total: defaultTotal,
    breakdown: {
      paintCost: { label: '塗料費(概算)', amount: Math.round(defaultTotal * 0.4) },
      laborCost: { label: '施工費(概算)', amount: Math.round(defaultTotal * 0.35) },
      scaffoldingCost: { label: '足場費用(概算)', amount: Math.round(defaultTotal * 0.15) },
      miscCost: { label: '諸経費(概算)', amount: Math.round(defaultTotal * 0.1) }
    },
    notes: [
      '※ こちらは概算見積もりです。',
      '※ エラーが発生したため、標準的な金額で表示しています。',
      '※ 正確な見積もりは現地調査後にご提示いたします。'
    ],
    error: {
      occurred: true,
      message: error.message,
      fallbackUsed: true
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * 予算内に収める代替案を生成
 */
function generateAlternatives(data, currentTotal, maxBudget) {
  const alternatives = [];
  
  // 塗料グレードを下げる提案
  if (data.paint_type === 'フッ素塗料' || data.paint_type === '無機塗料') {
    alternatives.push({
      type: 'paint_downgrade',
      description: 'シリコン塗料への変更',
      estimatedSaving: Math.round(currentTotal * 0.2),
      newTotal: Math.round(currentTotal * 0.8)
    });
  }
  
  // 施工範囲の調整
  alternatives.push({
    type: 'partial_work',
    description: '外壁のみ施工（屋根は次回）',
    estimatedSaving: Math.round(currentTotal * 0.3),
    newTotal: Math.round(currentTotal * 0.7)
  });
  
  return alternatives;
}

/**
 * 見積もり結果をスプレッドシートに保存
 */
function saveEstimationToSheet(estimation) {
  try {
    const spreadsheet = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty('LOG_SPREADSHEET_ID')
    );
    
    let estimationSheet = spreadsheet.getSheetByName('見積もり履歴');
    
    if (!estimationSheet) {
      estimationSheet = spreadsheet.insertSheet('見積もり履歴');
      
      // ヘッダー設定
      const headers = [
        'タイムスタンプ',
        '見積もり番号',
        '顧客名',
        '物件種別',
        '塗装面積',
        '塗料種別',
        '見積もり金額',
        '予算内',
        'ステータス'
      ];
      
      estimationSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      estimationSheet.getRange(1, 1, 1, headers.length)
        .setBackground('#4CAF50')
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }
    
    // 見積もりデータを追加
    const row = [
      new Date(),
      estimation.inquiryNumber,
      estimation.customerName,
      estimation.propertyType,
      estimation.areaSize + '㎡',
      estimation.paintType,
      '¥' + estimation.total.toLocaleString(),
      estimation.budgetAnalysis ? (estimation.budgetAnalysis.withinBudget ? '○' : '×') : '-',
      '作成済み'
    ];
    
    estimationSheet.appendRow(row);
    
  } catch (error) {
    console.error('Error saving estimation to sheet:', error);
  }
}

/**
 * 見積もりの概要を生成
 */
function generateEstimationSummary(estimation) {
  const summary = `
【塗装見積もり概要】

見積もり番号: ${estimation.inquiryNumber}
お客様名: ${estimation.customerName}

■ 物件情報
- 物件種別: ${estimation.propertyType}
- 塗装面積: ${estimation.areaSize}㎡
- 使用塗料: ${estimation.paintType}

■ 見積もり金額
${Object.values(estimation.breakdown).map(item => 
  `- ${item.label}: ¥${item.amount.toLocaleString()}`
).join('\n')}

小計: ¥${estimation.subtotal.toLocaleString()}
消費税: ¥${estimation.tax.toLocaleString()}
━━━━━━━━━━━━━━━
合計: ¥${estimation.total.toLocaleString()}

${estimation.notes.join('\n')}
`;

  return summary;
}