"use strict";
/**
 * Core MQTT data models and interfaces
 * Implements MQTT 3.1.1 protocol specification types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubackReturnCode = exports.ConnackReturnCode = exports.ConnectionState = exports.PacketType = exports.QoSLevel = void 0;
/**
 * MQTT Quality of Service levels
 */
var QoSLevel;
(function (QoSLevel) {
    QoSLevel[QoSLevel["AT_MOST_ONCE"] = 0] = "AT_MOST_ONCE";
    QoSLevel[QoSLevel["AT_LEAST_ONCE"] = 1] = "AT_LEAST_ONCE";
    QoSLevel[QoSLevel["EXACTLY_ONCE"] = 2] = "EXACTLY_ONCE"; // Assured delivery
})(QoSLevel || (exports.QoSLevel = QoSLevel = {}));
/**
 * MQTT packet types according to MQTT 3.1.1 specification
 */
var PacketType;
(function (PacketType) {
    PacketType[PacketType["CONNECT"] = 1] = "CONNECT";
    PacketType[PacketType["CONNACK"] = 2] = "CONNACK";
    PacketType[PacketType["PUBLISH"] = 3] = "PUBLISH";
    PacketType[PacketType["PUBACK"] = 4] = "PUBACK";
    PacketType[PacketType["PUBREC"] = 5] = "PUBREC";
    PacketType[PacketType["PUBREL"] = 6] = "PUBREL";
    PacketType[PacketType["PUBCOMP"] = 7] = "PUBCOMP";
    PacketType[PacketType["SUBSCRIBE"] = 8] = "SUBSCRIBE";
    PacketType[PacketType["SUBACK"] = 9] = "SUBACK";
    PacketType[PacketType["UNSUBSCRIBE"] = 10] = "UNSUBSCRIBE";
    PacketType[PacketType["UNSUBACK"] = 11] = "UNSUBACK";
    PacketType[PacketType["PINGREQ"] = 12] = "PINGREQ";
    PacketType[PacketType["PINGRESP"] = 13] = "PINGRESP";
    PacketType[PacketType["DISCONNECT"] = 14] = "DISCONNECT";
})(PacketType || (exports.PacketType = PacketType = {}));
/**
 * Connection states
 */
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["CONNECTING"] = "connecting";
    ConnectionState["CONNECTED"] = "connected";
    ConnectionState["DISCONNECTING"] = "disconnecting";
    ConnectionState["DISCONNECTED"] = "disconnected";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
/**
 * CONNACK return codes
 */
var ConnackReturnCode;
(function (ConnackReturnCode) {
    ConnackReturnCode[ConnackReturnCode["ACCEPTED"] = 0] = "ACCEPTED";
    ConnackReturnCode[ConnackReturnCode["UNACCEPTABLE_PROTOCOL_VERSION"] = 1] = "UNACCEPTABLE_PROTOCOL_VERSION";
    ConnackReturnCode[ConnackReturnCode["IDENTIFIER_REJECTED"] = 2] = "IDENTIFIER_REJECTED";
    ConnackReturnCode[ConnackReturnCode["SERVER_UNAVAILABLE"] = 3] = "SERVER_UNAVAILABLE";
    ConnackReturnCode[ConnackReturnCode["BAD_USERNAME_OR_PASSWORD"] = 4] = "BAD_USERNAME_OR_PASSWORD";
    ConnackReturnCode[ConnackReturnCode["NOT_AUTHORIZED"] = 5] = "NOT_AUTHORIZED";
})(ConnackReturnCode || (exports.ConnackReturnCode = ConnackReturnCode = {}));
/**
 * SUBACK return codes
 */
var SubackReturnCode;
(function (SubackReturnCode) {
    SubackReturnCode[SubackReturnCode["MAXIMUM_QOS_0"] = 0] = "MAXIMUM_QOS_0";
    SubackReturnCode[SubackReturnCode["MAXIMUM_QOS_1"] = 1] = "MAXIMUM_QOS_1";
    SubackReturnCode[SubackReturnCode["MAXIMUM_QOS_2"] = 2] = "MAXIMUM_QOS_2";
    SubackReturnCode[SubackReturnCode["FAILURE"] = 128] = "FAILURE";
})(SubackReturnCode || (exports.SubackReturnCode = SubackReturnCode = {}));
//# sourceMappingURL=mqtt.js.map