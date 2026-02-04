/**
 * Main MQTT Broker class
 */
import { EventEmitter } from 'events';
import { BrokerConfig } from './types';
import { StorageManager } from './storage/storage-manager';
export declare class MQTTBroker extends EventEmitter {
    private config;
    private tcpManager;
    private wsManager;
    private sessionManager;
    private authManager;
    private messageRouter;
    private qosHandler;
    private protocolHandler;
    private storageManager;
    private connections;
    private running;
    constructor(config: BrokerConfig);
    /**
     * Setup event handlers for all components
     */
    private setupEventHandlers;
    /**
     * Start the broker
     */
    start(): Promise<void>;
    /**
     * Stop the broker
     */
    stop(): Promise<void>;
    /**
     * Handle new connection
     */
    private handleNewConnection;
    /**
     * Handle incoming data from connection
     */
    private handleIncomingData;
    /**
     * Handle MQTT packet
     */
    private handleMQTTPacket;
    /**
     * Handle CONNECT packet
     */
    private handleConnect;
    /**
     * Handle PUBLISH packet
     */
    private handlePublish;
    /**
     * Handle SUBSCRIBE packet
     */
    private handleSubscribe;
    /**
     * Handle UNSUBSCRIBE packet
     */
    private handleUnsubscribe;
    /**
     * Handle PUBACK packet
     */
    private handlePuback;
    /**
     * Handle PUBREC packet
     */
    private handlePubrec;
    /**
     * Handle PUBREL packet
     */
    private handlePubrel;
    /**
     * Handle PUBCOMP packet
     */
    private handlePubcomp;
    /**
     * Handle PINGREQ packet
     */
    private handlePingreq;
    /**
     * Handle DISCONNECT packet
     */
    private handleDisconnect;
    /**
     * Handle connection disconnection
     */
    private handleDisconnection;
    /**
     * Send CONNACK packet
     */
    private sendConnack;
    /**
     * Send PUBACK packet
     */
    private sendPuback;
    /**
     * Send PUBREC packet
     */
    private sendPubrec;
    /**
     * Send PUBREL packet
     */
    private sendPubrel;
    /**
     * Send PUBCOMP packet
     */
    private sendPubcomp;
    /**
     * Send SUBACK packet
     */
    private sendSuback;
    /**
     * Send UNSUBACK packet
     */
    private sendUnsuback;
    /**
     * Deliver message to client
     */
    private deliverMessageToClient;
    /**
     * Send data to connection
     */
    private sendToConnection;
    /**
     * Close connection
     */
    private closeConnection;
    /**
     * Find connection by client ID
     */
    private findConnectionByClientId;
    /**
     * Get broker statistics
     */
    getStats(): any;
    /**
     * Get broker configuration
     */
    getConfig(): BrokerConfig;
    /**
     * Get storage manager
     */
    getStorageManager(): StorageManager;
    /**
     * Check if broker is running
     */
    isRunning(): boolean;
}
//# sourceMappingURL=broker.d.ts.map