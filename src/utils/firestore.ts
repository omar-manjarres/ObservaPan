/**
 * Recursively removes `undefined` values (and empty arrays/objects are kept).
 * Firestore rejects `undefined`; this is a defensive guard used before writes
 * so no malformed payload can ever reach addDoc/updateDoc.
 */
export function pruneUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => pruneUndefined(v)) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = pruneUndefined(v);
    }
    return out as T;
  }
  return value;
}
