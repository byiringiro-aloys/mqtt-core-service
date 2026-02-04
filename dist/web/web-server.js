"use strict";
/**
 * Web Server for MQTT Broker Dashboard with Sidebar Navigation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebServer = void 0;
const http = __importStar(require("http"));
class WebServer {
    constructor(broker, port = 8080) {
        this.broker = broker;
        this.port = port;
        this.server = http.createServer(this.handleRequest.bind(this));
    }
    handleRequest(req, res) {
        const url = req.url || '/';
        // Handle WebSocket upgrade requests by rejecting them
        if (req.headers.upgrade === 'websocket') {
            res.writeHead(426, { 'Content-Type': 'text/plain' });
            res.end('WebSocket not supported on this endpoint. Use MQTT TCP on port 1883.');
            return;
        }
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        try {
            if (url === '/' || url === '/index.html') {
                this.serveDashboard(res);
            }
            else if (url === '/api/stats') {
                this.serveStats(res);
            }
            else if (url === '/api/config') {
                this.serveConfig(res);
            }
            else if (url === '/health') {
                this.serveHealth(res);
            }
            else {
                this.serve404(res);
            }
        }
        catch (error) {
            this.serve500(res, error);
        }
    }
    serveDashboard(res) {
        const html = this.generateDashboardHTML();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    async serveStats(res) {
        const stats = this.broker.getStats();
        // Get storage stats if available
        let storageStats = null;
        try {
            if (this.broker.getStorageManager && this.broker.getStorageManager().isReady()) {
                storageStats = await this.broker.getStorageManager().getStats();
            }
        }
        catch (error) {
            console.error('Failed to get storage stats:', error);
        }
        const extendedStats = {
            ...stats,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            storage: storageStats
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(extendedStats, null, 2));
    }
    serveConfig(res) {
        const config = this.broker.getConfig();
        // Remove sensitive information
        const safeConfig = {
            ...config,
            security: {
                ...config.security,
                certFile: config.security.certFile ? '[CONFIGURED]' : null,
                keyFile: config.security.keyFile ? '[CONFIGURED]' : null
            }
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(safeConfig, null, 2));
    }
    serveHealth(res) {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0'
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
    }
    serve404(res) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
      <html>
        <head><title>404 - Not Found</title></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p><a href="/">Go to MQTT Broker Dashboard</a></p>
        </body>
      </html>
    `);
    }
    serve500(res, error) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
      <html>
        <head><title>500 - Server Error</title></head>
        <body>
          <h1>500 - Internal Server Error</h1>
          <p>Error: ${error.message}</p>
          <p><a href="/">Go to MQTT Broker Dashboard</a></p>
        </body>
      </html>
    `);
    }
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MQTT Broker Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #000;
            color: #e0e0e0;
            overflow-x: hidden;
        }

        /* Sidebar Styles */
        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 280px;
            height: 100vh;
            background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%);
            color: #e0e0e0;
            z-index: 1000;
            transition: transform 0.3s ease;
            overflow-y: auto;
            border-right: 1px solid #222;
        }

        .sidebar-header {
            padding: 30px 20px;
            border-bottom: 1px solid #222;
            text-align: center;
            background: rgba(0,0,0,0.3);
        }

        .sidebar-header h1 {
            font-size: 1.8em;
            margin-bottom: 5px;
            color: #fff;
        }

        .sidebar-header p {
            font-size: 0.9em;
            opacity: 0.7;
            color: #ccc;
        }

        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #00ff88;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .nav-menu {
            padding: 20px 0;
        }

        .nav-item {
            display: block;
            padding: 15px 25px;
            color: rgba(224,224,224,0.8);
            text-decoration: none;
            transition: all 0.3s ease;
            border-left: 3px solid transparent;
            cursor: pointer;
        }

        .nav-item:hover, .nav-item.active {
            background: rgba(0,0,0,0.4);
            border-left-color: #00ff88;
            color: #fff;
        }

        .nav-item i {
            margin-right: 12px;
            width: 20px;
            text-align: center;
        }

        /* Main Content */
        .main-content {
            margin-left: 280px;
            min-height: 100vh;
            background: #000;
        }

        .top-bar {
            background: #111;
            padding: 20px 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #222;
        }

        .page-title {
            font-size: 1.8em;
            color: #fff;
            font-weight: 600;
        }

        .refresh-btn {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9em;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .refresh-btn:hover {
            background: #00cc6a;
            transform: translateY(-1px);
        }

        .content-area {
            padding: 30px;
        }

        /* Page Sections */
        .page-section {
            display: none;
        }

        .page-section.active {
            display: block;
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }

        .stat-card {
            background: #111;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-left: 4px solid #00ff88;
            border: 1px solid #222;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.7);
            background: #1a1a1a;
        }

        .stat-card h3 {
            color: #e0e0e0;
            margin-bottom: 15px;
            font-size: 1.1em;
            font-weight: 600;
        }

        .stat-value {
            font-size: 2.2em;
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 8px;
        }

        .stat-label {
            color: #aaa;
            font-size: 0.85em;
        }

        /* Info Cards */
        .info-card {
            background: #111;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            margin-bottom: 25px;
            border: 1px solid #222;
        }

        .info-card h2 {
            color: #fff;
            margin-bottom: 20px;
            font-size: 1.4em;
            font-weight: 600;
        }

        .connection-info {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #00ff88;
            border: 1px solid #333;
        }

        .connection-info h4 {
            color: #e0e0e0;
            margin-bottom: 12px;
            font-size: 1em;
        }

        .connection-info code {
            background: #000;
            color: #00ff88;
            padding: 10px 15px;
            border-radius: 6px;
            font-family: 'Consolas', 'Monaco', monospace;
            display: block;
            margin: 8px 0;
            font-size: 0.9em;
            word-break: break-all;
            border: 1px solid #333;
        }

        /* System Info */
        .system-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .system-info-item {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00ff88;
            border: 1px solid #333;
        }

        .system-info-item strong {
            color: #fff;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
            }
            
            .sidebar.mobile-open {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .mobile-menu-btn {
                display: block;
                background: #00ff88;
                color: #000;
                border: none;
                padding: 10px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: 600;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }

        .mobile-menu-btn {
            display: none;
        }

        /* Loading Animation */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #333;
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <!-- Sidebar -->
    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <h1><span class="status-indicator"></span>MQTT Broker</h1>
            <p>Real-time Dashboard</p>
        </div>
        
        <nav class="nav-menu">
            <a class="nav-item active" onclick="showPage('overview')" data-page="overview">
                <i>📊</i> Overview
            </a>
            <a class="nav-item" onclick="showPage('connections')" data-page="connections">
                <i>🔌</i> Connections
            </a>
            <a class="nav-item" onclick="showPage('topics')" data-page="topics">
                <i>📋</i> Topics & Messages
            </a>
            <a class="nav-item" onclick="showPage('clients')" data-page="clients">
                <i>👥</i> Client Sessions
            </a>
            <a class="nav-item" onclick="showPage('system')" data-page="system">
                <i>⚙️</i> System Info
            </a>
            <a class="nav-item" onclick="showPage('logs')" data-page="logs">
                <i>📝</i> Activity Logs
            </a>
            <a class="nav-item" onclick="showPage('settings')" data-page="settings">
                <i>🔧</i> Settings
            </a>
        </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Top Bar -->
        <div class="top-bar">
            <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
            <h1 class="page-title" id="pageTitle">Dashboard Overview</h1>
            <button class="refresh-btn" onclick="refreshStats()">
                <span id="refreshIcon">🔄</span> Refresh
            </button>
        </div>

        <!-- Content Area -->
        <div class="content-area">
            <!-- Overview Page -->
            <div class="page-section active" id="overview">
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>📡 Total Connections</h3>
                        <div class="stat-value" id="totalConnections">--</div>
                        <div class="stat-label">Active client connections</div>
                    </div>
                    <div class="stat-card">
                        <h3>👥 Active Sessions</h3>
                        <div class="stat-value" id="activeSessions">--</div>
                        <div class="stat-label">Connected sessions</div>
                    </div>
                    <div class="stat-card">
                        <h3>📋 Subscriptions</h3>
                        <div class="stat-value" id="totalSubscriptions">--</div>
                        <div class="stat-label">Topic subscriptions</div>
                    </div>
                    <div class="stat-card">
                        <h3>💾 Retained Messages</h3>
                        <div class="stat-value" id="retainedMessages">--</div>
                        <div class="stat-label">Stored messages</div>
                    </div>
                    <div class="stat-card">
                        <h3>⏱️ Uptime</h3>
                        <div class="stat-value" id="uptime">--</div>
                        <div class="stat-label">Server uptime</div>
                    </div>
                    <div class="stat-card">
                        <h3>💾 Memory Usage</h3>
                        <div class="stat-value" id="memoryUsage">--</div>
                        <div class="stat-label">RAM consumption</div>
                    </div>
                    <div class="stat-card">
                        <h3>🗄️ Stored Messages</h3>
                        <div class="stat-value" id="storedMessages">--</div>
                        <div class="stat-label">MongoDB messages</div>
                    </div>
                </div>
            </div>

            <!-- Connections Page -->
            <div class="page-section" id="connections">
                <div class="info-card">
                    <h2>🔌 Connection Information</h2>
                    
                    <div class="connection-info">
                        <h4>MQTT (TCP) Connection:</h4>
                        <code>mqtt://your-broker-domain.com:1883</code>
                        <code>mqtt://localhost:1883 (local development)</code>
                    </div>

                    <div class="connection-info">
                        <h4>MQTT over WebSocket:</h4>
                        <code>ws://your-broker-domain.com:2883</code>
                        <code>ws://localhost:2883 (local development)</code>
                    </div>

                    <div class="connection-info">
                        <h4>Example ESP8266/ESP32 Code:</h4>
                        <code>client.setServer("your-broker-domain.com", 1883);</code>
                    </div>

                    <div class="connection-info">
                        <h4>Example JavaScript (Web):</h4>
                        <code>const client = mqtt.connect('ws://your-broker-domain.com:2883');</code>
                    </div>
                </div>
            </div>

            <!-- Topics Page -->
            <div class="page-section" id="topics">
                <div class="info-card">
                    <h2>📋 Topics & Messages</h2>
                    <div class="system-info-grid">
                        <div class="system-info-item">
                            <strong>Active Topics:</strong> <span id="activeTopics">Loading...</span>
                        </div>
                        <div class="system-info-item">
                            <strong>Messages/Second:</strong> <span id="messagesPerSecond">Loading...</span>
                        </div>
                        <div class="system-info-item">
                            <strong>Total Messages:</strong> <span id="totalMessages">Loading...</span>
                        </div>
                        <div class="system-info-item">
                            <strong>Retained Messages:</strong> <span id="retainedCount">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Clients Page -->
            <div class="page-section" id="clients">
                <div class="info-card">
                    <h2>👥 Client Sessions</h2>
                    <div class="system-info-grid">
                        <div class="system-info-item">
                            <strong>Connected Clients:</strong> <span id="connectedClients">Loading...</span>
                        </div>
                        <div class="system-info-item">
                            <strong>Persistent Sessions:</strong> <span id="persistentSessions">Loading...</span>
                        </div>
                        <div class="system-info-item">
                            <strong>Clean Sessions:</strong> <span id="cleanSessions">Loading...</span>
                        </div>
                        <div class="system-info-item">
                            <strong>Inflight Messages:</strong> <span id="inflightMessages">Loading...</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- System Page -->
            <div class="page-section" id="system">
                <div class="info-card">
                    <h2>⚙️ System Information</h2>
                    <div id="systemInfo">Loading...</div>
                </div>
            </div>

            <!-- Logs Page -->
            <div class="page-section" id="logs">
                <div class="info-card">
                    <h2>📝 Activity Logs</h2>
                    <div id="activityLogs">
                        <p style="color: #7f8c8d; font-style: italic;">Real-time activity logging coming soon...</p>
                    </div>
                </div>
            </div>

            <!-- Settings Page -->
            <div class="page-section" id="settings">
                <div class="info-card">
                    <h2>🔧 Broker Settings</h2>
                    <div id="brokerSettings">Loading...</div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentPage = 'overview';

        // Page Navigation
        function showPage(pageId) {
            // Hide all pages
            document.querySelectorAll('.page-section').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show selected page
            document.getElementById(pageId).classList.add('active');
            
            // Update nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(\`[data-page="\${pageId}"]\`).classList.add('active');
            
            // Update page title
            const titles = {
                'overview': 'Dashboard Overview',
                'connections': 'Connection Information',
                'topics': 'Topics & Messages',
                'clients': 'Client Sessions',
                'system': 'System Information',
                'logs': 'Activity Logs',
                'settings': 'Broker Settings'
            };
            document.getElementById('pageTitle').textContent = titles[pageId] || 'Dashboard';
            
            currentPage = pageId;
            
            // Load page-specific data
            loadPageData(pageId);
        }

        // Mobile sidebar toggle
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        }

        // Load page-specific data
        function loadPageData(pageId) {
            switch(pageId) {
                case 'overview':
                    fetchStats();
                    break;
                case 'system':
                    fetchSystemInfo();
                    break;
                case 'settings':
                    fetchSettings();
                    break;
                case 'topics':
                    fetchTopicInfo();
                    break;
                case 'clients':
                    fetchClientInfo();
                    break;
            }
        }

        // Fetch main statistics
        async function fetchStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('totalConnections').textContent = stats.connections.total;
                document.getElementById('activeSessions').textContent = stats.sessions.connected;
                document.getElementById('totalSubscriptions').textContent = stats.subscriptions.total;
                document.getElementById('retainedMessages').textContent = stats.messages.retained;
                
                // Format uptime
                const uptimeHours = Math.floor(stats.uptime / 3600);
                const uptimeMinutes = Math.floor((stats.uptime % 3600) / 60);
                document.getElementById('uptime').textContent = uptimeHours + 'h ' + uptimeMinutes + 'm';
                
                // Format memory usage
                const memoryMB = Math.round(stats.memory.heapUsed / 1024 / 1024);
                document.getElementById('memoryUsage').textContent = memoryMB + ' MB';
                
                // Show storage statistics if available
                if (stats.storage) {
                    document.getElementById('storedMessages').textContent = stats.storage.totalMessages || 0;
                } else {
                    document.getElementById('storedMessages').textContent = 'N/A';
                }
                
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        }

        // Fetch system information
        async function fetchSystemInfo() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('systemInfo').innerHTML = \`
                    <div class="system-info-grid">
                        <div class="system-info-item">
                            <strong>Last Updated:</strong> \${new Date(stats.timestamp).toLocaleString()}
                        </div>
                        <div class="system-info-item">
                            <strong>TCP Connections:</strong> \${stats.connections.tcp}
                        </div>
                        <div class="system-info-item">
                            <strong>WebSocket Connections:</strong> \${stats.connections.websocket}
                        </div>
                        <div class="system-info-item">
                            <strong>Total Sessions:</strong> \${stats.sessions.total}
                        </div>
                        <div class="system-info-item">
                            <strong>Memory Heap Used:</strong> \${Math.round(stats.memory.heapUsed / 1024 / 1024)} MB
                        </div>
                        <div class="system-info-item">
                            <strong>Memory Heap Total:</strong> \${Math.round(stats.memory.heapTotal / 1024 / 1024)} MB
                        </div>
                        <div class="system-info-item">
                            <strong>Process Uptime:</strong> \${Math.floor(stats.uptime / 3600)}h \${Math.floor((stats.uptime % 3600) / 60)}m
                        </div>
                        <div class="system-info-item">
                            <strong>Inflight QoS1:</strong> \${stats.messages.inflight.qos1}
                        </div>
                        <div class="system-info-item">
                            <strong>Inflight QoS2:</strong> \${stats.messages.inflight.qos2}
                        </div>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('systemInfo').innerHTML = '<p style="color: red;">Failed to load system information</p>';
            }
        }

        // Fetch broker settings
        async function fetchSettings() {
            try {
                const response = await fetch('/api/config');
                const config = await response.json();
                
                document.getElementById('brokerSettings').innerHTML = \`
                    <div class="system-info-grid">
                        <div class="system-info-item">
                            <strong>Server Port:</strong> \${config.server.port}
                        </div>
                        <div class="system-info-item">
                            <strong>Server Host:</strong> \${config.server.host}
                        </div>
                        <div class="system-info-item">
                            <strong>Max Connections:</strong> \${config.server.maxConnections}
                        </div>
                        <div class="system-info-item">
                            <strong>Keep Alive Timeout:</strong> \${config.server.keepAliveTimeout}ms
                        </div>
                        <div class="system-info-item">
                            <strong>TLS Enabled:</strong> \${config.security.enableTLS ? 'Yes' : 'No'}
                        </div>
                        <div class="system-info-item">
                            <strong>Auth Required:</strong> \${config.security.requireAuth ? 'Yes' : 'No'}
                        </div>
                        <div class="system-info-item">
                            <strong>Persistence:</strong> \${config.persistence.enabled ? 'Enabled' : 'Disabled'}
                        </div>
                        <div class="system-info-item">
                            <strong>Storage Type:</strong> \${config.persistence.storageType}
                        </div>
                        <div class="system-info-item">
                            <strong>Message Queue Limit:</strong> \${config.performance.messageQueueLimit}
                        </div>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('brokerSettings').innerHTML = '<p style="color: red;">Failed to load broker settings</p>';
            }
        }

        // Fetch topic information
        function fetchTopicInfo() {
            // Placeholder for topic-specific data
            document.getElementById('activeTopics').textContent = 'N/A';
            document.getElementById('messagesPerSecond').textContent = 'N/A';
            document.getElementById('totalMessages').textContent = 'N/A';
            document.getElementById('retainedCount').textContent = 'N/A';
        }

        // Fetch client information
        function fetchClientInfo() {
            // Placeholder for client-specific data
            document.getElementById('connectedClients').textContent = 'N/A';
            document.getElementById('persistentSessions').textContent = 'N/A';
            document.getElementById('cleanSessions').textContent = 'N/A';
            document.getElementById('inflightMessages').textContent = 'N/A';
        }

        // Refresh current page data
        function refreshStats() {
            const refreshIcon = document.getElementById('refreshIcon');
            refreshIcon.innerHTML = '<div class="loading"></div>';
            
            loadPageData(currentPage);
            
            setTimeout(() => {
                refreshIcon.textContent = '🔄';
            }, 1000);
        }

        // Auto-refresh every 10 seconds
        setInterval(() => {
            if (currentPage === 'overview') {
                fetchStats();
            }
        }, 10000);
        
        // Initial load
        fetchStats();
    </script>
</body>
</html>
    `;
    }
    start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                resolve();
            });
        });
    }
    stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                resolve();
            });
        });
    }
}
exports.WebServer = WebServer;
//# sourceMappingURL=web-server.js.map