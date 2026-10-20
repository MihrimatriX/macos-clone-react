// Bun has no Web Storage; persisted stores need a stand-in during tests.
const data = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => void data.set(key, value),
  removeItem: (key) => void data.delete(key),
  clear: () => data.clear(),
  key: (i) => [...data.keys()][i] ?? null,
  get length() {
    return data.size;
  },
};
