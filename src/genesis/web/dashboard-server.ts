/**
 * Web Dashboard Interface
 * ブラウザベースの管理画面開発
 */

import express, { Request, Response, Application } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';

export interface DashboardConfig {
  port: number;
  host: string;
  enableAuth: boolean;
  staticPath?: string;
  apiPrefix: string;
  corsOrigins: string[];
}

export interface SessionStatus {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  startTime: number;
  lastActivity: number;
  userId: string;
  errors: string[];
}

export interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  failedSessions: number;
  averageCompletionTime: number;
  topErrors: Array<{
    error: string;
    count: number;
  }>;
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

/**
 * Genesis Dashboard Server
 * リアルタイム監視とセッション管理のWebインターフェース
 */
export class DashboardServer {
  private app: Application;
  private server: any;
  private io: SocketIOServer;
  private config: DashboardConfig;
  private sessions = new Map<string, SessionStatus>();
  private clients = new Set<string>();

  constructor(config: DashboardConfig) {
    this.config = config;
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.corsOrigins,
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * ミドルウェアの設定
   */
  private setupMiddleware(): void {
    // CORS設定
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true
    }));

    // JSON パーサー
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // 静的ファイル配信
    if (this.config.staticPath) {
      this.app.use('/static', express.static(this.config.staticPath));
    }

    // ルート配信
    this.app.use('/', express.static(path.join(__dirname, 'public')));

    // ログ設定
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * APIルートの設定
   */
  private setupRoutes(): void {
    const apiRouter = express.Router();

    // ダッシュボード統計
    apiRouter.get('/stats', this.handleGetStats.bind(this));

    // セッション管理
    apiRouter.get('/sessions', this.handleGetSessions.bind(this));
    apiRouter.get('/sessions/:id', this.handleGetSession.bind(this));
    apiRouter.post('/sessions', this.handleCreateSession.bind(this));
    apiRouter.put('/sessions/:id', this.handleUpdateSession.bind(this));
    apiRouter.delete('/sessions/:id', this.handleDeleteSession.bind(this));

    // セッション操作
    apiRouter.post('/sessions/:id/start', this.handleStartSession.bind(this));
    apiRouter.post('/sessions/:id/pause', this.handlePauseSession.bind(this));
    apiRouter.post('/sessions/:id/resume', this.handleResumeSession.bind(this));
    apiRouter.post('/sessions/:id/cancel', this.handleCancelSession.bind(this));

    // ステップ実行
    apiRouter.post('/sessions/:id/steps/:stepId/execute', this.handleExecuteStep.bind(this));
    apiRouter.post('/sessions/:id/steps/:stepId/feedback', this.handleSubmitFeedback.bind(this));

    // エラーと復旧
    apiRouter.get('/sessions/:id/errors', this.handleGetErrors.bind(this));
    apiRouter.post('/sessions/:id/rollback', this.handleRollback.bind(this));
    apiRouter.post('/sessions/:id/recovery', this.handleRecovery.bind(this));

    // 設定とテンプレート
    apiRouter.get('/templates', this.handleGetTemplates.bind(this));
    apiRouter.post('/templates', this.handleCreateTemplate.bind(this));

    // システム情報
    apiRouter.get('/health', this.handleHealthCheck.bind(this));
    apiRouter.get('/version', this.handleGetVersion.bind(this));

    this.app.use(this.config.apiPrefix, apiRouter);

    // SPA fallback
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  /**
   * WebSocketの設定
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.clients.add(socket.id);

      // セッション監視の開始
      socket.on('subscribe_session', (sessionId: string) => {
        socket.join(`session_${sessionId}`);
        console.log(`Client ${socket.id} subscribed to session ${sessionId}`);
      });

      // セッション監視の停止
      socket.on('unsubscribe_session', (sessionId: string) => {
        socket.leave(`session_${sessionId}`);
        console.log(`Client ${socket.id} unsubscribed from session ${sessionId}`);
      });

      // 全体統計の購読
      socket.on('subscribe_stats', () => {
        socket.join('stats');
        this.sendStatsUpdate(socket);
      });

      // 切断処理
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });

    // 定期的な統計更新
    setInterval(() => {
      this.broadcastStatsUpdate();
    }, 5000);
  }

  /**
   * API ハンドラー
   */
  private async handleGetStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.calculateStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }

  private async handleGetSessions(req: Request, res: Response): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  }

  private async handleGetSession(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get session' });
    }
  }

  private async handleCreateSession(req: Request, res: Response): Promise<void> {
    try {
      const { name, requirements, userId } = req.body;
      
      const session: SessionStatus = {
        id: `session_${Date.now()}`,
        name: name || 'Unnamed Session',
        status: 'active',
        progress: 0,
        currentStep: 'Requirements Analysis',
        startTime: Date.now(),
        lastActivity: Date.now(),
        userId: userId || 'anonymous',
        errors: []
      };

      this.sessions.set(session.id, session);
      
      // WebSocket通知
      this.io.emit('session_created', session);
      
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create session' });
    }
  }

  private async handleUpdateSession(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // セッション更新
      Object.assign(session, req.body, { lastActivity: Date.now() });
      
      // WebSocket通知
      this.io.to(`session_${session.id}`).emit('session_updated', session);
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update session' });
    }
  }

  private async handleDeleteSession(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      this.sessions.delete(req.params.id);
      
      // WebSocket通知
      this.io.emit('session_deleted', { id: req.params.id });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete session' });
    }
  }

  private async handleStartSession(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      session.status = 'active';
      session.lastActivity = Date.now();
      
      // WebSocket通知
      this.io.to(`session_${session.id}`).emit('session_started', session);
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to start session' });
    }
  }

  private async handlePauseSession(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      session.status = 'paused';
      session.lastActivity = Date.now();
      
      // WebSocket通知
      this.io.to(`session_${session.id}`).emit('session_paused', session);
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to pause session' });
    }
  }

  private async handleResumeSession(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      session.status = 'active';
      session.lastActivity = Date.now();
      
      // WebSocket通知
      this.io.to(`session_${session.id}`).emit('session_resumed', session);
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to resume session' });
    }
  }

  private async handleCancelSession(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      session.status = 'failed';
      session.lastActivity = Date.now();
      
      // WebSocket通知
      this.io.to(`session_${session.id}`).emit('session_cancelled', session);
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel session' });
    }
  }

  private async handleExecuteStep(req: Request, res: Response): Promise<void> {
    try {
      const { id, stepId } = req.params;
      const session = this.sessions.get(id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // ステップ実行のシミュレーション
      session.currentStep = stepId;
      session.progress = Math.min(100, session.progress + 15);
      session.lastActivity = Date.now();

      // WebSocket通知
      this.io.to(`session_${id}`).emit('step_executed', {
        sessionId: id,
        stepId,
        progress: session.progress
      });

      res.json({
        success: true,
        sessionId: id,
        stepId,
        progress: session.progress
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to execute step' });
    }
  }

  private async handleSubmitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { id, stepId } = req.params;
      const feedback = req.body;
      
      // フィードバック処理のシミュレーション
      
      // WebSocket通知
      this.io.to(`session_${id}`).emit('feedback_received', {
        sessionId: id,
        stepId,
        feedback
      });

      res.json({
        success: true,
        message: 'Feedback received'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  }

  private async handleGetErrors(req: Request, res: Response): Promise<void> {
    try {
      const session = this.sessions.get(req.params.id);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json({
        sessionId: req.params.id,
        errors: session.errors
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get errors' });
    }
  }

  private async handleRollback(req: Request, res: Response): Promise<void> {
    try {
      const { checkpointId } = req.body;
      
      // ロールバック処理のシミュレーション
      
      res.json({
        success: true,
        message: 'Rollback initiated',
        checkpointId
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to initiate rollback' });
    }
  }

  private async handleRecovery(req: Request, res: Response): Promise<void> {
    try {
      const { strategy } = req.body;
      
      // 復旧処理のシミュレーション
      
      res.json({
        success: true,
        message: 'Recovery initiated',
        strategy
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to initiate recovery' });
    }
  }

  private async handleGetTemplates(req: Request, res: Response): Promise<void> {
    try {
      // テンプレート一覧の取得
      const templates = [
        {
          id: 'crm_template',
          name: 'CRM System',
          description: 'Customer Relationship Management system template',
          category: 'business'
        },
        {
          id: 'project_template',
          name: 'Project Management',
          description: 'Project management system template',
          category: 'productivity'
        }
      ];

      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get templates' });
    }
  }

  private async handleCreateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const template = req.body;
      
      // テンプレート作成処理
      
      res.status(201).json({
        success: true,
        templateId: `template_${Date.now()}`,
        message: 'Template created'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create template' });
    }
  }

  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: this.clients.size
    });
  }

  private async handleGetVersion(req: Request, res: Response): Promise<void> {
    res.json({
      version: '1.0.0',
      buildDate: '2024-01-15',
      nodeVersion: process.version,
      platform: process.platform
    });
  }

  /**
   * ユーティリティメソッド
   */
  private async calculateStats(): Promise<DashboardStats> {
    const sessions = Array.from(this.sessions.values());
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const failedSessions = sessions.filter(s => s.status === 'failed').length;

    // 平均完了時間の計算
    const completedSessionsWithTime = sessions.filter(s => 
      s.status === 'completed' && s.lastActivity && s.startTime
    );
    const averageCompletionTime = completedSessionsWithTime.length > 0
      ? completedSessionsWithTime.reduce((sum, s) => 
          sum + (s.lastActivity - s.startTime), 0) / completedSessionsWithTime.length
      : 0;

    // エラー統計
    const errorCounts = new Map<string, number>();
    sessions.forEach(session => {
      session.errors.forEach(error => {
        errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
      });
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: sessions.length,
      activeSessions,
      completedSessions,
      failedSessions,
      averageCompletionTime,
      topErrors,
      resourceUtilization: {
        cpu: Math.round(Math.random() * 100), // モック値
        memory: Math.round(process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100),
        storage: Math.round(Math.random() * 100) // モック値
      }
    };
  }

  private async sendStatsUpdate(socket: any): Promise<void> {
    try {
      const stats = await this.calculateStats();
      socket.emit('stats_update', stats);
    } catch (error) {
      console.error('Failed to send stats update:', error);
    }
  }

  private async broadcastStatsUpdate(): Promise<void> {
    try {
      const stats = await this.calculateStats();
      this.io.to('stats').emit('stats_update', stats);
    } catch (error) {
      console.error('Failed to broadcast stats update:', error);
    }
  }

  /**
   * セッション進捗の更新
   */
  updateSessionProgress(sessionId: string, progress: number, currentStep: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.progress = progress;
      session.currentStep = currentStep;
      session.lastActivity = Date.now();
      
      // WebSocket通知
      this.io.to(`session_${sessionId}`).emit('progress_update', {
        sessionId,
        progress,
        currentStep
      });
    }
  }

  /**
   * セッションエラーの追加
   */
  addSessionError(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.errors.push(error);
      session.lastActivity = Date.now();
      
      // WebSocket通知
      this.io.to(`session_${sessionId}`).emit('error_occurred', {
        sessionId,
        error,
        timestamp: Date.now()
      });
    }
  }

  /**
   * サーバーの開始
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`Genesis Dashboard Server running on http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * サーバーの停止
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Genesis Dashboard Server stopped');
        resolve();
      });
    });
  }

  /**
   * 接続中のクライアント数取得
   */
  getConnectedClients(): number {
    return this.clients.size;
  }

  /**
   * セッション数取得
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}