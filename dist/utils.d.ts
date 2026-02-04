/**
 * Utility functions for MQTT broker
 */
/**
 * Generate a random ID with optional prefix
 */
export declare function generateId(prefix?: string, length?: number): string;
/**
 * Generate a message ID
 */
export declare function generateMessageId(): string;
/**
 * Generate a connection ID
 */
export declare function generateConnectionId(): string;
/**
 * Validate topic name according to MQTT specification
 */
export declare function validateTopicName(topic: string): boolean;
/**
 * Validate topic filter (can contain wildcards)
 */
export declare function validateTopicFilter(topicFilter: string): boolean;
/**
 * Check if topic matches topic filter with wildcards
 */
export declare function topicMatches(topicFilter: string, topic: string): boolean;
/**
 * Encode remaining length according to MQTT specification
 */
export declare function encodeRemainingLength(length: number): Buffer;
/**
 * Decode remaining length from buffer
 */
export declare function decodeRemainingLength(buffer: Buffer, offset?: number): {
    length: number;
    bytesUsed: number;
};
/**
 * Encode string with length prefix
 */
export declare function encodeString(str: string): Buffer;
/**
 * Decode string with length prefix
 */
export declare function decodeString(buffer: Buffer, offset?: number): {
    str: string;
    bytesUsed: number;
};
/**
 * Get current timestamp in milliseconds
 */
export declare function getCurrentTimestamp(): number;
/**
 * Check if timestamp is expired
 */
export declare function isExpired(timestamp: number, timeoutMs: number): boolean;
//# sourceMappingURL=utils.d.ts.map