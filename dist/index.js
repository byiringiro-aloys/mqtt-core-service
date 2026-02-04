"use strict";
/**
 * MQTT Broker Server Entry Point
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackConfig = exports.WebServer = exports.MQTTBroker = void 0;
exports.startBroker = startBroker;
require("dotenv/config");
const broker_1 = require("./broker");
Object.defineProperty(exports, "MQTTBroker", { enumerable: true, get: function () { return broker_1.MQTTBroker; } });
const web_server_1 = require("./web/web-server");
Object.defineProperty(exports, "WebServer", { enumerable: true, get: function () { return web_server_1.WebServer; } });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Load configuration from JSON files
 */
function loadConfig() {
    const env = process.env.NODE_ENV || 'development';
    const configDir = path.join(__dirname, '..', 'config');
    // Load default config
    const defaultConfigPath = path.join(configDir, 'default.json');
    let config = {};
    if (fs.existsSync(defaultConfigPath)) {
        config = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
    }
    // Load environment-specific config
    const envConfigPath = path.join(configDir, `${env}.json`);
    if (fs.existsSync(envConfigPath)) {
        const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
        config = { ...config, ...envConfig };
    }
    return config;
}
// Default fallback configuration
const fallbackConfig = {
    server: {
        port: 1883,
        host: '0.0.0.0',
        maxConnections: 1000,
        keepAliveTimeout: 60000
    },
    security: {
        enableTLS: false,
        requireAuth: false
    },
    persistence: {
        enabled: true,
        storageType: 'database',
        retainedMessageLimit: 1000
    },
    performance: {
        messageQueueLimit: 1000,
        inflightWindowSize: 100,
        workerThreads: 1
    }
};
exports.fallbackConfig = fallbackConfig;
/**
 * Create and start MQTT broker with web dashboard
 */
async function startBroker(config = {}) {
    // Load configuration from files
    let brokerConfig;
    try {
        brokerConfig = loadConfig();
    }
    catch (error) {
        brokerConfig = fallbackConfig;
    }
    // Merge with provided config
    brokerConfig = {
        ...brokerConfig,
        ...config,
        server: { ...brokerConfig.server, ...config.server },
        security: { ...brokerConfig.security, ...config.security },
        persistence: { ...brokerConfig.persistence, ...config.persistence },
        performance: { ...brokerConfig.performance, ...config.performance }
    };
    const broker = new broker_1.MQTTBroker(brokerConfig);
    // Use PORT environment variable for web dashboard (Render requirement)
    const webPort = parseInt(process.env.PORT || '8080');
    const webServer = new web_server_1.WebServer(broker, webPort);
    // Setup event listeners
    broker.on('brokerStarted', () => {
        // Server started silently
    });
    webServer.start().then(() => {
        // Web dashboard started silently
    });
    broker.on('brokerStopped', () => {
        // Server stopped silently
    });
    // Remove client connection/disconnection logs
    // Remove message published logs
    // Remove subscription logs
    broker.on('error', (error) => {
        console.error('Broker error:', error);
    });
    // Start the broker
    await broker.start();
    return { broker, webServer };
}
/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(broker, webServer) {
    const shutdown = async (signal) => {
        try {
            await Promise.all([
                broker.stop(),
                webServer.stop()
            ]);
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
}
// Start broker if this file is run directly
if (require.main === module) {
    startBroker()
        .then(({ broker, webServer }) => {
        setupGracefulShutdown(broker, webServer);
        // Silent startup - v2.0.0
    })
        .catch((error) => {
        console.error('Failed to start services:', error);
        process.exit(1);
    });
}
__exportStar(require("./types"), exports);
__exportStar(require("./broker"), exports);
//# sourceMappingURL=index.js.map