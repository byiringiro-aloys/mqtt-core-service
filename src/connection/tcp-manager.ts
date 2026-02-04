/**
 * TCP Connection Manager for MQTT broker
 */

import * as net from 'net';
import * as tls from 'tls';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { ConnectionManager, ClientConnection, BrokerConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TCPConnectionManager extends EventEmitter implements ConnectionManager {
  private server: net.Server | tls.Server;
  private connections: Map<string, ClientConnection> = new Map();
  private config: BrokerConfig;
  private connectionCount = 0;

  constructor(config: BrokerConfig) {
    super();
    this.config = config;
    
    if (config.security.enableTLS) {
      this.server = this.createTLSServer();
    } else {
      this.server = this.createTCPServer();
    }

    this.setupServerEvents();
  }

  private createTCPServer(): net.Server {
    return net.createServer((socket) => {
      this.handleNewConnection(socket);
    });
  }

  private createTLSServer(): tls.Server {
    const options: tls.TlsOptions = {};
    
    if (this.config.security.certFile && this.config.security.keyFile) {
      options.cert = fs.readFileSync(this.config.security.certFile);
      options.key = fs.readFileSync(this.config.security.keyFile);
    }

    return tls.createServer(options, (socket) => {
      this.handleNewConnection(socket);
    });
  }

  private setupServerEvents(): void {
    this.server.on('error', (error) => {
      this.emit('error', error);
    });

    this.server.on('listening', () => {
      this.emit('listening');
    });
  }

  private handleNewConnection(socket: net.Socket | tls.TLSSocket): void {
    // Check connection limits
    if (this.connectionCount >= this.config.server.maxConnections) {
      socket.destroy();
      return;
    }

    const connection = this.acceptConnection(socket);
    
    socket.on('data', (data) => {
      this.emit('data', connection.id, data);
    });

    socket.on('close', () => {
      this.handleConnectionClose(connection.id);
    });

    socket.on('error', (error) => {
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
   * Accept a new connection and create ClientConnection object
   */
  acceptConnection(socket: net.Socket | tls.TLSSocket): ClientConnection {
    const connectionId = uuidv4();
    const now = Date.now();

    const connection: ClientConnection = {
      id: connectionId,
      clientId: '', // Will be set during CONNECT packet processing
      protocol: 'TCP',
      remoteAddress: socket.remoteAddress || 'unknown',
      connectTime: now,
      lastActivity: now,
      keepAlive: 60, // Default, will be updated from CONNECT packet
      session: null as any, // Will be set by session manager
      socket,
      authenticated: false
    };

    this.connections.set(connectionId, connection);
    this.connectionCount++;

    return connection;
  }

  /**
   * Close a connection
   */
  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.socket.destroy();
      this.handleConnectionClose(connectionId);
    }
  }

  /**
   * Send data to a connection
   */
  async sendData(connectionId: string, data: Buffer): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    return new Promise((resolve, reject) => {
      connection.socket.write(data, (error?: Error) => {
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
   * Start the server
   */
  listen(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.server.port, this.config.server.host, () => {
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the server
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      // Close all connections
      for (const connection of this.connections.values()) {
        connection.socket.destroy();
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