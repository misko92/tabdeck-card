import { describe, it, expect } from "vitest";
import {
  storageKey,
  loadInitialIndex,
  persistIndex,
  parseHashIndex,
  touchSeen,
  isRememberFresh,
  loadCollapsed,
} from "./persistence";

function memStorage(seed: Record<string, string> = {}): Storage {
  const m = new Map(Object.entries(seed));
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() {
      return m.size;
    },
  } as Storage;
}

describe("loadInitialIndex entity mode", () => {
  it("reads the index from the entity value, clamped", () => {
    expect(loadInitialIndex({ mode: "entity", cardKey: "k", defaultIndex: 0, tabCount: 3, entityValue: "2" })).toBe(2);
    expect(loadInitialIndex({ mode: "entity", cardKey: "k", defaultIndex: 1, tabCount: 3, entityValue: "9" })).toBe(1);
    expect(loadInitialIndex({ mode: "entity", cardKey: "k", defaultIndex: 1, tabCount: 3, entityValue: undefined })).toBe(1);
    expect(loadInitialIndex({ mode: "entity", cardKey: "k", defaultIndex: 0, tabCount: 3, entityValue: "x" })).toBe(0);
  });
});

describe("parseHashIndex", () => {
  it("matches a tab name", () => {
    expect(parseHashIndex("#tab=Lights", ["Lights", "Climate"])).toBe(0);
  });
  it("matches a numeric index", () => {
    expect(parseHashIndex("#tab=1", ["Lights", "Climate"])).toBe(1);
  });
  it("matches a tab name case-insensitively and by slug", () => {
    expect(parseHashIndex("#tab=lights", ["Lights", "Climate"])).toBe(0);
    expect(parseHashIndex("#tab=living-room", ["Kitchen", "Living Room"])).toBe(1);
    expect(parseHashIndex("#tab=Living%20Room", ["Kitchen", "Living Room"])).toBe(1);
  });
  it("prefers an exact name over a slug match", () => {
    expect(parseHashIndex("#tab=a-b", ["A B", "a-b"])).toBe(1);
  });
  it("returns null for no/unknown hash", () => {
    expect(parseHashIndex("", ["A"])).toBeNull();
    expect(parseHashIndex("#tab=ZZ", ["A"])).toBeNull();
  });
});

describe("loadInitialIndex", () => {
  it("uses the default when mode is none", () => {
    expect(loadInitialIndex({ mode: "none", cardKey: "k", defaultIndex: 1, tabCount: 3 })).toBe(1);
  });
  it("reads localStorage when mode is browser", () => {
    const storage = memStorage({ [storageKey("k")]: "2" });
    expect(loadInitialIndex({ mode: "browser", cardKey: "k", defaultIndex: 0, tabCount: 3, storage })).toBe(2);
  });
  it("prefers the URL hash when mode is url", () => {
    expect(loadInitialIndex({ mode: "url", cardKey: "k", defaultIndex: 0, tabCount: 3, hash: "#tab=2" })).toBe(2);
  });
  it("clamps an out-of-range stored value to the default", () => {
    const storage = memStorage({ [storageKey("k")]: "9" });
    expect(loadInitialIndex({ mode: "browser", cardKey: "k", defaultIndex: 1, tabCount: 3, storage })).toBe(1);
  });
});

describe("persistIndex", () => {
  it("writes localStorage in browser mode", () => {
    const storage = memStorage();
    persistIndex({ mode: "browser", cardKey: "k", index: 2, storage });
    expect(storage.getItem(storageKey("k"))).toBe("2");
  });
  it("returns a hash in url mode using the tab name", () => {
    const r = persistIndex({ mode: "url", cardKey: "k", index: 1, tabName: "Climate" });
    expect(r.hash).toBe("#tab=Climate");
  });
  it("is a no-op in none mode", () => {
    const storage = memStorage();
    const r = persistIndex({ mode: "none", cardKey: "k", index: 1, storage });
    expect(r.hash).toBeUndefined();
    expect(storage.length).toBe(0);
  });
});

describe("remember_for (forget remembered state after time away)", () => {
  const key = storageKey("k");
  const seen = key + ":seen";
  const NOW = 1_000_000_000;

  it("uses the remembered tab when seen within remember_for", () => {
    const storage = memStorage({ [key]: "2", [seen]: String(NOW - 60_000) });
    expect(
      loadInitialIndex({ mode: "browser", cardKey: "k", defaultIndex: 0, tabCount: 3, storage, rememberFor: 300, now: NOW }),
    ).toBe(2);
  });

  it("falls back to the default tab when last seen longer ago", () => {
    const storage = memStorage({ [key]: "2", [seen]: String(NOW - 301_000) });
    expect(
      loadInitialIndex({ mode: "browser", cardKey: "k", defaultIndex: 0, tabCount: 3, storage, rememberFor: 300, now: NOW }),
    ).toBe(0);
  });

  it("treats a missing or bad seen time as expired", () => {
    expect(
      loadInitialIndex({ mode: "browser", cardKey: "k", defaultIndex: 1, tabCount: 3, storage: memStorage({ [key]: "2" }), rememberFor: 300, now: NOW }),
    ).toBe(1);
    expect(
      loadInitialIndex({ mode: "browser", cardKey: "k", defaultIndex: 1, tabCount: 3, storage: memStorage({ [key]: "2", [seen]: "x" }), rememberFor: 300, now: NOW }),
    ).toBe(1);
  });

  it("keeps the old forever behaviour without remember_for", () => {
    const storage = memStorage({ [key]: "2" });
    expect(loadInitialIndex({ mode: "browser", cardKey: "k", defaultIndex: 0, tabCount: 3, storage })).toBe(2);
  });

  it("touchSeen records the time and makes state fresh again", () => {
    const storage = memStorage({ [key]: "2" });
    touchSeen("k", storage, NOW);
    expect(storage.getItem(seen)).toBe(String(NOW));
    expect(isRememberFresh("k", 300, storage, NOW + 299_000)).toBe(true);
    expect(isRememberFresh("k", 300, storage, NOW + 301_000)).toBe(false);
  });

  it("loadCollapsed ignores an expired fold state", () => {
    const storage = memStorage({ [key + ":collapsed"]: "0", [seen]: String(NOW - 600_000) });
    expect(loadCollapsed("k", storage, 300, NOW)).toBe(null);
    expect(loadCollapsed("k", storage, 900, NOW)).toBe(false);
    expect(loadCollapsed("k", storage)).toBe(false);
  });
});
