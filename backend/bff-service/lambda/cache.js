const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 120 }); // 2 minutes TTL

const getFromCache = (key) => {
  return cache.get(key);
};

const setToCache = (key, value) => {
  cache.set(key, value);
};

const clearCache = () => {
  cache.flushAll();
};

module.exports = {
  getFromCache,
  setToCache,
  clearCache
};