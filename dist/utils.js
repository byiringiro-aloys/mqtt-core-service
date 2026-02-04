"use strict";
/**
 * Utility functions for MQTT broker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateMessageId = generateMessageId;
exports.generateConnectionId = generateConnectionId;
exports.validateTopicName = validateTopicName;
exports.validateTopicFilter = validateTopicFilter;
exports.topicMatches = topicMatches;
exports.encodeRemainingLength = encodeRemainingLength;
exports.decodeRemainingLength = decodeRemainingLength;
exports.encodeString = encodeString;
exports.decodeString = decodeString;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.isExpired = isExpired;
const crypto_1 = require("crypto");
/**
 * Generate a random ID with optional prefix
 */
function generateId(prefix, length = 16) {
    const randomHex = (0, crypto_1.randomBytes)(Math.ceil(length / 2)).toString('hex').substring(0, length);
    return prefix ? `${prefix}-${randomHex}` : randomHex;
}
/**
 * Generate a message ID
 */
function generateMessageId() {
    return generateId('msg', 16);
}
/**
 * Generate a connection ID
 */
function generateConnectionId() {
    return generateId('conn', 16);
}
/**
 * Validate topic name according to MQTT specification
 */
function validateTopicName(topic) {
    if (!topic || topic.length === 0) {
        return false;
    }
    // Topic must not contain wildcards
    if (topic.includes('+') || topic.includes('#')) {
        return false;
    }
    // Topic must not contain null characters
    if (topic.includes('\0')) {
        return false;
    }
    return true;
}
/**
 * Validate topic filter (can contain wildcards)
 */
function validateTopicFilter(topicFilter) {
    if (!topicFilter || topicFilter.length === 0) {
        return false;
    }
    const levels = topicFilter.split('/');
    for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        if (level === '#') {
            // Multi-level wildcard must be last level and alone
            return i === levels.length - 1;
        }
        if (level === '+') {
            // Single-level wildcard must be alone in its level
            continue;
        }
        // Regular level - check for invalid characters
        if (level.includes('+') || level.includes('#')) {
            return false;
        }
        // Check for null characters
        if (level.includes('\0')) {
            return false;
        }
    }
    return true;
}
/**
 * Check if topic matches topic filter with wildcards
 */
function topicMatches(topicFilter, topic) {
    const filterLevels = topicFilter.split('/');
    const topicLevels = topic.split('/');
    let filterIndex = 0;
    let topicIndex = 0;
    while (filterIndex < filterLevels.length && topicIndex < topicLevels.length) {
        const filterLevel = filterLevels[filterIndex];
        const topicLevel = topicLevels[topicIndex];
        if (filterLevel === '#') {
            // Multi-level wildcard matches everything remaining
            return true;
        }
        if (filterLevel === '+') {
            // Single-level wildcard matches any single level
            filterIndex++;
            topicIndex++;
            continue;
        }
        if (filterLevel === topicLevel) {
            // Exact match
            filterIndex++;
            topicIndex++;
            continue;
        }
        // No match
        return false;
    }
    // Check if we consumed all levels
    if (filterIndex < filterLevels.length) {
        // Remaining filter levels must be a single '#'
        return filterIndex === filterLevels.length - 1 && filterLevels[filterIndex] === '#';
    }
    return topicIndex === topicLevels.length;
}
/**
 * Encode remaining length according to MQTT specification
 */
function encodeRemainingLength(length) {
    const bytes = [];
    do {
        let byte = length % 128;
        length = Math.floor(length / 128);
        if (length > 0) {
            byte |= 0x80;
        }
        bytes.push(byte);
    } while (length > 0);
    return Buffer.from(bytes);
}
/**
 * Decode remaining length from buffer
 */
function decodeRemainingLength(buffer, offset = 0) {
    let length = 0;
    let multiplier = 1;
    let bytesUsed = 0;
    do {
        if (offset + bytesUsed >= buffer.length) {
            throw new Error('Invalid remaining length: buffer too short');
        }
        const byte = buffer[offset + bytesUsed];
        length += (byte & 0x7F) * multiplier;
        if (multiplier > 128 * 128 * 128) {
            throw new Error('Invalid remaining length: too large');
        }
        multiplier *= 128;
        bytesUsed++;
    } while ((buffer[offset + bytesUsed - 1] & 0x80) !== 0);
    return { length, bytesUsed };
}
/**
 * Encode string with length prefix
 */
function encodeString(str) {
    const strBuffer = Buffer.from(str, 'utf8');
    const lengthBuffer = Buffer.allocUnsafe(2);
    lengthBuffer.writeUInt16BE(strBuffer.length, 0);
    return Buffer.concat([lengthBuffer, strBuffer]);
}
/**
 * Decode string with length prefix
 */
function decodeString(buffer, offset = 0) {
    if (buffer.length < offset + 2) {
        throw new Error('Invalid string: buffer too short for length');
    }
    const length = buffer.readUInt16BE(offset);
    if (buffer.length < offset + 2 + length) {
        throw new Error('Invalid string: buffer too short for content');
    }
    const str = buffer.slice(offset + 2, offset + 2 + length).toString('utf8');
    return { str, bytesUsed: 2 + length };
}
/**
 * Get current timestamp in milliseconds
 */
function getCurrentTimestamp() {
    return Date.now();
}
/**
 * Check if timestamp is expired
 */
function isExpired(timestamp, timeoutMs) {
    return Date.now() - timestamp > timeoutMs;
}
//# sourceMappingURL=utils.js.map