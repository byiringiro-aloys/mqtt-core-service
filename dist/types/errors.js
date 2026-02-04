"use strict";
/**
 * Error types and custom error classes for the MQTT broker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = exports.ErrorCode = exports.TimeoutError = exports.ResourceLimitError = exports.QoSError = exports.TopicError = exports.ConfigurationError = exports.StorageError = exports.SessionError = exports.AuthorizationError = exports.AuthenticationError = exports.ConnectionError = exports.ProtocolError = exports.BrokerError = void 0;
/**
 * Base broker error class
 */
class BrokerError extends Error {
    constructor(message, code) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = Date.now();
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.BrokerError = BrokerError;
/**
 * Protocol-related errors
 */
class ProtocolError extends BrokerError {
    constructor(message, code = 'PROTOCOL_ERROR') {
        super(message, code);
    }
}
exports.ProtocolError = ProtocolError;
/**
 * Connection-related errors
 */
class ConnectionError extends BrokerError {
    constructor(message, connectionId, code = 'CONNECTION_ERROR') {
        super(message, code);
        this.connectionId = connectionId;
    }
}
exports.ConnectionError = ConnectionError;
/**
 * Authentication-related errors
 */
class AuthenticationError extends BrokerError {
    constructor(message, clientId, code = 'AUTH_ERROR') {
        super(message, code);
        this.clientId = clientId;
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization-related errors
 */
class AuthorizationError extends BrokerError {
    constructor(message, clientId, topic, code = 'AUTHZ_ERROR') {
        super(message, code);
        this.clientId = clientId;
        this.topic = topic;
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Session-related errors
 */
class SessionError extends BrokerError {
    constructor(message, clientId, code = 'SESSION_ERROR') {
        super(message, code);
        this.clientId = clientId;
    }
}
exports.SessionError = SessionError;
/**
 * Storage-related errors
 */
class StorageError extends BrokerError {
    constructor(message, code = 'STORAGE_ERROR') {
        super(message, code);
    }
}
exports.StorageError = StorageError;
/**
 * Configuration-related errors
 */
class ConfigurationError extends BrokerError {
    constructor(message, code = 'CONFIG_ERROR') {
        super(message, code);
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Topic-related errors
 */
class TopicError extends BrokerError {
    constructor(message, topic, code = 'TOPIC_ERROR') {
        super(message, code);
    }
}
exports.TopicError = TopicError;
/**
 * QoS-related errors
 */
class QoSError extends BrokerError {
    constructor(message, packetId, code = 'QOS_ERROR') {
        super(message, code);
    }
}
exports.QoSError = QoSError;
/**
 * Resource limit errors
 */
class ResourceLimitError extends BrokerError {
    constructor(message, resource, limit, current, code = 'RESOURCE_LIMIT_ERROR') {
        super(message, code);
        this.resource = resource;
        this.limit = limit;
        this.current = current;
    }
}
exports.ResourceLimitError = ResourceLimitError;
/**
 * Timeout errors
 */
class TimeoutError extends BrokerError {
    constructor(message, operation, timeout, code = 'TIMEOUT_ERROR') {
        super(message, code);
        this.operation = operation;
        this.timeout = timeout;
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Error codes enumeration
 */
var ErrorCode;
(function (ErrorCode) {
    // Protocol errors
    ErrorCode["INVALID_PACKET"] = "INVALID_PACKET";
    ErrorCode["MALFORMED_PACKET"] = "MALFORMED_PACKET";
    ErrorCode["UNSUPPORTED_PROTOCOL_VERSION"] = "UNSUPPORTED_PROTOCOL_VERSION";
    ErrorCode["INVALID_CLIENT_ID"] = "INVALID_CLIENT_ID";
    ErrorCode["INVALID_TOPIC"] = "INVALID_TOPIC";
    ErrorCode["INVALID_QOS"] = "INVALID_QOS";
    // Connection errors
    ErrorCode["CONNECTION_REFUSED"] = "CONNECTION_REFUSED";
    ErrorCode["CONNECTION_LOST"] = "CONNECTION_LOST";
    ErrorCode["CONNECTION_TIMEOUT"] = "CONNECTION_TIMEOUT";
    ErrorCode["MAX_CONNECTIONS_EXCEEDED"] = "MAX_CONNECTIONS_EXCEEDED";
    ErrorCode["KEEP_ALIVE_TIMEOUT"] = "KEEP_ALIVE_TIMEOUT";
    // Authentication errors
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["AUTHENTICATION_FAILED"] = "AUTHENTICATION_FAILED";
    ErrorCode["CERTIFICATE_INVALID"] = "CERTIFICATE_INVALID";
    // Authorization errors
    ErrorCode["ACCESS_DENIED"] = "ACCESS_DENIED";
    ErrorCode["TOPIC_ACCESS_DENIED"] = "TOPIC_ACCESS_DENIED";
    ErrorCode["OPERATION_NOT_PERMITTED"] = "OPERATION_NOT_PERMITTED";
    // Session errors
    ErrorCode["SESSION_NOT_FOUND"] = "SESSION_NOT_FOUND";
    ErrorCode["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    ErrorCode["DUPLICATE_CLIENT_ID"] = "DUPLICATE_CLIENT_ID";
    // Storage errors
    ErrorCode["STORAGE_UNAVAILABLE"] = "STORAGE_UNAVAILABLE";
    ErrorCode["PERSISTENCE_FAILED"] = "PERSISTENCE_FAILED";
    ErrorCode["DATA_CORRUPTION"] = "DATA_CORRUPTION";
    // Configuration errors
    ErrorCode["INVALID_CONFIGURATION"] = "INVALID_CONFIGURATION";
    ErrorCode["MISSING_CONFIGURATION"] = "MISSING_CONFIGURATION";
    ErrorCode["CONFIGURATION_LOAD_FAILED"] = "CONFIGURATION_LOAD_FAILED";
    // Resource limit errors
    ErrorCode["MESSAGE_QUEUE_FULL"] = "MESSAGE_QUEUE_FULL";
    ErrorCode["MEMORY_LIMIT_EXCEEDED"] = "MEMORY_LIMIT_EXCEEDED";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // Timeout errors
    ErrorCode["ACK_TIMEOUT"] = "ACK_TIMEOUT";
    ErrorCode["OPERATION_TIMEOUT"] = "OPERATION_TIMEOUT";
    // General errors
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
    ErrorCode["FEATURE_DISABLED"] = "FEATURE_DISABLED";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
/**
 * Error factory for creating specific error types
 */
class ErrorFactory {
    static createProtocolError(message, code = ErrorCode.INVALID_PACKET) {
        return new ProtocolError(message, code);
    }
    static createConnectionError(message, connectionId, code = ErrorCode.CONNECTION_REFUSED) {
        return new ConnectionError(message, connectionId, code);
    }
    static createAuthenticationError(message, clientId, code = ErrorCode.AUTHENTICATION_FAILED) {
        return new AuthenticationError(message, clientId, code);
    }
    static createAuthorizationError(message, clientId, topic, code = ErrorCode.ACCESS_DENIED) {
        return new AuthorizationError(message, clientId, topic, code);
    }
    static createSessionError(message, clientId, code = ErrorCode.SESSION_NOT_FOUND) {
        return new SessionError(message, clientId, code);
    }
    static createStorageError(message, code = ErrorCode.STORAGE_UNAVAILABLE) {
        return new StorageError(message, code);
    }
    static createConfigurationError(message, code = ErrorCode.INVALID_CONFIGURATION) {
        return new ConfigurationError(message, code);
    }
    static createTopicError(message, topic, code = ErrorCode.INVALID_TOPIC) {
        return new TopicError(message, topic, code);
    }
    static createQoSError(message, packetId, code = ErrorCode.INVALID_QOS) {
        return new QoSError(message, packetId, code);
    }
    static createResourceLimitError(message, resource, limit, current, code = ErrorCode.MESSAGE_QUEUE_FULL) {
        return new ResourceLimitError(message, resource, limit, current, code);
    }
    static createTimeoutError(message, operation, timeout, code = ErrorCode.OPERATION_TIMEOUT) {
        return new TimeoutError(message, operation, timeout, code);
    }
}
exports.ErrorFactory = ErrorFactory;
//# sourceMappingURL=errors.js.map