/**
 * Configuration types and interfaces for the MQTT broker
 */
/**
 * Server configuration
 */
export interface ServerConfig {
    /** Server port */
    port: number;
    /** Server host */
    host: string;
    /** Maximum concurrent connections */
    maxConnections: number;
    /** Keep alive timeout in seconds */
    keepAliveTimeout: number;
    /** Enable WebSocket support */
    enableWebSocket: boolean;
    /** WebSocket port (if different from main port) */
    webSocketPort?: number;
}
/**
 * Security configuration
 */
export interface SecurityConfig {
    /** Enable TLS/SSL */
    enableTLS: boolean;
    /** TLS certificate file path */
    certFile?: string;
    /** TLS private key file path */
    keyFile?: string;
    /** TLS CA certificate file path */
    caFile?: string;
    /** Require client authentication */
    requireAuth: boolean;
    /** Enable client certificate authentication */
    enableClientCerts: boolean;
    /** Minimum TLS version */
    minTLSVersion?: string;
    /** Allowed cipher suites */
    cipherSuites?: string[];
}
/**
 * Authentication configuration
 */
export interface AuthConfig {
    /** Authentication type */
    type: 'none' | 'file' | 'database' | 'ldap' | 'custom';
    /** Configuration specific to auth type */
    config: Record<string, any>;
    /** Enable anonymous connections */
    allowAnonymous: boolean;
    /** Default ACL for authenticated users */
    defaultACL: ACLRule[];
}
/**
 * Access Control List rule
 */
export interface ACLRule {
    /** Client ID pattern (supports wildcards) */
    clientId?: string;
    /** Username pattern (supports wildcards) */
    username?: string;
    /** Topic pattern (supports wildcards) */
    topic: string;
    /** Allowed operations */
    operations: ('read' | 'write')[];
    /** Rule priority (higher number = higher priority) */
    priority: number;
}
/**
 * Persistence configuration
 */
export interface PersistenceConfig {
    /** Enable persistence */
    enabled: boolean;
    /** Storage type */
    storageType: 'memory' | 'file' | 'database';
    /** Storage configuration */
    config: Record<string, any>;
    /** Maximum retained messages */
    retainedMessageLimit: number;
    /** Session expiry time in seconds */
    sessionExpiryInterval: number;
    /** Message queue size limit per client */
    messageQueueLimit: number;
    /** Enable write-ahead logging */
    enableWAL: boolean;
    /** Sync interval for persistence in milliseconds */
    syncInterval: number;
}
/**
 * Performance configuration
 */
export interface PerformanceConfig {
    /** Message queue limit per client */
    messageQueueLimit: number;
    /** Inflight window size for QoS 1 and 2 */
    inflightWindowSize: number;
    /** Number of worker threads */
    workerThreads: number;
    /** Message processing batch size */
    batchSize: number;
    /** Connection timeout in milliseconds */
    connectionTimeout: number;
    /** Acknowledgment timeout in milliseconds */
    ackTimeout: number;
    /** Retry interval for failed operations in milliseconds */
    retryInterval: number;
    /** Maximum retry attempts */
    maxRetries: number;
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
    /** Enable metrics collection */
    enabled: boolean;
    /** Metrics export port */
    port?: number;
    /** Metrics export path */
    path: string;
    /** Metrics collection interval in milliseconds */
    interval: number;
    /** Enable health check endpoint */
    enableHealthCheck: boolean;
    /** Health check port */
    healthCheckPort?: number;
    /** Health check path */
    healthCheckPath: string;
}
/**
 * Logging configuration
 */
export interface LoggingConfig {
    /** Log level */
    level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    /** Log format */
    format: 'json' | 'text';
    /** Log output destination */
    output: 'console' | 'file' | 'both';
    /** Log file path (if output includes file) */
    filePath?: string;
    /** Maximum log file size in MB */
    maxFileSize: number;
    /** Maximum number of log files to keep */
    maxFiles: number;
    /** Enable log rotation */
    enableRotation: boolean;
}
/**
 * Clustering configuration
 */
export interface ClusterConfig {
    /** Enable clustering */
    enabled: boolean;
    /** Node ID */
    nodeId: string;
    /** Cluster discovery method */
    discovery: 'static' | 'dns' | 'consul' | 'etcd';
    /** Discovery configuration */
    discoveryConfig: Record<string, any>;
    /** Cluster communication port */
    port: number;
    /** Heartbeat interval in milliseconds */
    heartbeatInterval: number;
    /** Node timeout in milliseconds */
    nodeTimeout: number;
}
/**
 * IoT-specific configuration
 */
export interface IoTConfig {
    /** Enable MQTT-SN support */
    enableMQTTSN: boolean;
    /** MQTT-SN gateway port */
    mqttsnPort?: number;
    /** Enable message compression */
    enableCompression: boolean;
    /** Compression algorithm */
    compressionAlgorithm: 'gzip' | 'lz4' | 'snappy';
    /** Enable device presence tracking */
    enablePresenceTracking: boolean;
    /** Device offline timeout in seconds */
    deviceOfflineTimeout: number;
    /** Enable bulk operations */
    enableBulkOperations: boolean;
    /** Message retention policies */
    retentionPolicies: RetentionPolicy[];
}
/**
 * Message retention policy
 */
export interface RetentionPolicy {
    /** Topic pattern */
    topicPattern: string;
    /** Retention time in seconds */
    retentionTime: number;
    /** Maximum message count */
    maxMessages?: number;
    /** Retention strategy */
    strategy: 'time' | 'count' | 'size';
}
/**
 * Main broker configuration
 */
export interface BrokerConfig {
    /** Server configuration */
    server: ServerConfig;
    /** Security configuration */
    security: SecurityConfig;
    /** Authentication configuration */
    auth: AuthConfig;
    /** Persistence configuration */
    persistence: PersistenceConfig;
    /** Performance configuration */
    performance: PerformanceConfig;
    /** Monitoring configuration */
    monitoring: MonitoringConfig;
    /** Logging configuration */
    logging: LoggingConfig;
    /** Clustering configuration */
    cluster: ClusterConfig;
    /** IoT-specific configuration */
    iot: IoTConfig;
}
/**
 * Default configuration values
 */
export declare const DEFAULT_CONFIG: BrokerConfig;
//# sourceMappingURL=config.d.ts.map