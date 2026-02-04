/**
 * Error types and custom error classes for the MQTT broker
 */

/**
 * Base broker error class
 */
export abstract class BrokerError extends Error {
  public readonly code: string;
  public readonly timestamp: number;

  constructor(message: string, code: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = Date.now();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Protocol-related errors
 */
export class ProtocolError extends BrokerError {
  constructor(message: string, code: string = 'PROTOCOL_ERROR') {
    super(message, code);
  }
}

/**
 * Connection-related errors
 */
export class ConnectionError extends BrokerError {
  public readonly connectionId?: string;

  constructor(message: string, connectionId?: string, code: string = 'CONNECTION_ERROR') {
    super(message, code);
    this.connectionId = connectionId;
  }
}

/**
 * Authentication-related errors
 */
export class AuthenticationError extends BrokerError {
  public readonly clientId?: string;

  constructor(message: string, clientId?: string, code: string = 'AUTH_ERROR') {
    super(message, code);
    this.clientId = clientId;
  }
}

/**
 * Authorization-related errors
 */
export class AuthorizationError extends BrokerError {
  public readonly clientId?: string;
  public readonly topic?: string;

  constructor(message: string, clientId?: string, topic?: string, code: string = 'AUTHZ_ERROR') {
    super(message, code);
    this.clientId = clientId;
    this.topic = topic;
  }
}

/**
 * Session-related errors
 */
export class SessionError extends BrokerError {
  public readonly clientId?: string;

  constructor(message: string, clientId?: string, code: string = 'SESSION_ERROR') {
    super(message, code);
    this.clientId = clientId;
  }
}

/**
 * Storage-related errors
 */
export class StorageError extends BrokerError {
  constructor(message: string, code: string = 'STORAGE_ERROR') {
    super(message, code);
  }
}

/**
 * Configuration-related errors
 */
export class ConfigurationError extends BrokerError {
  constructor(message: string, code: string = 'CONFIG_ERROR') {
    super(message, code);
  }
}

/**
 * Topic-related errors
 */
export class TopicError extends BrokerError {
  public readonly topic?: string;

  constructor(message: string, topic?: string, code: string = 'TOPIC_ERROR') {
    super(message, code);
  }
}

/**
 * QoS-related errors
 */
export class QoSError extends BrokerError {
  public readonly packetId?: number;

  constructor(message: string, packetId?: number, code: string = 'QOS_ERROR') {
    super(message, code);
  }
}

/**
 * Resource limit errors
 */
export class ResourceLimitError extends BrokerError {
  public readonly resource: string;
  public readonly limit: number;
  public readonly current: number;

  constructor(message: string, resource: string, limit: number, current: number, code: string = 'RESOURCE_LIMIT_ERROR') {
    super(message, code);
    this.resource = resource;
    this.limit = limit;
    this.current = current;
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends BrokerError {
  public readonly operation: string;
  public readonly timeout: number;

  constructor(message: string, operation: string, timeout: number, code: string = 'TIMEOUT_ERROR') {
    super(message, code);
    this.operation = operation;
    this.timeout = timeout;
  }
}

/**
 * Error codes enumeration
 */
export enum ErrorCode {
  // Protocol errors
  INVALID_PACKET = 'INVALID_PACKET',
  MALFORMED_PACKET = 'MALFORMED_PACKET',
  UNSUPPORTED_PROTOCOL_VERSION = 'UNSUPPORTED_PROTOCOL_VERSION',
  INVALID_CLIENT_ID = 'INVALID_CLIENT_ID',
  INVALID_TOPIC = 'INVALID_TOPIC',
  INVALID_QOS = 'INVALID_QOS',

  // Connection errors
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  MAX_CONNECTIONS_EXCEEDED = 'MAX_CONNECTIONS_EXCEEDED',
  KEEP_ALIVE_TIMEOUT = 'KEEP_ALIVE_TIMEOUT',

  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  CERTIFICATE_INVALID = 'CERTIFICATE_INVALID',

  // Authorization errors
  ACCESS_DENIED = 'ACCESS_DENIED',
  TOPIC_ACCESS_DENIED = 'TOPIC_ACCESS_DENIED',
  OPERATION_NOT_PERMITTED = 'OPERATION_NOT_PERMITTED',

  // Session errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  DUPLICATE_CLIENT_ID = 'DUPLICATE_CLIENT_ID',

  // Storage errors
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  PERSISTENCE_FAILED = 'PERSISTENCE_FAILED',
  DATA_CORRUPTION = 'DATA_CORRUPTION',

  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  MISSING_CONFIGURATION = 'MISSING_CONFIGURATION',
  CONFIGURATION_LOAD_FAILED = 'CONFIGURATION_LOAD_FAILED',

  // Resource limit errors
  MESSAGE_QUEUE_FULL = 'MESSAGE_QUEUE_FULL',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Timeout errors
  ACK_TIMEOUT = 'ACK_TIMEOUT',
  OPERATION_TIMEOUT = 'OPERATION_TIMEOUT',

  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  FEATURE_DISABLED = 'FEATURE_DISABLED'
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  static createProtocolError(message: string, code: string = ErrorCode.INVALID_PACKET): ProtocolError {
    return new ProtocolError(message, code);
  }

  static createConnectionError(message: string, connectionId?: string, code: string = ErrorCode.CONNECTION_REFUSED): ConnectionError {
    return new ConnectionError(message, connectionId, code);
  }

  static createAuthenticationError(message: string, clientId?: string, code: string = ErrorCode.AUTHENTICATION_FAILED): AuthenticationError {
    return new AuthenticationError(message, clientId, code);
  }

  static createAuthorizationError(message: string, clientId?: string, topic?: string, code: string = ErrorCode.ACCESS_DENIED): AuthorizationError {
    return new AuthorizationError(message, clientId, topic, code);
  }

  static createSessionError(message: string, clientId?: string, code: string = ErrorCode.SESSION_NOT_FOUND): SessionError {
    return new SessionError(message, clientId, code);
  }

  static createStorageError(message: string, code: string = ErrorCode.STORAGE_UNAVAILABLE): StorageError {
    return new StorageError(message, code);
  }

  static createConfigurationError(message: string, code: string = ErrorCode.INVALID_CONFIGURATION): ConfigurationError {
    return new ConfigurationError(message, code);
  }

  static createTopicError(message: string, topic?: string, code: string = ErrorCode.INVALID_TOPIC): TopicError {
    return new TopicError(message, topic, code);
  }

  static createQoSError(message: string, packetId?: number, code: string = ErrorCode.INVALID_QOS): QoSError {
    return new QoSError(message, packetId, code);
  }

  static createResourceLimitError(message: string, resource: string, limit: number, current: number, code: string = ErrorCode.MESSAGE_QUEUE_FULL): ResourceLimitError {
    return new ResourceLimitError(message, resource, limit, current, code);
  }

  static createTimeoutError(message: string, operation: string, timeout: number, code: string = ErrorCode.OPERATION_TIMEOUT): TimeoutError {
    return new TimeoutError(message, operation, timeout, code);
  }
}