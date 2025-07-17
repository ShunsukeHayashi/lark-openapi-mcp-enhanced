/**
 * 自動発注システム
 * 在庫予測に基づいた自動発注とワークフロー管理
 */

const moment = require('moment');
const EventEmitter = require('events');

class AutoOrderingSystem extends EventEmitter {
  constructor(demandForecastEngine, larkAPI) {
    super();
    this.forecastEngine = demandForecastEngine;
    this.larkAPI = larkAPI;
    
    this.config = {
      // 発注ルール
      orderingRules: {
        safetyStockMultiplier: 1.5,
        leadTimeDays: 7,
        minOrderQuantity: 100,
        maxOrderQuantity: 10000,
        reorderPoint: 0.3, // 在庫が30%以下で発注
        
        // 承認閾値
        approvalThresholds: {
          automatic: 50000,      // 5万円以下は自動承認
          manager: 200000,       // 20万円以下はマネージャー承認
          director: 1000000,     // 100万円以下はディレクター承認
          executive: Infinity    // それ以上は役員承認
        }
      },
      
      // サプライヤー設定
      supplierConfig: {
        preferredSuppliers: [],
        backupSuppliers: [],
        evaluationCriteria: {
          price: 0.4,
          quality: 0.3,
          deliveryTime: 0.2,
          reliability: 0.1
        }
      },
      
      // ワークフロー設定
      workflowConfig: {
        maxRetries: 3,
        retryDelay: 3600000, // 1時間
        escalationTime: 86400000, // 24時間
        notificationChannels: ['email', 'lark', 'sms']
      }
    };
    
    this.pendingOrders = new Map();
    this.approvalQueue = [];
  }

  /**
   * 自動発注プロセスの実行
   * @param {Object} inventoryData - 現在の在庫データ
   * @returns {Object} 発注結果
   */
  async executeAutoOrdering(inventoryData) {
    try {
      console.log('Starting auto-ordering process...');
      
      // 発注が必要なアイテムの特定
      const itemsNeedingOrder = await this.identifyOrderingNeeds(inventoryData);
      
      if (itemsNeedingOrder.length === 0) {
        console.log('No items need ordering');
        return { ordersCreated: 0, message: '発注が必要なアイテムはありません' };
      }
      
      // 各アイテムの発注処理
      const orderResults = [];
      for (const item of itemsNeedingOrder) {
        const orderResult = await this.processItemOrder(item);
        orderResults.push(orderResult);
      }
      
      // 結果の集約
      const summary = this.aggregateOrderResults(orderResults);
      
      // Lark通知
      await this.notifyOrderingSummary(summary);
      
      return summary;
      
    } catch (error) {
      console.error('Auto-ordering error:', error);
      this.emit('error', { type: 'auto_ordering', error });
      throw error;
    }
  }

