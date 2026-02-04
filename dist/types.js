"use strict";
/**
 * Core MQTT data models and interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectReturnCode = exports.QoSLevel = exports.PacketType = void 0;
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
var QoSLevel;
(function (QoSLevel) {
    QoSLevel[QoSLevel["AT_MOST_ONCE"] = 0] = "AT_MOST_ONCE";
    QoSLevel[QoSLevel["AT_LEAST_ONCE"] = 1] = "AT_LEAST_ONCE";
    QoSLevel[QoSLevel["EXACTLY_ONCE"] = 2] = "EXACTLY_ONCE"; // Assured delivery
})(QoSLevel || (exports.QoSLevel = QoSLevel = {}));
var ConnectReturnCode;
(function (ConnectReturnCode) {
    ConnectReturnCode[ConnectReturnCode["ACCEPTED"] = 0] = "ACCEPTED";
    ConnectReturnCode[ConnectReturnCode["UNACCEPTABLE_PROTOCOL_VERSION"] = 1] = "UNACCEPTABLE_PROTOCOL_VERSION";
    ConnectReturnCode[ConnectReturnCode["IDENTIFIER_REJECTED"] = 2] = "IDENTIFIER_REJECTED";
    ConnectReturnCode[ConnectReturnCode["SERVER_UNAVAILABLE"] = 3] = "SERVER_UNAVAILABLE";
    ConnectReturnCode[ConnectReturnCode["BAD_USERNAME_OR_PASSWORD"] = 4] = "BAD_USERNAME_OR_PASSWORD";
    ConnectReturnCode[ConnectReturnCode["NOT_AUTHORIZED"] = 5] = "NOT_AUTHORIZED";
})(ConnectReturnCode || (exports.ConnectReturnCode = ConnectReturnCode = {}));
//# sourceMappingURL=types.js.map