/**
 * TCP Connection Manager for MQTT broker
 */
import * as net from 'net';
import * as tls from 'tls';
import { EventEmitter } from 'events';
import { ConnectionManager, ClientConnection, BrokerConfig } from '../types';
export declare class TCPConnectionManager extends EventEmitter implements ConnectionManager {
    private server;
    private connections;
    private config;
    private connectionCount;
    constructor(config: BrokerConfig);
    private createTCPServer;
    private createTLSServer;
    private setupServerEvents;
    private handleNewConnection;
    private handleConnectionClose;
    /**
     * Accept a new connection and create ClientConnection object
     */
    acceptConnection(socket: net.Socket | tls.TLSSocket): ClientConnection;
    /**
     * Close a connection
     */
    closeConnection(connectionId: string): void;
    /**
     * Send data to a connection
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
     * Start the server
     */
    listen(): Promise<void>;
    /**
     * Stop the server
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
//# sourceMappingURL=tcp-manager.d.ts.map