  /**
   * 発注が必要なアイテムの特定
   */
  async identifyOrderingNeeds(inventoryData) {
    const needsOrdering = [];
    
    for (const item of inventoryData) {
      // 現在の在庫レベル
      const currentStock = item.quantity;
      const maxStock = item.maxQuantity || 1000;
      const stockLevel = currentStock / maxStock;
      
      // 需要予測
      const forecast = await this.forecastEngine.forecast({
        itemId: item.id,
        historicalData: item.history,
        horizon: 30
      });
      
      // リードタイム中の予測需要
      const leadTimeDemand = this.calculateLeadTimeDemand(
        forecast.forecast,
        this.config.orderingRules.leadTimeDays
      );
      
      // 安全在庫
      const safetyStock = leadTimeDemand * this.config.orderingRules.safetyStockMultiplier;
      
      // 発注点
      const reorderPoint = safetyStock + leadTimeDemand;
      
      // 発注判断
      if (currentStock <= reorderPoint || stockLevel <= this.config.orderingRules.reorderPoint) {
        const orderQuantity = this.calculateOptimalOrderQuantity(
          item,
          forecast,
          currentStock,
          reorderPoint
        );
        
        needsOrdering.push({
          item,
          currentStock,
          reorderPoint,
          orderQuantity,
          forecast,
          urgency: this.calculateOrderUrgency(currentStock, leadTimeDemand),
          estimatedCost: orderQuantity * (item.unitCost || 100)
        });
      }
    }
    
    // 緊急度でソート
    return needsOrdering.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * アイテムの発注処理
   */
  async processItemOrder(orderData) {
    const { item, orderQuantity, estimatedCost, urgency } = orderData;
    
    try {
      // サプライヤー選定
      const selectedSupplier = await this.selectOptimalSupplier(item, orderQuantity);
      
      // 見積もり取得
      const quotation = await this.requestQuotation(selectedSupplier, item, orderQuantity);
      
      // 発注データの作成
      const purchaseOrder = {
        id: this.generateOrderId(),
        itemId: item.id,
        itemName: item.name,
        quantity: orderQuantity,
        supplier: selectedSupplier,
        quotation,
        urgency,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        forecast: orderData.forecast,
        justification: this.generateOrderJustification(orderData)
      };
      
      // 承認ワークフローの開始
      const approvalResult = await this.initiateApprovalWorkflow(purchaseOrder);
      
      if (approvalResult.approved) {
        // 発注実行
        const orderResult = await this.executePurchaseOrder(purchaseOrder);
        purchaseOrder.status = 'ordered';
        purchaseOrder.orderDetails = orderResult;
        
        // 在庫システムへの反映
        await this.updateInventorySystem(purchaseOrder);
      } else {
        purchaseOrder.status = 'rejected';
        purchaseOrder.rejectionReason = approvalResult.reason;
      }
      
      // 発注履歴の保存
      await this.savePurchaseOrder(purchaseOrder);
      
      return purchaseOrder;
      
    } catch (error) {
      console.error(`Order processing error for item ${item.id}:`, error);
      return {
        itemId: item.id,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * 最適なサプライヤーの選定
   */
  async selectOptimalSupplier(item, quantity) {
    // 利用可能なサプライヤーの取得
    const availableSuppliers = await this.getAvailableSuppliers(item);
    
    if (availableSuppliers.length === 0) {
      throw new Error('利用可能なサプライヤーがありません');
    }
    
    // 各サプライヤーの評価
    const supplierScores = await Promise.all(
      availableSuppliers.map(async supplier => {
        const evaluation = await this.evaluateSupplier(supplier, item, quantity);
        return {
          supplier,
          score: this.calculateSupplierScore(evaluation),
          evaluation
        };
      })
    );
    
    // 最高スコアのサプライヤーを選択
    const selected = supplierScores.sort((a, b) => b.score - a.score)[0];
    
    return {
      ...selected.supplier,
      selectionScore: selected.score,
      selectionCriteria: selected.evaluation
    };
  }

  /**
   * 見積もり依頼
   */
  async requestQuotation(supplier, item, quantity) {
    try {
      // サプライヤーAPIへの見積もり依頼
      const quotationRequest = {
        supplierId: supplier.id,
        itemCode: item.code,
        quantity,
        deliveryDate: moment().add(this.config.orderingRules.leadTimeDays, 'days').toISOString(),
        terms: 'NET30'
      };
      
      // 実際のAPI呼び出し（モック）
      const quotation = await this.mockSupplierAPI(quotationRequest);
      
      return {
        ...quotation,
        validUntil: moment().add(7, 'days').toISOString(),
        requestedAt: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Quotation request error:', error);
      throw new Error(`見積もり取得エラー: ${error.message}`);
    }
  }

  /**
   * 承認ワークフローの開始
   */
  async initiateApprovalWorkflow(purchaseOrder) {
    const { quotation } = purchaseOrder;
    const totalAmount = quotation.totalAmount;
    
    // 承認レベルの判定
    const approvalLevel = this.determineApprovalLevel(totalAmount);
    
    if (approvalLevel === 'automatic') {
      // 自動承認
      return {
        approved: true,
        approver: 'system',
        approvedAt: new Date().toISOString(),
        level: 'automatic'
      };
    }
    
    // 承認リクエストの作成
    const approvalRequest = {
      id: this.generateApprovalId(),
      purchaseOrderId: purchaseOrder.id,
      level: approvalLevel,
      amount: totalAmount,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      details: purchaseOrder
    };
    
    // 承認者への通知
    await this.notifyApprovers(approvalRequest);
    
    // 承認待ちキューに追加
    this.approvalQueue.push(approvalRequest);
    
    // 承認結果の待機（タイムアウト付き）
    const approvalResult = await this.waitForApproval(
      approvalRequest.id,
      this.config.workflowConfig.escalationTime
    );
    
    return approvalResult;
  }

  /**
   * 発注実行
   */
  async executePurchaseOrder(purchaseOrder) {
    try {
      const { supplier, quotation, quantity, item } = purchaseOrder;
      
      // サプライヤーAPIへの発注
      const orderRequest = {
        quotationId: quotation.id,
        purchaseOrderNumber: purchaseOrder.id,
        confirmQuantity: quantity,
        deliveryAddress: await this.getDeliveryAddress(item),
        paymentTerms: quotation.paymentTerms,
        specialInstructions: this.generateSpecialInstructions(purchaseOrder)
      };
      
      // 発注API呼び出し（モック）
      const orderConfirmation = await this.mockSupplierOrderAPI(orderRequest);
      
      // 発注追跡情報の設定
      this.setupOrderTracking(purchaseOrder.id, orderConfirmation);
      
      return {
        confirmationNumber: orderConfirmation.number,
        estimatedDelivery: orderConfirmation.estimatedDelivery,
        trackingNumber: orderConfirmation.trackingNumber,
        status: 'confirmed'
      };
      
    } catch (error) {
      console.error('Purchase order execution error:', error);
      throw new Error(`発注実行エラー: ${error.message}`);
    }
  }

  /**
   * 承認ワークフロー管理
   * @param {string} approvalId - 承認ID
   * @param {Object} decision - 承認決定
   */
  async processApprovalDecision(approvalId, decision) {
    const approvalRequest = this.approvalQueue.find(req => req.id === approvalId);
    
    if (!approvalRequest) {
      throw new Error('承認リクエストが見つかりません');
    }
    
    approvalRequest.status = decision.approved ? 'approved' : 'rejected';
    approvalRequest.approver = decision.approver;
    approvalRequest.decidedAt = new Date().toISOString();
    approvalRequest.comments = decision.comments;
    
    // 承認履歴の保存
    await this.saveApprovalHistory(approvalRequest);
    
    // 待機中のプロミスを解決
    this.emit(`approval:${approvalId}`, {
      approved: decision.approved,
      approver: decision.approver,
      approvedAt: approvalRequest.decidedAt,
      reason: decision.comments
    });
    
    // キューから削除
    this.approvalQueue = this.approvalQueue.filter(req => req.id !== approvalId);
    
    // 次のステップの通知
    if (decision.approved) {
      await this.notifyPurchaseApproved(approvalRequest);
    } else {
      await this.notifyPurchaseRejected(approvalRequest);
    }
  }

  /**
   * コスト最適化分析
   * @param {Array} orderData - 発注データ
   * @returns {Object} 最適化提案
   */
  async analyzeCostOptimization(orderData) {
    const optimization = {
      consolidationOpportunities: [],
      volumeDiscounts: [],
      alternativeSuppliers: [],
      totalSavings: 0
    };
    
    // 発注統合の機会
    const consolidation = this.identifyConsolidationOpportunities(orderData);
    optimization.consolidationOpportunities = consolidation.opportunities;
    optimization.totalSavings += consolidation.potentialSavings;
    
    // ボリュームディスカウントの分析
    const volumeAnalysis = await this.analyzeVolumeDiscounts(orderData);
    optimization.volumeDiscounts = volumeAnalysis.discounts;
    optimization.totalSavings += volumeAnalysis.potentialSavings;
    
    // 代替サプライヤーの提案
    const alternatives = await this.suggestAlternativeSuppliers(orderData);
    optimization.alternativeSuppliers = alternatives.suppliers;
    optimization.totalSavings += alternatives.potentialSavings;
    
    // 最適化レポートの生成
    optimization.report = this.generateOptimizationReport(optimization);
    
    return optimization;
  }

  // ユーティリティメソッド
  calculateLeadTimeDemand(forecast, leadTimeDays) {
    return forecast
      .slice(0, leadTimeDays)
      .reduce((sum, day) => sum + day.value, 0);
  }

  calculateOptimalOrderQuantity(item, forecast, currentStock, reorderPoint) {
    // EOQ（経済的発注量）の計算
    const annualDemand = forecast.forecast
      .slice(0, 30)
      .reduce((sum, day) => sum + day.value, 0) * 12;
    
    const orderingCost = 1000; // 仮定
    const holdingCostRate = 0.2; // 年間保管コスト率
    const unitCost = item.unitCost || 100;
    
    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / (holdingCostRate * unitCost));
    
    // 制約の適用
    let orderQuantity = Math.max(eoq, reorderPoint - currentStock);
    orderQuantity = Math.max(orderQuantity, this.config.orderingRules.minOrderQuantity);
    orderQuantity = Math.min(orderQuantity, this.config.orderingRules.maxOrderQuantity);
    
    return Math.ceil(orderQuantity);
  }

  calculateOrderUrgency(currentStock, leadTimeDemand) {
    const daysOfStock = leadTimeDemand > 0 ? currentStock / (leadTimeDemand / 7) : 999;
    
    if (daysOfStock < 3) return 1.0;  // 緊急
    if (daysOfStock < 7) return 0.7;  // 高
    if (daysOfStock < 14) return 0.5; // 中
    return 0.3; // 低
  }

  generateOrderId() {
    return `PO-${moment().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  generateApprovalId() {
    return `APR-${moment().format('YYYYMMDD')}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  generateOrderJustification(orderData) {
    const { item, currentStock, reorderPoint, orderQuantity, forecast } = orderData;
    
    return {
      reason: '在庫補充',
      currentStockLevel: `${currentStock} / ${item.maxQuantity || 1000}`,
      reorderPoint: reorderPoint,
      forecastedDemand: forecast.forecast.slice(0, 7).reduce((sum, f) => sum + f.value, 0),
      orderQuantity: orderQuantity,
      urgencyLevel: orderData.urgency > 0.7 ? '緊急' : '通常'
    };
  }

  async getAvailableSuppliers(item) {
    // 実際の実装では、データベースから取得
    return [
      {
        id: 'SUP001',
        name: 'サプライヤーA',
        reliability: 0.95,
        averageLeadTime: 5,
        priceLevel: 'competitive'
      },
      {
        id: 'SUP002', 
        name: 'サプライヤーB',
        reliability: 0.90,
        averageLeadTime: 7,
        priceLevel: 'premium'
      }
    ];
  }

  async evaluateSupplier(supplier, item, quantity) {
    // サプライヤー評価
    return {
      price: 0.8,
      quality: 0.9,
      deliveryTime: 0.85,
      reliability: supplier.reliability
    };
  }

  calculateSupplierScore(evaluation) {
    const weights = this.config.supplierConfig.evaluationCriteria;
    
    return Object.entries(weights).reduce((score, [criterion, weight]) => {
      return score + (evaluation[criterion] * weight);
    }, 0);
  }

  determineApprovalLevel(amount) {
    const thresholds = this.config.orderingRules.approvalThresholds;
    
    if (amount <= thresholds.automatic) return 'automatic';
    if (amount <= thresholds.manager) return 'manager';
    if (amount <= thresholds.director) return 'director';
    return 'executive';
  }

  async notifyApprovers(approvalRequest) {
    const { level, amount, details } = approvalRequest;
    
    const notification = {
      type: 'purchase_approval_required',
      level,
      amount,
      itemName: details.itemName,
      quantity: details.quantity,
      supplier: details.supplier.name,
      urgency: details.urgency > 0.7 ? 'high' : 'normal',
      approvalLink: `${process.env.APP_URL}/approvals/${approvalRequest.id}`
    };
    
    // Lark通知
    await this.larkAPI.sendApprovalNotification(notification);
  }

  async waitForApproval(approvalId, timeout) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeAllListeners(`approval:${approvalId}`);
        resolve({
          approved: false,
          reason: 'タイムアウト：承認期限切れ'
        });
      }, timeout);
      
      this.once(`approval:${approvalId}`, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
    });
  }

  async mockSupplierAPI(request) {
    // サプライヤーAPI のモック
    return {
      id: `QUO-${Date.now()}`,
      itemCode: request.itemCode,
      quantity: request.quantity,
      unitPrice: 100,
      totalAmount: request.quantity * 100,
      deliveryDate: request.deliveryDate,
      paymentTerms: request.terms,
      validUntil: moment().add(7, 'days').toISOString()
    };
  }

  async mockSupplierOrderAPI(request) {
    // 発注APIのモック
    return {
      number: `ORD-${Date.now()}`,
      estimatedDelivery: moment().add(7, 'days').toISOString(),
      trackingNumber: `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
  }

  setupOrderTracking(orderId, confirmation) {
    // 発注追跡の設定
    this.pendingOrders.set(orderId, {
      confirmationNumber: confirmation.number,
      trackingNumber: confirmation.trackingNumber,
      status: 'in_transit',
      lastUpdated: new Date().toISOString()
    });
  }

  async updateInventorySystem(purchaseOrder) {
    // 在庫システムへの更新
    const update = {
      itemId: purchaseOrder.itemId,
      expectedQuantity: purchaseOrder.quantity,
      expectedDate: purchaseOrder.orderDetails.estimatedDelivery,
      purchaseOrderId: purchaseOrder.id,
      status: 'on_order'
    };
    
    await this.larkAPI.updateInventoryExpectation(update);
  }

  async savePurchaseOrder(purchaseOrder) {
    // 発注履歴の保存
    await this.larkAPI.savePurchaseOrder(purchaseOrder);
  }

  async saveApprovalHistory(approvalRequest) {
    // 承認履歴の保存
    await this.larkAPI.saveApprovalHistory(approvalRequest);
  }

  aggregateOrderResults(orderResults) {
    const summary = {
      ordersCreated: 0,
      ordersApproved: 0,
      ordersRejected: 0,
      ordersFailed: 0,
      totalAmount: 0,
      items: []
    };
    
    orderResults.forEach(result => {
      if (result.status === 'ordered') {
        summary.ordersCreated++;
        summary.ordersApproved++;
        summary.totalAmount += result.quotation.totalAmount;
      } else if (result.status === 'rejected') {
        summary.ordersRejected++;
      } else if (result.status === 'error') {
        summary.ordersFailed++;
      }
      
      summary.items.push({
        itemId: result.itemId,
        itemName: result.itemName,
        quantity: result.quantity,
        status: result.status,
        amount: result.quotation?.totalAmount || 0
      });
    });
    
    return summary;
  }

  async notifyOrderingSummary(summary) {
    // 発注サマリーの通知
    const message = {
      type: 'auto_ordering_summary',
      summary: {
        created: summary.ordersCreated,
        approved: summary.ordersApproved,
        rejected: summary.ordersRejected,
        failed: summary.ordersFailed,
        totalAmount: summary.totalAmount
      },
      details: summary.items,
      timestamp: new Date().toISOString()
    };
    
    await this.larkAPI.sendOrderingSummaryNotification(message);
  }

  identifyConsolidationOpportunities(orderData) {
    // 発注統合の機会を特定
    const opportunities = [];
    let potentialSavings = 0;
    
    // 同一サプライヤーへの複数発注をチェック
    const supplierGroups = {};
    orderData.forEach(order => {
      const supplierId = order.supplier?.id;
      if (supplierId) {
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = [];
        }
        supplierGroups[supplierId].push(order);
      }
    });
    
    Object.entries(supplierGroups).forEach(([supplierId, orders]) => {
      if (orders.length > 1) {
        const consolidatedAmount = orders.reduce((sum, o) => sum + o.estimatedCost, 0);
        const savingsPercent = 0.05; // 5%の節約想定
        const savings = consolidatedAmount * savingsPercent;
        
        opportunities.push({
          supplierId,
          orderCount: orders.length,
          totalAmount: consolidatedAmount,
          estimatedSavings: savings
        });
        
        potentialSavings += savings;
      }
    });
    
    return { opportunities, potentialSavings };
  }

  async analyzeVolumeDiscounts(orderData) {
    // ボリュームディスカウントの分析
    const discounts = [];
    let potentialSavings = 0;
    
    for (const order of orderData) {
      if (order.orderQuantity > 500) {
        const discount = {
          itemId: order.item.id,
          currentQuantity: order.orderQuantity,
          suggestedQuantity: Math.ceil(order.orderQuantity * 1.2),
          discountRate: 0.1, // 10%割引想定
          additionalCost: order.orderQuantity * 0.2 * (order.item.unitCost || 100),
          savings: order.orderQuantity * (order.item.unitCost || 100) * 0.1
        };
        
        if (discount.savings > discount.additionalCost) {
          discounts.push(discount);
          potentialSavings += (discount.savings - discount.additionalCost);
        }
      }
    }
    
    return { discounts, potentialSavings };
  }

  async suggestAlternativeSuppliers(orderData) {
    // 代替サプライヤーの提案
    const alternatives = [];
    let potentialSavings = 0;
    
    // 実際の実装では、各アイテムに対して代替サプライヤーを検索
    
    return { suppliers: alternatives, potentialSavings };
  }

  generateOptimizationReport(optimization) {
    return `
    コスト最適化レポート
    ====================
    
    総節約可能額: ¥${optimization.totalSavings.toLocaleString()}
    
    1. 発注統合の機会: ${optimization.consolidationOpportunities.length}件
    2. ボリュームディスカウント: ${optimization.volumeDiscounts.length}件
    3. 代替サプライヤー: ${optimization.alternativeSuppliers.length}件
    
    推奨アクション:
    - 同一サプライヤーへの発注を統合
    - 大量発注によるディスカウントの活用
    - コスト効率の良いサプライヤーへの切り替え検討
    `;
  }

  async notifyPurchaseApproved(approvalRequest) {
    // 承認通知
    await this.larkAPI.sendNotification({
      type: 'purchase_approved',
      purchaseOrderId: approvalRequest.purchaseOrderId,
      approver: approvalRequest.approver,
      amount: approvalRequest.amount
    });
  }

  async notifyPurchaseRejected(approvalRequest) {
    // 却下通知
    await this.larkAPI.sendNotification({
      type: 'purchase_rejected',
      purchaseOrderId: approvalRequest.purchaseOrderId,
      approver: approvalRequest.approver,
      reason: approvalRequest.comments
    });
  }

  async getDeliveryAddress(item) {
    // 配送先住所の取得
    return {
      name: '株式会社サンプル',
      address: '東京都港区虎ノ門1-2-3',
      postalCode: '105-0001',
      phone: '03-1234-5678'
    };
  }

  generateSpecialInstructions(purchaseOrder) {
    // 特別指示の生成
    const instructions = [];
    
    if (purchaseOrder.urgency > 0.8) {
      instructions.push('緊急配送をお願いします');
    }
    
    instructions.push(`受注番号: ${purchaseOrder.id}`);
    
    return instructions.join('; ');
  }
}

module.exports = AutoOrderingSystem;