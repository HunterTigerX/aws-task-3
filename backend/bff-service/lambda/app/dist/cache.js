"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.setToCache = exports.getFromCache = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const cache = new node_cache_1.default({ stdTTL: 120 }); // 2 minutes TTL
const getFromCache = (key) => {
    return cache.get(key);
};
exports.getFromCache = getFromCache;
const setToCache = (key, value) => {
    cache.set(key, value);
};
exports.setToCache = setToCache;
const clearCache = () => {
    cache.flushAll();
};
exports.clearCache = clearCache;
