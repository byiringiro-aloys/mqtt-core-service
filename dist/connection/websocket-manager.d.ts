/**
 * WebSocket Connection Manager for MQTT over WebSocket
 */
import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ClientConnection, BrokerConfig } from '../types';
export declare class WebSocketConnectionManager extends EventEmitter {
    private server;
    private connections;
    private config;
    private connectionCount;
    constructor(config: BrokerConfig, httpServer?: any);
    private setupServerEvents;
    private handleNewConnection;
    private handleConnectionClose;
    /**
     * Accept a new WebSocket connection
     */
    acceptConnection(ws: WebSocket.WebSocket, request: any): ClientConnection;
    /**
     * Close a WebSocket connection
     */
    closeConnection(connectionId: string): void;
    /**
     * Send data to a WebSocket connection
     */
    sendData(connectionId: string, data: Buffer): Promise<void>;
    /**
     * Get current connection count
     */
    getConnectionCount(): number;
    /**
     * Get connection by ID
     */
    getConnection(connectionId: string): ClientConnection | undefined;
    /**
     * Get all connections
     */
    getAllConnections(): ClientConnection[];
    /**
     * Close the WebSocket server
     */
    close(): Promise<void>;
    /**
     * Update connection's last activity timestamp
     */
    updateActivity(connectionId: string): void;
    /**
     * Check for inactive connections and close them
     */
    checkKeepAlive(): void;
}
//# sourceMappingURL=websocket-manager.d.ts.map