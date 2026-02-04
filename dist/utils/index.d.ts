/**
 * Utility functions for the MQTT broker
 */
/**
 * Generate a unique ID
 */
export declare function generateId(prefix?: string, length?: number): string;
/**
 * Generate a unique message ID
 */
export declare function generateMessageId(): string;
/**
 * Generate a unique connection ID
 */
export declare function generateConnectionId(): string;
/**
 * Validate MQTT topic name according to MQTT 3.1.1 specification
 */
export declare function validateTopicName(topic: string): boolean;
/**
 * Validate MQTT topic filter for subscriptions
 */
export declare function validateTopicFilter(topicFilter: string): boolean;
/**
 * Check if a topic matches a topic filter with wildcards
 */
export declare function topicMatches(topicFilter: string, topic: string): boolean;
/**
 * Validate MQTT client ID
 */
export declare function validateClientId(clientId: string): boolean;
/**
 * Encode variable length integer (MQTT protocol)
 */
export declare function encodeVariableLength(value: number): Buffer;
/**
 * Decode variable length integer (MQTT protocol)
 */
export declare function decodeVariableLength(buffer: Buffer, offset?: number): {
    value: number;
    length: number;
};
/**
 * Encode UTF-8 string with length prefix (MQTT protocol)
 */
export declare function encodeString(str: string): Buffer;
/**
 * Decode UTF-8 string with length prefix (MQTT protocol)
 */
export declare function decodeString(buffer: Buffer, offset?: number): {
    value: string;
    length: number;
};
/**
 * Calculate the next packet identifier
 */
export declare function nextPacketId(currentId: number): number;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Sleep for a specified number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Create a timeout promise that rejects after specified milliseconds
 */
export declare function timeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>;
/**
 * Retry a function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number, maxDelay?: number): Promise<T>;
/**
 * Format bytes to human readable string
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Get current timestamp in milliseconds
 */
export declare function now(): number;
/**
 * Check if a value is a valid port number
 */
export declare function isValidPort(port: number): boolean;
/**
 * Sanitize a string for logging (remove sensitive information)
 */
export declare function sanitizeForLog(str: string): string;
//# sourceMappingURL=index.d.ts.map