import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 120 }); // 2 minutes TTL

export const getFromCache = (key: string) => {
  return cache.get(key);
};

export const setToCache = (key: string, value: any) => {
  cache.set(key, value);
};

export const clearCache = () => {
  cache.flushAll();
};