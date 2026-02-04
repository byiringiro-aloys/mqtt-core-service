"use strict";
/**
 * Authentication and Authorization system for MQTT broker
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationManager = void 0;
const events_1 = require("events");
class AuthenticationManager extends events_1.EventEmitter {
    constructor(requireAuth = false) {
        super();
        this.users = new Map();
        this.requireAuth = requireAuth;
        // Add default admin user for testing
        this.addUser({
            username: 'admin',
            password: 'admin123',
            permissions: {
                canPublish: ['#'], // Can publish to all topics
                canSubscribe: ['#'] // Can subscribe to all topics
            }
        });
    }
    /**
     * Add user to the system
     */
    addUser(user) {
        this.users.set(user.username, user);
        this.emit('userAdded', user.username);
    }
    /**
     * Remove user from the system
     */
    removeUser(username) {
        if (this.users.delete(username)) {
            this.emit('userRemoved', username);
        }
    }
    /**
     * Authenticate user with username and password
     */
    authenticate(username, password) {
        // If authentication is not required, allow anonymous access
        if (!this.requireAuth) {
            return {
                success: true,
                user: {
                    username: 'anonymous',
                    password: '',
                    permissions: {
                        canPublish: ['#'],
                        canSubscribe: ['#']
                    }
                }
            };
        }
        // Authentication is required
        if (!username || !password) {
            return {
                success: false,
                error: 'Username and password required'
            };
        }
        const user = this.users.get(username);
        if (!user) {
            return {
                success: false,
                error: 'User not found'
            };
        }
        // Simple password comparison (in production, use proper hashing)
        const passwordString = password.toString('utf8');
        if (user.password !== passwordString) {
            return {
                success: false,
                error: 'Invalid password'
            };
        }
        return {
            success: true,
            user
        };
    }
    /**
     * Check if user can publish to topic
     */
    canPublish(user, topic) {
        return this.checkTopicPermission(user.permissions.canPublish, topic);
    }
    /**
     * Check if user can subscribe to topic
     */
    canSubscribe(user, topicFilter) {
        return this.checkTopicPermission(user.permissions.canSubscribe, topicFilter);
    }
    /**
     * Check topic permission against patterns
     */
    checkTopicPermission(patterns, topic) {
        for (const pattern of patterns) {
            if (this.matchTopicPattern(pattern, topic)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Match topic against pattern with wildcards
     */
    matchTopicPattern(pattern, topic) {
        // Convert MQTT wildcard pattern to regex
        const regexPattern = pattern
            .replace(/\+/g, '[^/]+') // Single level wildcard
            .replace(/#$/, '.*') // Multi level wildcard at end
            .replace(/\//g, '\\/'); // Escape forward slashes
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(topic);
    }
    /**
     * Get user by username
     */
    getUser(username) {
        return this.users.get(username);
    }
    /**
     * Get all users
     */
    getAllUsers() {
        return Array.from(this.users.values());
    }
    /**
     * Set authentication requirement
     */
    setRequireAuth(require) {
        this.requireAuth = require;
    }
    /**
     * Check if authentication is required
     */
    isAuthRequired() {
        return this.requireAuth;
    }
}
exports.AuthenticationManager = AuthenticationManager;
//# sourceMappingURL=auth.js.map