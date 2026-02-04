"use strict";
/**
 * MQTT protocol handler combining parsing and serialization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MQTTProtocolHandler = void 0;
const parser_1 = require("./parser");
const serializer_1 = require("./serializer");
class MQTTProtocolHandler {
    constructor() {
        this.parser = new parser_1.MQTTParser();
        this.serializer = new serializer_1.MQTTSerializer();
    }
    /**
     * Parse MQTT packet from buffer
     */
    parsePacket(data) {
        return this.parser.parsePacket(data);
    }
    /**
     * Serialize MQTT packet to buffer
     */
    serializePacket(packet) {
        return this.serializer.serializePacket(packet);
    }
    /**
     * Validate packet structure
     */
    validatePacket(packet) {
        return this.parser.validatePacket(packet);
    }
    /**
     * Get parser instance
     */
    getParser() {
        return this.parser;
    }
    /**
     * Get serializer instance
     */
    getSerializer() {
        return this.serializer;
    }
}
exports.MQTTProtocolHandler = MQTTProtocolHandler;
//# sourceMappingURL=handler.js.map