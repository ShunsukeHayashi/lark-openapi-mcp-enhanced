/**
 * Real-time Progress Monitoring System
 * 構築進捗のリアルタイム表示機能
 */

import { EventEmitter } from 'events';

export interface ProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  startTime?: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  error?: string;
  details?: any;
  subSteps?: ProgressStep[];
}

export interface ProgressSession {
  id: string;
  projectName: string;
  description: string;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled';
  overallProgress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: ProgressStep[];
  metadata: {
    userId?: string;
    sessionType: 'template' | 'custom' | 'migration';
    estimatedDuration?: number; // minutes
    priority: 'low' | 'medium' | 'high';
    result?: any;
  };
  errors: string[];
  warnings: string[];
}

export interface ProgressEvent {
  type: 'step_start' | 'step_progress' | 'step_complete' | 'step_error' | 'session_complete' | 'session_error';
  sessionId: string;
  stepId?: string;
  data: any;
  timestamp: Date;
}

export interface ProgressListener {
  onProgressUpdate?: (event: ProgressEvent) => void;
  onSessionComplete?: (session: ProgressSession) => void;
  onError?: (error: string, sessionId: string) => void;
}

/**
 * Real-time Progress Monitor
 * リアルタイム進捗監視システム
 */
export class ProgressMonitor extends EventEmitter {
  private sessions: Map<string, ProgressSession> = new Map();
  private progressListeners: Map<string, ProgressListener[]> = new Map();
  private activeSessions: Set<string> = new Set();

  constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * イベントハンドラーの設定
   */
  private setupEventHandlers(): void {
    this.on('progress_update', (event: ProgressEvent) => {
      this.notifyListeners(event);
    });

    this.on('session_complete', (session: ProgressSession) => {
      this.activeSessions.delete(session.id);
      this.notifySessionComplete(session);
    });

    this.on('error', (error: string, sessionId: string) => {
      this.notifyError(error, sessionId);
    });
  }

  /**
   * 新しい進捗セッションの作成
   */
  createSession(config: {
    projectName: string;
    description: string;
    steps: Omit<ProgressStep, 'status' | 'progress'>[];
    metadata?: Partial<ProgressSession['metadata']>;
  }): ProgressSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ProgressSession = {
      id: sessionId,
      projectName: config.projectName,
      description: config.description,
      status: 'initializing',
      overallProgress: 0,
      startTime: new Date(),
      steps: config.steps.map(step => ({
        ...step,
        status: 'pending',
        progress: 0
      })),
      metadata: {
        sessionType: 'custom',
        priority: 'medium',
        ...config.metadata
      },
      errors: [],
      warnings: []
    };

    this.sessions.set(sessionId, session);
    this.activeSessions.add(sessionId);
    
