/**
 * Authentication and Authorization system for MQTT broker
 */
import { EventEmitter } from 'events';
export interface User {
    username: string;
    password: string;
    permissions: {
        canPublish: string[];
        canSubscribe: string[];
    };
}
export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
}
export declare class AuthenticationManager extends EventEmitter {
    private users;
    private requireAuth;
    constructor(requireAuth?: boolean);
    /**
     * Add user to the system
     */
    addUser(user: User): void;
    /**
     * Remove user from the system
     */
    removeUser(username: string): void;
    /**
     * Authenticate user with username and password
     */
    authenticate(username?: string, password?: Buffer): AuthResult;
    /**
     * Check if user can publish to topic
     */
    canPublish(user: User, topic: string): boolean;
    /**
     * Check if user can subscribe to topic
     */
    canSubscribe(user: User, topicFilter: string): boolean;
    /**
     * Check topic permission against patterns
     */
    private checkTopicPermission;
    /**
     * Match topic against pattern with wildcards
     */
    private matchTopicPattern;
    /**
     * Get user by username
     */
    getUser(username: string): User | undefined;
    /**
     * Get all users
     */
    getAllUsers(): User[];
    /**
     * Set authentication requirement
     */
    setRequireAuth(require: boolean): void;
    /**
     * Check if authentication is required
     */
    isAuthRequired(): boolean;
}
//# sourceMappingURL=auth.d.ts.map