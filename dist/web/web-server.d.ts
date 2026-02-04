/**
 * Web Server for MQTT Broker Dashboard with Sidebar Navigation
 */
import { MQTTBroker } from '../broker';
export declare class WebServer {
    private server;
    private broker;
    private port;
    constructor(broker: MQTTBroker, port?: number);
    private handleRequest;
    private serveDashboard;
    private serveStats;
    private serveConfig;
    private serve404;
    private serve500;
    private generateDashboardHTML;
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=web-server.d.ts.map