    return session;
  }

  /**
   * セッションの開始
   */
  startSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'running';
    this.emit('progress_update', {
      type: 'step_start',
      sessionId,
      data: { session },
      timestamp: new Date()
    });
  }

  /**
   * ステップの開始
   */
  startStep(sessionId: string, stepId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const step = this.findStep(session.steps, stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = 'running';
    step.startTime = new Date();
    step.progress = 0;

    this.emit('progress_update', {
      type: 'step_start',
      sessionId,
      stepId,
      data: { step },
      timestamp: new Date()
    });

    this.updateOverallProgress(session);
  }

  /**
   * ステップの進捗更新
   */
  updateStepProgress(sessionId: string, stepId: string, progress: number, details?: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const step = this.findStep(session.steps, stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.progress = Math.min(100, Math.max(0, progress));
    if (details) {
      step.details = details;
    }

    this.emit('progress_update', {
      type: 'step_progress',
      sessionId,
      stepId,
      data: { step, progress: step.progress },
      timestamp: new Date()
    });

    this.updateOverallProgress(session);
  }

  /**
   * ステップの完了
   */
  completeStep(sessionId: string, stepId: string, details?: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const step = this.findStep(session.steps, stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = 'completed';
    step.progress = 100;
    step.endTime = new Date();
    step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);
    if (details) {
      step.details = details;
    }

    this.emit('progress_update', {
      type: 'step_complete',
      sessionId,
      stepId,
      data: { step },
      timestamp: new Date()
    });

    this.updateOverallProgress(session);
  }

  /**
   * ステップの失敗
   */
  failStep(sessionId: string, stepId: string, error: string, details?: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const step = this.findStep(session.steps, stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = 'failed';
    step.endTime = new Date();
    step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);
    step.error = error;
    if (details) {
      step.details = details;
    }

    session.errors.push(`Step "${step.name}": ${error}`);

    this.emit('progress_update', {
      type: 'step_error',
      sessionId,
      stepId,
      data: { step, error },
      timestamp: new Date()
    });

    this.updateOverallProgress(session);
  }

  /**
   * ステップのスキップ
   */
  skipStep(sessionId: string, stepId: string, reason?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const step = this.findStep(session.steps, stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    step.status = 'skipped';
    step.progress = 100;
    step.endTime = new Date();
    if (reason) {
      step.details = { reason };
    }

    if (reason) {
      session.warnings.push(`Step "${step.name}" skipped: ${reason}`);
    }

    this.emit('progress_update', {
      type: 'step_complete',
      sessionId,
      stepId,
      data: { step, skipped: true },
      timestamp: new Date()
    });

    this.updateOverallProgress(session);
  }

  /**
   * セッションの完了
   */
  completeSession(sessionId: string, result?: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'completed';
    session.overallProgress = 100;
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();

    if (result) {
      session.metadata.result = result;
    }

    this.emit('progress_update', {
      type: 'session_complete',
      sessionId,
      data: { session, result },
      timestamp: new Date()
    });

    this.emit('session_complete', session);
  }

  /**
   * セッションの失敗
   */
  failSession(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'failed';
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    session.errors.push(error);

    this.emit('progress_update', {
      type: 'session_error',
      sessionId,
      data: { session, error },
      timestamp: new Date()
    });

    this.emit('error', error, sessionId);
  }

  /**
   * セッションのキャンセル
   */
  cancelSession(sessionId: string, reason?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'cancelled';
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    
    if (reason) {
      session.warnings.push(`Session cancelled: ${reason}`);
    }

    this.emit('progress_update', {
      type: 'session_error',
      sessionId,
      data: { session, cancelled: true, reason },
      timestamp: new Date()
    });

    this.activeSessions.delete(sessionId);
  }

  /**
   * セッションの取得
   */
  getSession(sessionId: string): ProgressSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * アクティブセッションの取得
   */
  getActiveSessions(): ProgressSession[] {
    return Array.from(this.activeSessions).map(id => this.sessions.get(id)!);
  }

  /**
   * 全セッションの取得
   */
  getAllSessions(): ProgressSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * セッションの削除
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.activeSessions.delete(sessionId);
    this.progressListeners.delete(sessionId);
  }

  /**
   * リスナーの登録
   */
  addProgressListener(sessionId: string, listener: ProgressListener): void {
    if (!this.progressListeners.has(sessionId)) {
      this.progressListeners.set(sessionId, []);
    }
    this.progressListeners.get(sessionId)!.push(listener);
  }

  /**
   * リスナーの削除
   */
  removeProgressListener(sessionId: string, listener: ProgressListener): void {
    const listeners = this.progressListeners.get(sessionId);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * リスナーへの通知
   */
  private notifyListeners(event: ProgressEvent): void {
    const listeners = this.progressListeners.get(event.sessionId);
    if (listeners) {
      listeners.forEach(listener => {
        if (listener.onProgressUpdate) {
          try {
            listener.onProgressUpdate(event);
          } catch (error) {
            console.error('Error in progress listener:', error);
          }
        }
      });
    }
  }

  /**
   * セッション完了の通知
   */
  private notifySessionComplete(session: ProgressSession): void {
    const listeners = this.progressListeners.get(session.id);
    if (listeners) {
      listeners.forEach(listener => {
        if (listener.onSessionComplete) {
          try {
            listener.onSessionComplete(session);
          } catch (error) {
            console.error('Error in session complete listener:', error);
          }
        }
      });
    }
  }

  /**
   * エラーの通知
   */
  private notifyError(error: string, sessionId: string): void {
    const listeners = this.progressListeners.get(sessionId);
    if (listeners) {
      listeners.forEach(listener => {
        if (listener.onError) {
          try {
            listener.onError(error, sessionId);
          } catch (error) {
            console.error('Error in error listener:', error);
          }
        }
      });
    }
  }

  /**
   * ステップの検索（再帰的）
   */
  private findStep(steps: ProgressStep[], stepId: string): ProgressStep | null {
    for (const step of steps) {
      if (step.id === stepId) {
        return step;
      }
      if (step.subSteps) {
        const found = this.findStep(step.subSteps, stepId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * 全体進捗の更新
   */
  private updateOverallProgress(session: ProgressSession): void {
    const totalSteps = this.countTotalSteps(session.steps);
    const completedSteps = this.countCompletedSteps(session.steps);
    
    session.overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }

  /**
   * 全ステップ数のカウント
   */
  private countTotalSteps(steps: ProgressStep[]): number {
    let count = steps.length;
    for (const step of steps) {
      if (step.subSteps) {
        count += this.countTotalSteps(step.subSteps);
      }
    }
    return count;
  }

  /**
   * 完了ステップ数のカウント
   */
  private countCompletedSteps(steps: ProgressStep[]): number {
    let count = 0;
    for (const step of steps) {
      if (step.status === 'completed' || step.status === 'skipped') {
        count++;
      }
      if (step.subSteps) {
        count += this.countCompletedSteps(step.subSteps);
      }
    }
    return count;
  }

  /**
   * 統計情報の取得
   */
  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    failedSessions: number;
    averageDuration: number;
    successRate: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const completed = sessions.filter(s => s.status === 'completed');
    const failed = sessions.filter(s => s.status === 'failed');
    
    const totalDuration = completed.reduce((sum, session) => {
      return sum + (session.duration || 0);
    }, 0);

    return {
      totalSessions: sessions.length,
      activeSessions: this.activeSessions.size,
      completedSessions: completed.length,
      failedSessions: failed.length,
      averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
      successRate: sessions.length > 0 ? (completed.length / sessions.length) * 100 : 0
    };
  }

  /**
   * セッションのクリーンアップ（古いセッションの削除）
   */
  cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void { // デフォルト24時間
    const cutoff = Date.now() - maxAge;
    const sessionsToDelete: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.endTime && session.endTime.getTime() < cutoff) {
        sessionsToDelete.push(sessionId);
      }
    }

    sessionsToDelete.forEach(sessionId => {
      this.deleteSession(sessionId);
    });
  }
} 