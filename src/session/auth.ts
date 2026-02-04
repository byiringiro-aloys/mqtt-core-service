/**
 * Authentication and Authorization system for MQTT broker
 */

import { EventEmitter } from 'events';

export interface User {
  username: string;
  password: string;
  permissions: {
    canPublish: string[]; // Topic patterns
    canSubscribe: string[]; // Topic patterns
  };
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class AuthenticationManager extends EventEmitter {
  private users: Map<string, User> = new Map();
  private requireAuth: boolean;

  constructor(requireAuth: boolean = false) {
    super();
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
  addUser(user: User): void {
    this.users.set(user.username, user);
    this.emit('userAdded', user.username);
  }

  /**
   * Remove user from the system
   */
  removeUser(username: string): void {
    if (this.users.delete(username)) {
      this.emit('userRemoved', username);
    }
  }

  /**
   * Authenticate user with username and password
   */
  authenticate(username?: string, password?: Buffer): AuthResult {
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
  canPublish(user: User, topic: string): boolean {
    return this.checkTopicPermission(user.permissions.canPublish, topic);
  }

  /**
   * Check if user can subscribe to topic
   */
  canSubscribe(user: User, topicFilter: string): boolean {
    return this.checkTopicPermission(user.permissions.canSubscribe, topicFilter);
  }

  /**
   * Check topic permission against patterns
   */
  private checkTopicPermission(patterns: string[], topic: string): boolean {
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
  private matchTopicPattern(pattern: string, topic: string): boolean {
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
  getUser(username: string): User | undefined {
    return this.users.get(username);
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Set authentication requirement
   */
  setRequireAuth(require: boolean): void {
    this.requireAuth = require;
  }

  /**
   * Check if authentication is required
   */
  isAuthRequired(): boolean {
    return this.requireAuth;
  }
}