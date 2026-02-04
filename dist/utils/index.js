"use strict";
/**
 * Utility functions for the MQTT broker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateMessageId = generateMessageId;
exports.generateConnectionId = generateConnectionId;
exports.validateTopicName = validateTopicName;
exports.validateTopicFilter = validateTopicFilter;
exports.topicMatches = topicMatches;
exports.validateClientId = validateClientId;
exports.encodeVariableLength = encodeVariableLength;
exports.decodeVariableLength = decodeVariableLength;
exports.encodeString = encodeString;
exports.decodeString = decodeString;
exports.nextPacketId = nextPacketId;
exports.deepClone = deepClone;
exports.sleep = sleep;
exports.timeout = timeout;
exports.retry = retry;
exports.formatBytes = formatBytes;
exports.now = now;
exports.isValidPort = isValidPort;
exports.sanitizeForLog = sanitizeForLog;
const crypto_1 = require("crypto");
/**
 * Generate a unique ID
 */
function generateId(prefix = '', length = 16) {
    const randomPart = (0, crypto_1.randomBytes)(length / 2).toString('hex');
    return prefix ? `${prefix}-${randomPart}` : randomPart;
}
/**
 * Generate a unique message ID
 */
function generateMessageId() {
    return generateId('msg', 16);
}
/**
 * Generate a unique connection ID
 */
function generateConnectionId() {
    return generateId('conn', 16);
}
/**
 * Validate MQTT topic name according to MQTT 3.1.1 specification
 */
function validateTopicName(topic) {
    if (!topic || topic.length === 0) {
        return false;
    }
    // Topic must not exceed 65535 UTF-8 characters
    if (Buffer.byteLength(topic, 'utf8') > 65535) {
        return false;
    }
    // Topic must not contain null character
    if (topic.includes('\u0000')) {
        return false;
    }
    // Topic must not contain wildcards for publish
    if (topic.includes('+') || topic.includes('#')) {
        return false;
    }
    return true;
}
/**
 * Validate MQTT topic filter for subscriptions
 */
function validateTopicFilter(topicFilter) {
    if (!topicFilter || topicFilter.length === 0) {
        return false;
    }
    // Topic filter must not exceed 65535 UTF-8 characters
    if (Buffer.byteLength(topicFilter, 'utf8') > 65535) {
        return false;
    }
    // Topic filter must not contain null character
    if (topicFilter.includes('\u0000')) {
        return false;
    }
    // Validate wildcard usage
    const levels = topicFilter.split('/');
    for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        // Single-level wildcard validation
        if (level.includes('+')) {
            // + must be the only character in the level
            if (level !== '+') {
                return false;
            }
        }
        // Multi-level wildcard validation
        if (level.includes('#')) {
            // # must be the only character in the level
            if (level !== '#') {
                return false;
            }
            // # must be the last level
            if (i !== levels.length - 1) {
                return false;
            }
        }
    }
    return true;
}
/**
 * Check if a topic matches a topic filter with wildcards
 */
function topicMatches(topicFilter, topic) {
    if (topicFilter === topic) {
        return true;
    }
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
        else if (filterLevel === '+') {
            // Single-level wildcard matches any single level
            filterIndex++;
            topicIndex++;
        }
        else if (filterLevel === topicLevel) {
            // Exact match
            filterIndex++;
            topicIndex++;
        }
        else {
            // No match
            return false;
        }
    }
    // Check if we've consumed all levels
    if (filterIndex === filterLevels.length && topicIndex === topicLevels.length) {
        return true;
    }
    // Check if filter ends with # and we've matched everything up to it
    if (filterIndex === filterLevels.length - 1 && filterLevels[filterIndex] === '#') {
        return true;
    }
    return false;
}
/**
 * Validate MQTT client ID
 */
