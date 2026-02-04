/**
 * WebSocket Connection Manager for MQTT over WebSocket
 */

import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ClientConnection, BrokerConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class WebSocketConnectionManager extends EventEmitter {
  private server: WebSocket.Server;
  private connections: Map<string, ClientConnection> = new Map();
  private config: BrokerConfig;
  private connectionCount = 0;

  constructor(config: BrokerConfig, httpServer?: any) {
    super();
    this.config = config;
    
    this.server = new WebSocket.Server({
      port: httpServer ? undefined : config.server.port + 1, // Use different port if no HTTP server
      server: httpServer,
      perMessageDeflate: false // Disable compression for MQTT
    });

    this.setupServerEvents();
  }

  private setupServerEvents(): void {
    this.server.on('connection', (ws, request) => {
      this.handleNewConnection(ws, request);
    });

    this.server.on('error', (error) => {
      this.emit('error', error);
    });
  }

  private handleNewConnection(ws: WebSocket.WebSocket, request: any): void {
    // Check connection limits
    if (this.connectionCount >= this.config.server.maxConnections) {
      ws.close();
      return;
    }

    const connection = this.acceptConnection(ws, request);
    
    ws.on('message', (data) => {
      // WebSocket message should contain MQTT packet
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
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

  private handleConnectionClose(connectionId: string): void {
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
  acceptConnection(ws: WebSocket.WebSocket, request: any): ClientConnection {
    const connectionId = uuidv4();
    const now = Date.now();

    const connection: ClientConnection = {
      id: connectionId,
      clientId: '', // Will be set during CONNECT packet processing
      protocol: 'WebSocket',
      remoteAddress: request.socket?.remoteAddress || 'unknown',
      connectTime: now,
      lastActivity: now,
      keepAlive: 60, // Default, will be updated from CONNECT packet
      session: null as any, // Will be set by session manager
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
  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.socket) {
      (connection.socket as WebSocket).close();
      this.handleConnectionClose(connectionId);
    }
  }

  /**
   * Send data to a WebSocket connection
   */
  async sendData(connectionId: string, data: Buffer): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const ws = connection.socket as WebSocket.WebSocket;
    if (ws.readyState !== WebSocket.WebSocket.OPEN) {
      throw new Error(`Connection ${connectionId} is not open`);
    }

    return new Promise((resolve, reject) => {
      ws.send(data, (error) => {
        if (error) {
          reject(error);
        } else {
          connection.lastActivity = Date.now();
          resolve();
        }
      });
    });
  }

  /**
   * Get current connection count
   */
  getConnectionCount(): number {
    return this.connectionCount;
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): ClientConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Close the WebSocket server
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      // Close all connections
      for (const connection of this.connections.values()) {
        (connection.socket as WebSocket.WebSocket).close();
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
  updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }

  /**
   * Check for inactive connections and close them
   */
  checkKeepAlive(): void {
    const now = Date.now();
    const connectionsToClose: string[] = [];

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