/**
 * Persistence for ForceCamp.
 *
 * Deliberately async so the app component doesn't care where state lives.
 * On the web this is localStorage. In a Claude artifact it's window.storage.
 * Both are detected at runtime, and both degrade to session-only memory if
 * unavailable (Safari private browsing throws on localStorage.setItem).
 */

const mem = new Map();

const hasArtifactStorage = () =>
  typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";

const hasLocalStorage = () => {
  try {
    const k = "__bc_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
};

export const store = {
  async get(key) {
    try {
      if (hasArtifactStorage()) {
        const r = await window.storage.get(key);
        return r ? JSON.parse(r.value) : null;
      }
      if (hasLocalStorage()) {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }
    } catch {
      /* fall through to memory */
    }
    return mem.has(key) ? mem.get(key) : null;
  },

  async set(key, value) {
    mem.set(key, value);
    try {
      if (hasArtifactStorage()) {
        await window.storage.set(key, JSON.stringify(value));
        return;
      }
      if (hasLocalStorage()) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      /* memory copy above is the fallback */
    }
  },

  async remove(key) {
    mem.delete(key);
    try {
      if (hasArtifactStorage() && typeof window.storage.delete === "function") {
        await window.storage.delete(key);
        return;
      }
      if (hasLocalStorage()) {
        window.localStorage.removeItem(key);
      }
    } catch {
      /* memory copy above is the fallback */
    }
  },
};
