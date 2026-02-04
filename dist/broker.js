"use strict";
/**
 * Main MQTT Broker class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTTBroker = void 0;
const events_1 = require("events");
const types_1 = require("./types");
const tcp_manager_1 = require("./connection/tcp-manager");
const websocket_manager_1 = require("./connection/websocket-manager");
const session_manager_1 = require("./session/session-manager");
const auth_1 = require("./session/auth");
const message_router_1 = require("./routing/message-router");
const qos_handler_1 = require("./routing/qos-handler");
const handler_1 = require("./protocol/handler");
const storage_manager_1 = require("./storage/storage-manager");
class MQTTBroker extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.wsManager = null;
        this.connections = new Map();
        this.running = false;
        this.config = config;
        // Initialize components
        this.protocolHandler = new handler_1.MQTTProtocolHandler();
        this.sessionManager = new session_manager_1.SessionManager();
        this.authManager = new auth_1.AuthenticationManager(config.security.requireAuth);
        this.messageRouter = new message_router_1.MessageRouter();
        this.qosHandler = new qos_handler_1.QoSHandler();
        this.tcpManager = new tcp_manager_1.TCPConnectionManager(config);
        this.storageManager = new storage_manager_1.StorageManager(config);
        // Initialize WebSocket manager if needed
        if (config.server.port) {
            this.wsManager = new websocket_manager_1.WebSocketConnectionManager({
                ...config,
                server: {
                    ...config.server,
                    port: config.server.port + 1000 // Use port 2883 for WebSocket
                }
            });
        }
        this.setupEventHandlers();
    }
    /**
     * Setup event handlers for all components
     */
    setupEventHandlers() {
        // TCP connection events
        this.tcpManager.on('connection', (connection) => {
            this.handleNewConnection(connection);
        });
        this.tcpManager.on('data', (connectionId, data) => {
            this.handleIncomingData(connectionId, data);
        });
        this.tcpManager.on('disconnect', (connection) => {
            this.handleDisconnection(connection);
        });
        this.tcpManager.on('connectionError', (connectionId, error) => {
            this.emit('connectionError', connectionId, error);
        });
        // WebSocket connection events
        if (this.wsManager) {
            this.wsManager.on('connection', (connection) => {
                this.handleNewConnection(connection);
            });
            this.wsManager.on('data', (connectionId, data) => {
                this.handleIncomingData(connectionId, data);
            });
            this.wsManager.on('disconnect', (connection) => {
                this.handleDisconnection(connection);
            });
            this.wsManager.on('connectionError', (connectionId, error) => {
                this.emit('connectionError', connectionId, error);
            });
        }
        // QoS handler events
        this.qosHandler.on('deliverMessage', ({ clientId, message }) => {
            this.deliverMessageToClient(clientId, message);
        });
        this.qosHandler.on('sendPubrec', ({ clientId, packetId }) => {
            this.sendPubrec(clientId, packetId);
        });
        this.qosHandler.on('sendPubrel', ({ clientId, packetId }) => {
            this.sendPubrel(clientId, packetId);
        });
        this.qosHandler.on('sendPubcomp', ({ clientId, packetId }) => {
            this.sendPubcomp(clientId, packetId);
        });
        // Message router events
        this.messageRouter.on('messageRouted', ({ message, subscribers }) => {
            this.emit('messageRouted', { message, subscribers });
        });
    }
    /**
     * Start the broker
     */
    async start() {
        if (this.running) {
            throw new Error('Broker is already running');
        }
        try {
            // Initialize storage first
            if (this.config.persistence.enabled) {
                await this.storageManager.initialize();
                this.emit('storageInitialized');
            }
            // Start TCP server
            await this.tcpManager.listen();
            this.emit('tcpServerStarted', {
                host: this.config.server.host,
                port: this.config.server.port
            });
            // Start WebSocket server if configured
            if (this.wsManager) {
                // WebSocket server starts automatically with TCP server
                this.emit('wsServerStarted', {
                    host: this.config.server.host,
                    port: this.config.server.port + 1000
                });
            }
            this.running = true;
            this.emit('brokerStarted');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Stop the broker
     */
    async stop() {
        if (!this.running) {
            return;
        }
        try {
            // Close all connections
            for (const connection of this.connections.values()) {
                await this.closeConnection(connection.id, 'Server shutdown');
            }
            // Stop servers
            await this.tcpManager.close();
            if (this.wsManager) {
                await this.wsManager.close();
            }
            // Stop timers
            this.qosHandler.stopRetryTimer();
            this.sessionManager.stopExpiryTimer();
            // Shutdown storage
            if (this.config.persistence.enabled) {
                await this.storageManager.shutdown();
            }
            this.running = false;
            this.emit('brokerStopped');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Handle new connection
     */
    handleNewConnection(connection) {
        this.connections.set(connection.id, connection);
        this.emit('connectionAccepted', connection);
    }
    /**
     * Handle incoming data from connection
     */
    async handleIncomingData(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return;
        }
        try {
            // Parse MQTT packet
            const packet = this.protocolHandler.parsePacket(data);
            // Validate packet
            if (!this.protocolHandler.validatePacket(packet)) {
                await this.closeConnection(connectionId, 'Invalid packet');
                return;
            }
            // Update connection activity
            connection.lastActivity = Date.now();
            // Handle packet based on type
            await this.handleMQTTPacket(connection, packet);
        }
        catch (error) {
            this.emit('packetError', connectionId, error);
            await this.closeConnection(connectionId, 'Packet processing error');
        }
    }
    /**
     * Handle MQTT packet
     */
    async handleMQTTPacket(connection, packet) {
        switch (packet.type) {
            case types_1.PacketType.CONNECT:
                await this.handleConnect(connection, packet);
                break;
            case types_1.PacketType.PUBLISH:
                await this.handlePublish(connection, packet);
                break;
            case types_1.PacketType.SUBSCRIBE:
                await this.handleSubscribe(connection, packet);
                break;
            case types_1.PacketType.UNSUBSCRIBE:
                await this.handleUnsubscribe(connection, packet);
                break;
            case types_1.PacketType.PUBACK:
                this.handlePuback(connection, packet);
                break;
            case types_1.PacketType.PUBREC:
                this.handlePubrec(connection, packet);
                break;
            case types_1.PacketType.PUBREL:
                this.handlePubrel(connection, packet);
                break;
            case types_1.PacketType.PUBCOMP:
                this.handlePubcomp(connection, packet);
                break;
            case types_1.PacketType.PINGREQ:
                await this.handlePingreq(connection);
                break;
            case types_1.PacketType.DISCONNECT:
                await this.handleDisconnect(connection);
                break;
            default:
                this.emit('unknownPacket', connection.id, packet.type);
        }
    }
    /**
     * Handle CONNECT packet
     */
    async handleConnect(connection, packet) {
        try {
            const connectPacket = this.protocolHandler.getParser().parseConnectPacket(packet.payload);
            // Validate protocol
            if (connectPacket.protocolName !== 'MQTT' || connectPacket.protocolVersion !== 4) {
                await this.sendConnack(connection, false, types_1.ConnectReturnCode.UNACCEPTABLE_PROTOCOL_VERSION);
                await this.closeConnection(connection.id, 'Unsupported protocol');
                return;
            }
            // Authenticate
            const authResult = this.authManager.authenticate(connectPacket.username, connectPacket.password);
            if (!authResult.success) {
                await this.sendConnack(connection, false, types_1.ConnectReturnCode.BAD_USERNAME_OR_PASSWORD);
                await this.closeConnection(connection.id, 'Authentication failed');
                return;
            }
            // Create or restore session
            let session = this.sessionManager.getSession(connectPacket.clientId);
            // Try to restore session from storage if not in memory
            if (!session && this.config.persistence.enabled && this.storageManager.isReady()) {
                try {
                    const storedSession = await this.storageManager.getStorage().getSession(connectPacket.clientId);
                    if (storedSession && !connectPacket.flags.cleanSession) {
                        session = storedSession;
                        this.sessionManager.restoreSession(connectPacket.clientId, session);
                    }
                }
                catch (storageError) {
                    console.error('❌ Failed to restore session from storage:', storageError);
                }
            }
            // Create new session if none exists or clean session requested
            if (!session || connectPacket.flags.cleanSession) {
                session = this.sessionManager.createSession(connectPacket.clientId, connectPacket.flags.cleanSession);
            }
            session.keepAlive = connectPacket.keepAlive;
            // Store last will message
            if (connectPacket.flags.willFlag && connectPacket.willTopic && connectPacket.willMessage) {
                session.lastWillMessage = {
                    topic: connectPacket.willTopic,
                    payload: connectPacket.willMessage,
                    qos: connectPacket.flags.willQoS,
                    retain: connectPacket.flags.willRetain
                };
            }
            // Update connection
            connection.clientId = connectPacket.clientId;
            connection.keepAlive = connectPacket.keepAlive;
            connection.session = session;
            connection.authenticated = true;
            // Store session in persistent storage if enabled
            if (this.config.persistence.enabled && this.storageManager.isReady() && !connectPacket.flags.cleanSession) {
                try {
                    const ttl = 3600; // 1 hour default session expiry
                    await this.storageManager.getStorage().storeSession(connectPacket.clientId, session, ttl);
                }
                catch (storageError) {
                    console.error('❌ Failed to store session:', storageError);
                }
            }
            // Send CONNACK
            const sessionPresent = !connectPacket.flags.cleanSession && this.sessionManager.getSession(connectPacket.clientId) !== null;
            await this.sendConnack(connection, sessionPresent, types_1.ConnectReturnCode.ACCEPTED);
            // Deliver retained messages for existing subscriptions
            if (sessionPresent && session.subscriptions.size > 0) {
                for (const [topicFilter] of session.subscriptions) {
                    const retainedMessages = this.messageRouter.getRetainedMessages(topicFilter);
                    for (const message of retainedMessages) {
                        await this.deliverMessageToClient(connection.clientId, message);
                    }
                }
            }
            // Deliver queued messages
            const queuedMessages = this.sessionManager.getQueuedMessages(connectPacket.clientId);
            for (const message of queuedMessages) {
                await this.deliverMessageToClient(connection.clientId, message);
            }
            this.emit('clientConnected', {
                clientId: connectPacket.clientId,
                cleanSession: connectPacket.flags.cleanSession,
                keepAlive: connectPacket.keepAlive
            });
        }
        catch (error) {
            await this.sendConnack(connection, false, types_1.ConnectReturnCode.SERVER_UNAVAILABLE);
            await this.closeConnection(connection.id, 'Connect processing error');
        }
    }
    /**
     * Handle PUBLISH packet
     */
    async handlePublish(connection, packet) {
        if (!connection.authenticated) {
            await this.closeConnection(connection.id, 'Not authenticated');
            return;
        }
        try {
            const publishPacket = this.protocolHandler.getParser().parsePublishPacket(packet);
            // Validate topic
            if (!this.messageRouter.validatePublishTopic(publishPacket.topic)) {
                await this.closeConnection(connection.id, 'Invalid publish topic');
                return;
            }
            // Create message
            const message = this.messageRouter.createMessage(publishPacket.topic, publishPacket.payload, publishPacket.qos, publishPacket.retain, connection.clientId);
            // Store message in persistent storage if enabled
            if (this.config.persistence.enabled && this.storageManager.isReady()) {
                try {
                    await this.storageManager.getStorage().storeMessage(message);
                    // Store retained message if retain flag is set
                    if (message.retain) {
                        if (message.payload.length === 0) {
                            // Empty payload means delete retained message
                            await this.storageManager.getStorage().deleteRetainedMessage(message.topic);
                        }
                        else {
                            await this.storageManager.getStorage().storeRetainedMessage(message.topic, message);
                        }
                    }
                }
                catch (storageError) {
                    console.error('❌ Failed to store message:', storageError);
                    // Continue processing even if storage fails
                }
            }
            // Handle QoS flow
            if (publishPacket.qos === types_1.QoSLevel.AT_LEAST_ONCE && publishPacket.packetId) {
                // Send PUBACK for QoS 1
                await this.sendPuback(connection.clientId, publishPacket.packetId);
            }
            else if (publishPacket.qos === types_1.QoSLevel.EXACTLY_ONCE && publishPacket.packetId) {
                // Handle QoS 2 flow
                this.qosHandler.handleQoS2Publish(connection.clientId, publishPacket.packetId, message);
                return; // QoS handler will manage the flow
            }
            // Route message to subscribers
            const subscribers = this.messageRouter.routeMessage(message);
            // Deliver based on QoS
            if (message.qos === types_1.QoSLevel.AT_MOST_ONCE) {
                this.qosHandler.publishQoS0(message, subscribers);
            }
            else if (message.qos === types_1.QoSLevel.AT_LEAST_ONCE) {
                await this.qosHandler.publishQoS1(message, subscribers);
            }
            else if (message.qos === types_1.QoSLevel.EXACTLY_ONCE) {
                await this.qosHandler.publishQoS2(message, subscribers);
            }
            this.emit('messagePublished', {
                clientId: connection.clientId,
                topic: message.topic,
                qos: message.qos,
                retain: message.retain,
                subscriberCount: subscribers.length
            });
        }
        catch (error) {
            this.emit('publishError', connection.id, error);
        }
    }
    /**
     * Handle SUBSCRIBE packet
     */
    async handleSubscribe(connection, packet) {
        if (!connection.authenticated) {
            await this.closeConnection(connection.id, 'Not authenticated');
            return;
        }
        try {
            const subscribePacket = this.protocolHandler.getParser().parseSubscribePacket(packet.payload);
            const returnCodes = [];
            for (const subscription of subscribePacket.subscriptions) {
                // Validate topic filter
                if (!this.messageRouter.validateTopicFilter(subscription.topicFilter)) {
                    returnCodes.push(0x80); // Failure
                    continue;
                }
                // Add subscription
                this.messageRouter.addSubscription(subscription.topicFilter, connection.clientId, subscription.qos);
                this.sessionManager.addSubscription(connection.clientId, subscription.topicFilter, subscription.qos);
                returnCodes.push(subscription.qos);
                // Deliver retained messages
                const retainedMessages = this.messageRouter.getRetainedMessages(subscription.topicFilter);
                for (const message of retainedMessages) {
                    await this.deliverMessageToClient(connection.clientId, message);
                }
            }
            // Send SUBACK
            await this.sendSuback(connection.clientId, subscribePacket.packetId, returnCodes);
            this.emit('clientSubscribed', {
                clientId: connection.clientId,
                subscriptions: subscribePacket.subscriptions
            });
        }
        catch (error) {
            this.emit('subscribeError', connection.id, error);
        }
    }
    /**
     * Handle UNSUBSCRIBE packet
     */
    async handleUnsubscribe(connection, packet) {
        if (!connection.authenticated) {
            await this.closeConnection(connection.id, 'Not authenticated');
            return;
        }
        try {
            const unsubscribePacket = this.protocolHandler.getParser().parseUnsubscribePacket(packet.payload);
            for (const topicFilter of unsubscribePacket.topicFilters) {
                this.messageRouter.removeSubscription(topicFilter, connection.clientId);
                this.sessionManager.removeSubscription(connection.clientId, topicFilter);
            }
            // Send UNSUBACK
            await this.sendUnsuback(connection.clientId, unsubscribePacket.packetId);
            this.emit('clientUnsubscribed', {
                clientId: connection.clientId,
                topicFilters: unsubscribePacket.topicFilters
            });
        }
        catch (error) {
            this.emit('unsubscribeError', connection.id, error);
        }
    }
    /**
     * Handle PUBACK packet
     */
    handlePuback(connection, packet) {
        const packetId = packet.payload.readUInt16BE(0);
        this.qosHandler.handleAcknowledgment(packetId, connection.clientId, 'PUBACK');
    }
    /**
     * Handle PUBREC packet
     */
    handlePubrec(connection, packet) {
        const packetId = packet.payload.readUInt16BE(0);
        this.qosHandler.handleAcknowledgment(packetId, connection.clientId, 'PUBREC');
    }
    /**
     * Handle PUBREL packet
     */
    handlePubrel(connection, packet) {
        const packetId = packet.payload.readUInt16BE(0);
        this.qosHandler.handleAcknowledgment(packetId, connection.clientId, 'PUBREL');
    }
    /**
     * Handle PUBCOMP packet
     */
    handlePubcomp(connection, packet) {
        const packetId = packet.payload.readUInt16BE(0);
        this.qosHandler.handleAcknowledgment(packetId, connection.clientId, 'PUBCOMP');
    }
    /**
     * Handle PINGREQ packet
     */
    async handlePingreq(connection) {
        const pingrespPacket = this.protocolHandler.getSerializer().createPingrespPacket();
        await this.sendToConnection(connection.id, pingrespPacket);
    }
    /**
     * Handle DISCONNECT packet
     */
    async handleDisconnect(connection) {
        // Clear last will message for graceful disconnect
        if (connection.session) {
            connection.session.lastWillMessage = undefined;
        }
        await this.closeConnection(connection.id, 'Client disconnect');
    }
    /**
     * Handle connection disconnection
     */
    handleDisconnection(connection) {
        // Publish last will message if present
        if (connection.session?.lastWillMessage) {
            const willMessage = this.messageRouter.createMessage(connection.session.lastWillMessage.topic, connection.session.lastWillMessage.payload, connection.session.lastWillMessage.qos, connection.session.lastWillMessage.retain, connection.clientId);
            const subscribers = this.messageRouter.routeMessage(willMessage);
            this.qosHandler.publishQoS0(willMessage, subscribers);
        }
        // Update session
        if (connection.session) {
            this.sessionManager.disconnectSession(connection.clientId);
        }
        // Remove connection
        this.connections.delete(connection.id);
        this.emit('clientDisconnected', {
            clientId: connection.clientId,
            reason: 'Connection closed'
        });
    }
    /**
     * Send CONNACK packet
     */
    async sendConnack(connection, sessionPresent, returnCode) {
        const connackPacket = this.protocolHandler.getSerializer().createConnackPacket(sessionPresent, returnCode);
        await this.sendToConnection(connection.id, connackPacket);
    }
    /**
     * Send PUBACK packet
     */
    async sendPuback(clientId, packetId) {
        const connection = this.findConnectionByClientId(clientId);
        if (connection) {
            const pubackPacket = this.protocolHandler.getSerializer().createPubackPacket(packetId);
            await this.sendToConnection(connection.id, pubackPacket);
        }
    }
    /**
     * Send PUBREC packet
     */
    async sendPubrec(clientId, packetId) {
        const connection = this.findConnectionByClientId(clientId);
        if (connection) {
            const pubrecPacket = this.protocolHandler.getSerializer().createPubrecPacket(packetId);
            await this.sendToConnection(connection.id, pubrecPacket);
        }
    }
    /**
     * Send PUBREL packet
     */
    async sendPubrel(clientId, packetId) {
        const connection = this.findConnectionByClientId(clientId);
        if (connection) {
            const pubrelPacket = this.protocolHandler.getSerializer().createPubrelPacket(packetId);
            await this.sendToConnection(connection.id, pubrelPacket);
        }
    }
    /**
     * Send PUBCOMP packet
     */
    async sendPubcomp(clientId, packetId) {
        const connection = this.findConnectionByClientId(clientId);
        if (connection) {
            const pubcompPacket = this.protocolHandler.getSerializer().createPubcompPacket(packetId);
            await this.sendToConnection(connection.id, pubcompPacket);
        }
    }
    /**
     * Send SUBACK packet
     */
    async sendSuback(clientId, packetId, returnCodes) {
        const connection = this.findConnectionByClientId(clientId);
        if (connection) {
            const subackPacket = this.protocolHandler.getSerializer().createSubackPacket(packetId, returnCodes);
            await this.sendToConnection(connection.id, subackPacket);
        }
    }
    /**
     * Send UNSUBACK packet
     */
    async sendUnsuback(clientId, packetId) {
        const connection = this.findConnectionByClientId(clientId);
        if (connection) {
            const unsubackPacket = this.protocolHandler.getSerializer().createUnsubackPacket(packetId);
            await this.sendToConnection(connection.id, unsubackPacket);
        }
    }
    /**
     * Deliver message to client
     */
    async deliverMessageToClient(clientId, message) {
        const connection = this.findConnectionByClientId(clientId);
        if (connection && connection.session?.connected) {
            const publishPacket = this.protocolHandler.getSerializer().createPublishPacket(message);
            await this.sendToConnection(connection.id, publishPacket);
        }
        else {
            // Queue message for offline client
            this.sessionManager.queueMessage(clientId, message);
        }
    }
    /**
     * Send data to connection
     */
    async sendToConnection(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return;
        }
        try {
            if (connection.protocol === 'TCP') {
                await this.tcpManager.sendData(connectionId, data);
            }
            else if (connection.protocol === 'WebSocket' && this.wsManager) {
                await this.wsManager.sendData(connectionId, data);
            }
        }
        catch (error) {
            this.emit('sendError', connectionId, error);
            await this.closeConnection(connectionId, 'Send error');
        }
    }
    /**
     * Close connection
     */
    async closeConnection(connectionId, reason) {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return;
        }
        try {
            if (connection.protocol === 'TCP') {
                this.tcpManager.closeConnection(connectionId);
            }
            else if (connection.protocol === 'WebSocket' && this.wsManager) {
                this.wsManager.closeConnection(connectionId);
            }
        }
        catch (error) {
            this.emit('closeError', connectionId, error);
        }
        this.emit('connectionClosed', { connectionId, reason });
    }
    /**
     * Find connection by client ID
     */
    findConnectionByClientId(clientId) {
        for (const connection of this.connections.values()) {
            if (connection.clientId === clientId) {
                return connection;
            }
        }
        return undefined;
    }
    /**
     * Get broker statistics
     */
    getStats() {
        return {
            connections: {
                total: this.connections.size,
                tcp: this.tcpManager.getConnectionCount(),
                websocket: this.wsManager?.getConnectionCount() || 0
            },
            sessions: {
                total: this.sessionManager.getSessionCount(),
                connected: this.sessionManager.getConnectedSessionCount()
            },
            subscriptions: {
                total: this.messageRouter.getSubscriptionCount()
            },
            messages: {
                retained: this.messageRouter.getAllRetainedMessages().size,
                inflight: this.qosHandler.getInflightCounts()
            }
        };
    }
    /**
     * Get broker configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get storage manager
     */
    getStorageManager() {
        return this.storageManager;
    }
    /**
     * Check if broker is running
     */
    isRunning() {
        return this.running;
    }
}
exports.MQTTBroker = MQTTBroker;
//# sourceMappingURL=broker.js.map