export class ReactionCache {
  constructor({ maxEntries = 128 } = {}) {
    this.maxEntries = normalizeCapacity(maxEntries, "invalid cache capacity");
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return null;
    const value = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, value);
    return structuredClone(value);
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, structuredClone(value));
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }

  delete(key) {
    return this.map.delete(key);
  }

  size() {
    return this.map.size;
  }
}

function normalizeCapacity(value, message) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(message);
  }
  return value;
}
