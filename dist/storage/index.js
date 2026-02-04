"use strict";
/**
 * Storage module exports
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorage = exports.MongoDBStorage = exports.StorageManager = void 0;
var storage_manager_1 = require("./storage-manager");
Object.defineProperty(exports, "StorageManager", { enumerable: true, get: function () { return storage_manager_1.StorageManager; } });
var mongodb_storage_1 = require("./mongodb-storage");
Object.defineProperty(exports, "MongoDBStorage", { enumerable: true, get: function () { return mongodb_storage_1.MongoDBStorage; } });
var memory_storage_1 = require("./memory-storage");
Object.defineProperty(exports, "MemoryStorage", { enumerable: true, get: function () { return memory_storage_1.MemoryStorage; } });
//# sourceMappingURL=index.js.map