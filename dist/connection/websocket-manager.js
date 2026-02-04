"use strict";
/**
 * WebSocket Connection Manager for MQTT over WebSocket
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
exports.WebSocketConnectionManager = void 0;
const WebSocket = __importStar(require("ws"));
const events_1 = require("events");
const uuid_1 = require("uuid");
class WebSocketConnectionManager extends events_1.EventEmitter {
    constructor(config, httpServer) {
        super();
        this.connections = new Map();
        this.connectionCount = 0;
        this.config = config;
        // Only create WebSocket server if not sharing HTTP server
        // For Render deployment, we'll use a separate port
        this.server = new WebSocket.Server({
            port: config.server.port, // Use the configured WebSocket port
            perMessageDeflate: false // Disable compression for MQTT
        });
        this.setupServerEvents();
    }
    setupServerEvents() {
        this.server.on('connection', (ws, request) => {
            this.handleNewConnection(ws, request);
        });
        this.server.on('error', (error) => {
            this.emit('error', error);
        });
    }
    handleNewConnection(ws, request) {
        // Check connection limits
        if (this.connectionCount >= this.config.server.maxConnections) {
            ws.close();
            return;
        }
        const connection = this.acceptConnection(ws, request);
        ws.on('message', (data) => {
            // WebSocket message should contain MQTT packet
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
            this.emit('data', connection.id, buffer);
        });
        ws.on('close', () => {
            this.handleConnectionClose(connection.id);
        });
        ws.on('error', (error) => {
            this.emit('connectionError', connection.id, error);
            this.handleConnectionClose(connection.id);
        });
        this.emit('connection', connection);
    }
    handleConnectionClose(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.connections.delete(connectionId);
            this.connectionCount--;
            this.emit('disconnect', connection);
        }
    }
    /**
     * Accept a new WebSocket connection
     */
    acceptConnection(ws, request) {
        const connectionId = (0, uuid_1.v4)();
        const now = Date.now();
        const connection = {
            id: connectionId,
            clientId: '', // Will be set during CONNECT packet processing
            protocol: 'WebSocket',
            remoteAddress: request.socket?.remoteAddress || 'unknown',
            connectTime: now,
            lastActivity: now,
            keepAlive: 60, // Default, will be updated from CONNECT packet
            session: null, // Will be set by session manager
            socket: ws,
            authenticated: false
        };
        this.connections.set(connectionId, connection);
        this.connectionCount++;
        return connection;
    }
    /**
     * Close a WebSocket connection
     */
    closeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.socket) {
            connection.socket.close();
            this.handleConnectionClose(connectionId);
        }
    }
    /**
     * Send data to a WebSocket connection
     */
    async sendData(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            throw new Error(`Connection ${connectionId} not found`);
        }
        const ws = connection.socket;
        if (ws.readyState !== WebSocket.WebSocket.OPEN) {
            throw new Error(`Connection ${connectionId} is not open`);
        }
        return new Promise((resolve, reject) => {
            ws.send(data, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    connection.lastActivity = Date.now();
                    resolve();
                }
            });
        });
    }
    /**
     * Get current connection count
     */
    getConnectionCount() {
        return this.connectionCount;
    }
    /**
     * Get connection by ID
     */
    getConnection(connectionId) {
        return this.connections.get(connectionId);
    }
    /**
     * Get all connections
     */
    getAllConnections() {
        return Array.from(this.connections.values());
    }
    /**
     * Close the WebSocket server
     */
    close() {
        return new Promise((resolve) => {
            // Close all connections
            for (const connection of this.connections.values()) {
                connection.socket.close();
            }
            this.connections.clear();
            this.connectionCount = 0;
            this.server.close(() => {
                resolve();
            });
        });
    }
    /**
     * Update connection's last activity timestamp
     */
    updateActivity(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.lastActivity = Date.now();
        }
    }
    /**
     * Check for inactive connections and close them
     */
    checkKeepAlive() {
        const now = Date.now();
        const connectionsToClose = [];
        for (const [connectionId, connection] of this.connections) {
            const timeout = connection.keepAlive * 1000 * 1.5; // 1.5x keep alive as grace period
            if (now - connection.lastActivity > timeout) {
                connectionsToClose.push(connectionId);
            }
        }
        for (const connectionId of connectionsToClose) {
            this.closeConnection(connectionId);
        }
    }
}
exports.WebSocketConnectionManager = WebSocketConnectionManager;
//# sourceMappingURL=websocket-manager.js.map