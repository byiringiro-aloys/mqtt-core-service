/**
 * Error types and custom error classes for the MQTT broker
 */
/**
 * Base broker error class
 */
export declare abstract class BrokerError extends Error {
    readonly code: string;
    readonly timestamp: number;
    constructor(message: string, code: string);
}
/**
 * Protocol-related errors
 */
export declare class ProtocolError extends BrokerError {
    constructor(message: string, code?: string);
}
/**
 * Connection-related errors
 */
export declare class ConnectionError extends BrokerError {
    readonly connectionId?: string;
    constructor(message: string, connectionId?: string, code?: string);
}
/**
 * Authentication-related errors
 */
export declare class AuthenticationError extends BrokerError {
    readonly clientId?: string;
    constructor(message: string, clientId?: string, code?: string);
}
/**
 * Authorization-related errors
 */
export declare class AuthorizationError extends BrokerError {
    readonly clientId?: string;
    readonly topic?: string;
    constructor(message: string, clientId?: string, topic?: string, code?: string);
}
/**
 * Session-related errors
 */
export declare class SessionError extends BrokerError {
    readonly clientId?: string;
    constructor(message: string, clientId?: string, code?: string);
}
/**
 * Storage-related errors
 */
export declare class StorageError extends BrokerError {
    constructor(message: string, code?: string);
}
/**
 * Configuration-related errors
 */
export declare class ConfigurationError extends BrokerError {
    constructor(message: string, code?: string);
}
/**
 * Topic-related errors
 */
export declare class TopicError extends BrokerError {
    readonly topic?: string;
    constructor(message: string, topic?: string, code?: string);
}
/**
 * QoS-related errors
 */
export declare class QoSError extends BrokerError {
    readonly packetId?: number;
    constructor(message: string, packetId?: number, code?: string);
}
/**
 * Resource limit errors
 */
export declare class ResourceLimitError extends BrokerError {
    readonly resource: string;
    readonly limit: number;
    readonly current: number;
    constructor(message: string, resource: string, limit: number, current: number, code?: string);
}
/**
 * Timeout errors
 */
export declare class TimeoutError extends BrokerError {
    readonly operation: string;
    readonly timeout: number;
    constructor(message: string, operation: string, timeout: number, code?: string);
}
/**
 * Error codes enumeration
 */
export declare enum ErrorCode {
    INVALID_PACKET = "INVALID_PACKET",
    MALFORMED_PACKET = "MALFORMED_PACKET",
    UNSUPPORTED_PROTOCOL_VERSION = "UNSUPPORTED_PROTOCOL_VERSION",
    INVALID_CLIENT_ID = "INVALID_CLIENT_ID",
    INVALID_TOPIC = "INVALID_TOPIC",
    INVALID_QOS = "INVALID_QOS",
    CONNECTION_REFUSED = "CONNECTION_REFUSED",
    CONNECTION_LOST = "CONNECTION_LOST",
    CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT",
    MAX_CONNECTIONS_EXCEEDED = "MAX_CONNECTIONS_EXCEEDED",
    KEEP_ALIVE_TIMEOUT = "KEEP_ALIVE_TIMEOUT",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
    CERTIFICATE_INVALID = "CERTIFICATE_INVALID",
    ACCESS_DENIED = "ACCESS_DENIED",
    TOPIC_ACCESS_DENIED = "TOPIC_ACCESS_DENIED",
    OPERATION_NOT_PERMITTED = "OPERATION_NOT_PERMITTED",
    SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    DUPLICATE_CLIENT_ID = "DUPLICATE_CLIENT_ID",
    STORAGE_UNAVAILABLE = "STORAGE_UNAVAILABLE",
    PERSISTENCE_FAILED = "PERSISTENCE_FAILED",
    DATA_CORRUPTION = "DATA_CORRUPTION",
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
    MISSING_CONFIGURATION = "MISSING_CONFIGURATION",
    CONFIGURATION_LOAD_FAILED = "CONFIGURATION_LOAD_FAILED",
    MESSAGE_QUEUE_FULL = "MESSAGE_QUEUE_FULL",
    MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    ACK_TIMEOUT = "ACK_TIMEOUT",
    OPERATION_TIMEOUT = "OPERATION_TIMEOUT",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
    FEATURE_DISABLED = "FEATURE_DISABLED"
}
/**
 * Error factory for creating specific error types
 */
export declare class ErrorFactory {
    static createProtocolError(message: string, code?: string): ProtocolError;
    static createConnectionError(message: string, connectionId?: string, code?: string): ConnectionError;
    static createAuthenticationError(message: string, clientId?: string, code?: string): AuthenticationError;
    static createAuthorizationError(message: string, clientId?: string, topic?: string, code?: string): AuthorizationError;
    static createSessionError(message: string, clientId?: string, code?: string): SessionError;
    static createStorageError(message: string, code?: string): StorageError;
    static createConfigurationError(message: string, code?: string): ConfigurationError;
    static createTopicError(message: string, topic?: string, code?: string): TopicError;
    static createQoSError(message: string, packetId?: number, code?: string): QoSError;
    static createResourceLimitError(message: string, resource: string, limit: number, current: number, code?: string): ResourceLimitError;
    static createTimeoutError(message: string, operation: string, timeout: number, code?: string): TimeoutError;
}
//# sourceMappingURL=errors.d.ts.map