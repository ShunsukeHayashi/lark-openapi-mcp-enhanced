/**
 * Real-time Dashboard Server
 * Provides WebSocket and HTTP endpoints for monitoring data
 */

import express from 'express';
import { Server as HttpServer } from 'http';
import { PerformanceMonitor } from './performance-monitor';

// Mock Socket.IO for now (would need to install socket.io package)
interface SocketIOServer {
  on(event: string, handler: Function): void;
  emit(event: string, data: any): void;
  to(room: string): { emit(event: string, data: any): void };
  close(callback: Function): void;
}

interface Socket {
  id: string;
  join(room: string): void;
  leave(room: string): void;
  emit(event: string, data: any): void;
  on(event: string, handler: Function): void;
}

export interface DashboardServerConfig {
  port: number;
  host: string;
  corsOrigin?: string;
  authToken?: string;
}

export class DashboardServer {
  private app: express.Application;
  private server: HttpServer;
  private io: SocketIOServer;
  private monitor: PerformanceMonitor;
  private config: DashboardServerConfig;
  private updateInterval?: NodeJS.Timeout;

  constructor(monitor: PerformanceMonitor, config: Partial<DashboardServerConfig> = {}) {
    this.monitor = monitor;
    this.config = {
      port: 3001,
      host: 'localhost',
      ...config,
    };

    this.app = express();
    this.server = new HttpServer(this.app);
    
    // Create a mock Socket.IO server
    this.io = this.createMockSocketIO();

    this.setupRoutes();
    this.setupWebSocket();
    this.setupMonitorListeners();
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    this.app.use(express.json());

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });

    // Get dashboard data
    this.app.get('/api/dashboard', this.authenticate.bind(this), (req, res) => {
      const data = this.monitor.getDashboardData();
      res.json(data);
    });

    // Get time series data
    this.app.get('/api/metrics/:type/:name', this.authenticate.bind(this), (req, res) => {
      const { type, name } = req.params;
      const duration = parseInt(req.query.duration as string) || 3600000;
      const data = this.monitor.getTimeSeries(type, name, duration);
      res.json(data);
    });

    // Get aggregated metrics
    this.app.get('/api/metrics/aggregated', this.authenticate.bind(this), (req, res) => {
      const interval = parseInt(req.query.interval as string) || 60000;
      const data = this.monitor.getAggregatedMetrics(interval);
      res.json(data);
    });

    // Create alert
    this.app.post('/api/alerts', this.authenticate.bind(this), (req, res) => {
      const { type, source, message, metadata } = req.body;
      const alertId = this.monitor.createAlert(type, source, message, metadata);
      res.json({ alertId });
    });

    // Resolve alert
    this.app.post('/api/alerts/:id/resolve', this.authenticate.bind(this), (req, res) => {
      this.monitor.resolveAlert(req.params.id);
      res.json({ success: true });
    });

    // Export metrics
    this.app.get('/api/export', this.authenticate.bind(this), (req, res) => {
      const data = this.monitor.exportMetrics();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=metrics-${Date.now()}.json`);
      res.send(data);
    });

    // Serve static dashboard HTML
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }

  /**
   * Setup WebSocket connections
   */
  private setupWebSocket(): void {
    this.io.on('connection', (socket: Socket) => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Client connected: ${socket.id}`);
      }

      // Send initial dashboard data
      socket.emit('dashboard:data', this.monitor.getDashboardData());

      // Handle client requests
      socket.on('metrics:subscribe', (metric: { type: string; name: string }) => {
        socket.join(`metric:${metric.type}:${metric.name}`);
      });

      socket.on('metrics:unsubscribe', (metric: { type: string; name: string }) => {
        socket.leave(`metric:${metric.type}:${metric.name}`);
      });

      socket.on('disconnect', () => {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`Client disconnected: ${socket.id}`);
        }
      });
    });

    // Broadcast updates periodically
    this.updateInterval = setInterval(() => {
      this.io.emit('dashboard:update', this.monitor.getDashboardData());
    }, 1000);
  }

  /**
   * Setup monitor event listeners
   */
  private setupMonitorListeners(): void {
    // Forward metric events
    this.monitor.on('metric:recorded', (metric) => {
      this.io.to(`metric:${metric.type}:${metric.name}`).emit('metric:update', metric);
    });

    // Forward agent updates
    this.monitor.on('agent:updated', (agent) => {
      this.io.emit('agent:update', agent);
    });

    // Forward tool updates
    this.monitor.on('tool:updated', (tool) => {
      this.io.emit('tool:update', tool);
    });

    // Forward system updates
    this.monitor.on('system:updated', (system) => {
      this.io.emit('system:update', system);
    });

    // Forward alerts
    this.monitor.on('alert:created', (alert) => {
      this.io.emit('alert:new', alert);
    });

    this.monitor.on('alert:resolved', (alert) => {
      this.io.emit('alert:resolved', alert);
    });

    // Forward aggregated metrics
    this.monitor.on('metrics:aggregated', (data) => {
      this.io.emit('metrics:aggregated', data);
    });
  }

  /**
   * Authentication middleware
   */
  private authenticate(req: express.Request, res: express.Response, next: express.NextFunction): void {
    if (this.config.authToken) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token !== this.config.authToken) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    }
    next();
  }

  /**
   * Start the server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        if (process.env.NODE_ENV !== 'test') {
          console.log(`Dashboard server running at http://${this.config.host}:${this.config.port}`);
        }
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }

      this.io.close(() => {
        this.server.close(() => {
          resolve();
        });
      });
    });
  }

  /**
   * Create mock Socket.IO server
   */
  private createMockSocketIO(): SocketIOServer {
    const rooms = new Map<string, Set<string>>();
    const sockets = new Map<string, Socket>();
    
    return {
      on: (event: string, handler: Function) => {
        // Mock connection handling
        if (event === 'connection') {
          // Simulate a connection for testing
          setTimeout(() => {
            const mockSocket: Socket = {
              id: `mock_${Date.now()}`,
              join: (room: string) => {
                if (!rooms.has(room)) {
                  rooms.set(room, new Set());
                }
                rooms.get(room)!.add(mockSocket.id);
              },
              leave: (room: string) => {
                rooms.get(room)?.delete(mockSocket.id);
              },
              emit: () => {},
              on: () => {},
            };
            sockets.set(mockSocket.id, mockSocket);
            handler(mockSocket);
          }, 100);
        }
      },
      emit: () => {},
      to: (room: string) => ({
        emit: () => {},
      }),
      close: (callback: Function) => {
        callback();
      },
    };
  }

  /**
   * Get dashboard HTML
   */
  private getDashboardHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Agent Performance Dashboard</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 10px 0;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .metric-label {
            color: #666;
            font-size: 14px;
        }
        .alert {
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            font-size: 14px;
        }
        .alert-warning {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .alert-critical {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        .chart-container {
            position: relative;
            height: 300px;
            margin-top: 20px;
        }
        h1, h2 {
            margin: 0 0 20px 0;
            color: #333;
        }
        .status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .status-active { background: #28a745; }
        .status-inactive { background: #dc3545; }
        .status-warning { background: #ffc107; }
    </style>
</head>
<body>
    <h1>Agent Performance Dashboard</h1>
    
    <div class="dashboard">
        <div class="card">
            <h2>System Overview</h2>
            <div id="system-metrics">
                <div class="metric">
                    <span class="metric-label">Active Agents</span>
                    <span class="metric-value" id="active-agents">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Tasks/min</span>
                    <span class="metric-value" id="tasks-per-minute">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Avg Response Time</span>
                    <span class="metric-value" id="avg-response-time">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Queue Depth</span>
                    <span class="metric-value" id="queue-depth">-</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Active Alerts</h2>
            <div id="alerts-container"></div>
        </div>
        
        <div class="card">
            <h2>Agent Status</h2>
            <div id="agents-list"></div>
        </div>
        
        <div class="card">
            <h2>Tool Performance</h2>
            <div id="tools-list"></div>
        </div>
        
        <div class="card" style="grid-column: 1 / -1;">
            <h2>Performance Trends</h2>
            <div class="chart-container">
                <canvas id="performance-chart"></canvas>
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let performanceChart;

        // Initialize Chart
        const ctx = document.getElementById('performance-chart').getContext('2d');
        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Response Time (ms)',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: 'Throughput (tasks/min)',
                        data: [],
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left'
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });

        // Update dashboard with new data
        function updateDashboard(data) {
            // Update system metrics
            if (data.system) {
                document.getElementById('active-agents').textContent = data.system.activeAgents;
                document.getElementById('tasks-per-minute').textContent = data.system.tasksPerMinute.toFixed(1);
                document.getElementById('avg-response-time').textContent = data.system.averageResponseTime.toFixed(0) + 'ms';
                
                const queueDepth = Object.values(data.system.queueMetrics.queueDepth).reduce((a, b) => a + b, 0);
                document.getElementById('queue-depth').textContent = queueDepth;
            }

            // Update alerts
            const alertsContainer = document.getElementById('alerts-container');
            alertsContainer.innerHTML = data.alerts.length === 0 ? '<p style="color: #666;">No active alerts</p>' : '';
            data.alerts.forEach(alert => {
                const alertDiv = document.createElement('div');
                alertDiv.className = \`alert alert-\${alert.type}\`;
                alertDiv.textContent = \`[\${alert.source}] \${alert.message}\`;
                alertsContainer.appendChild(alertDiv);
            });

            // Update agents list
            const agentsList = document.getElementById('agents-list');
            agentsList.innerHTML = '';
            data.agents.forEach(agent => {
                const agentDiv = document.createElement('div');
                agentDiv.className = 'metric';
                const isActive = new Date() - new Date(agent.lastActive) < 60000;
                agentDiv.innerHTML = \`
                    <span>
                        <span class="status status-\${isActive ? 'active' : 'inactive'}"></span>
                        \${agent.agentName}
                    </span>
                    <span>SR: \${(agent.successRate * 100).toFixed(1)}%</span>
                \`;
                agentsList.appendChild(agentDiv);
            });

            // Update tools list
            const toolsList = document.getElementById('tools-list');
            toolsList.innerHTML = '';
            data.tools.slice(0, 5).forEach(tool => {
                const toolDiv = document.createElement('div');
                toolDiv.className = 'metric';
                toolDiv.innerHTML = \`
                    <span style="font-size: 12px;">\${tool.toolName.split('.').pop()}</span>
                    <span>ER: \${(tool.errorRate * 100).toFixed(1)}%</span>
                \`;
                toolsList.appendChild(toolDiv);
            });
        }

        // Handle socket events
        socket.on('dashboard:data', updateDashboard);
        socket.on('dashboard:update', updateDashboard);

        socket.on('metrics:aggregated', (data) => {
            // Update chart
            const label = new Date(data.timestamp).toLocaleTimeString();
            performanceChart.data.labels.push(label);
            performanceChart.data.datasets[0].data.push(data.avgResponseTime);
            performanceChart.data.datasets[1].data.push(data.throughput);

            // Keep only last 20 points
            if (performanceChart.data.labels.length > 20) {
                performanceChart.data.labels.shift();
                performanceChart.data.datasets.forEach(dataset => dataset.data.shift());
            }

            performanceChart.update();
        });

        socket.on('alert:new', (alert) => {
            console.log('New alert:', alert);
        });
    </script>
</body>
</html>
    `;
  }
}