function validateClientId(clientId) {
    // Client ID can be empty for clean session connections
    if (clientId.length === 0) {
        return true;
    }
    // Client ID must not exceed 23 UTF-8 characters (MQTT 3.1.1 recommendation)
    if (Buffer.byteLength(clientId, 'utf8') > 23) {
        return false;
    }
    // Client ID should contain only alphanumeric characters, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9_-]*$/;
    return validPattern.test(clientId);
}
/**
 * Encode variable length integer (MQTT protocol)
 */
function encodeVariableLength(value) {
    const bytes = [];
    do {
        let byte = value % 128;
        value = Math.floor(value / 128);
        if (value > 0) {
            byte |= 128;
        }
        bytes.push(byte);
    } while (value > 0);
    return Buffer.from(bytes);
}
/**
 * Decode variable length integer (MQTT protocol)
 */
function decodeVariableLength(buffer, offset = 0) {
    let multiplier = 1;
    let value = 0;
    let length = 0;
    let byte;
    do {
        if (offset + length >= buffer.length) {
            throw new Error('Incomplete variable length integer');
        }
        byte = buffer[offset + length];
        value += (byte & 127) * multiplier;
        if (multiplier > 128 * 128 * 128) {
            throw new Error('Variable length integer exceeds maximum value');
        }
        multiplier *= 128;
        length++;
    } while ((byte & 128) !== 0);
    return { value, length };
}
/**
 * Encode UTF-8 string with length prefix (MQTT protocol)
 */
function encodeString(str) {
    const stringBuffer = Buffer.from(str, 'utf8');
    const lengthBuffer = Buffer.allocUnsafe(2);
    lengthBuffer.writeUInt16BE(stringBuffer.length, 0);
    return Buffer.concat([lengthBuffer, stringBuffer]);
}
/**
 * Decode UTF-8 string with length prefix (MQTT protocol)
 */
function decodeString(buffer, offset = 0) {
    if (offset + 2 > buffer.length) {
        throw new Error('Incomplete string length');
    }
    const stringLength = buffer.readUInt16BE(offset);
    if (offset + 2 + stringLength > buffer.length) {
        throw new Error('Incomplete string data');
    }
    const value = buffer.toString('utf8', offset + 2, offset + 2 + stringLength);
    return { value, length: 2 + stringLength };
}
/**
 * Calculate the next packet identifier
 */
function nextPacketId(currentId) {
    // Packet identifiers are 16-bit unsigned integers (1-65535)
    // 0 is reserved and should not be used
    return currentId >= 65535 ? 1 : currentId + 1;
}
/**
 * Deep clone an object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    if (obj instanceof Map) {
        const cloned = new Map();
        obj.forEach((value, key) => {
            cloned.set(key, deepClone(value));
        });
        return cloned;
    }
    if (obj instanceof Set) {
        const cloned = new Set();
        obj.forEach(value => {
            cloned.add(deepClone(value));
        });
        return cloned;
    }
    if (typeof obj === 'object') {
        const cloned = {};
        Object.keys(obj).forEach(key => {
            cloned[key] = deepClone(obj[key]);
        });
        return cloned;
    }
    return obj;
}
/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function timeout(promise, ms, message = 'Operation timed out') {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
    return Promise.race([promise, timeoutPromise]);
}
/**
 * Retry a function with exponential backoff
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxRetries) {
                throw lastError;
            }
            const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
            await sleep(delay);
        }
    }
    throw lastError;
}
/**
 * Format bytes to human readable string
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * Get current timestamp in milliseconds
 */
function now() {
    return Date.now();
}
/**
 * Check if a value is a valid port number
 */
function isValidPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
}
/**
 * Sanitize a string for logging (remove sensitive information)
 */
function sanitizeForLog(str) {
    // Remove potential passwords, tokens, etc.
    return str.replace(/password[=:]\s*[^\s&]+/gi, 'password=***')
        .replace(/token[=:]\s*[^\s&]+/gi, 'token=***')
        .replace(/key[=:]\s*[^\s&]+/gi, 'key=***');
}
//# sourceMappingURL=index.js.map