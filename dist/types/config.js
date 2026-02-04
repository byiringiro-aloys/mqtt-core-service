"use strict";
/**
 * Configuration types and interfaces for the MQTT broker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
/**
 * Default configuration values
 */
exports.DEFAULT_CONFIG = {
    server: {
        port: 1883,
        host: '0.0.0.0',
        maxConnections: 1000,
        keepAliveTimeout: 60,
        enableWebSocket: true,
        webSocketPort: 8083
    },
    security: {
        enableTLS: false,
        requireAuth: false,
        enableClientCerts: false,
        minTLSVersion: 'TLSv1.2'
    },
    auth: {
        type: 'none',
        config: {},
        allowAnonymous: true,
        defaultACL: [
            {
                topic: '#',
                operations: ['read', 'write'],
                priority: 0
            }
        ]
    },
    persistence: {
        enabled: true,
        storageType: 'memory',
        config: {},
        retainedMessageLimit: 10000,
        sessionExpiryInterval: 3600,
        messageQueueLimit: 1000,
        enableWAL: false,
        syncInterval: 1000
    },
    performance: {
        messageQueueLimit: 1000,
        inflightWindowSize: 100,
        workerThreads: 4,
        batchSize: 100,
        connectionTimeout: 30000,
        ackTimeout: 30000,
        retryInterval: 5000,
        maxRetries: 3
    },
    monitoring: {
        enabled: true,
        port: 9090,
        path: '/metrics',
        interval: 5000,
        enableHealthCheck: true,
        healthCheckPort: 8080,
        healthCheckPath: '/health'
    },
    logging: {
        level: 'info',
        format: 'json',
        output: 'console',
        maxFileSize: 100,
        maxFiles: 10,
        enableRotation: true
    },
    cluster: {
        enabled: false,
        nodeId: 'node-1',
        discovery: 'static',
        discoveryConfig: {},
        port: 7946,
        heartbeatInterval: 5000,
        nodeTimeout: 30000
    },
    iot: {
        enableMQTTSN: false,
        enableCompression: false,
        compressionAlgorithm: 'gzip',
        enablePresenceTracking: true,
        deviceOfflineTimeout: 300,
        enableBulkOperations: false,
        retentionPolicies: []
    }
};
//# sourceMappingURL=config.js.map