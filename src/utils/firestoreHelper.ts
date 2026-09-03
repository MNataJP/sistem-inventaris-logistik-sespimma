/**
 * Utility functions for Firestore operations
 */

/**
 * Recursively strips undefined fields from an object so Firestore doesn't reject it with:
 * "Unsupported field value: undefined"
 */
export function removeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item)) as unknown as T;
  }

  // Handle Date, FieldValue (serverTimestamp, etc.)
  if (
    obj instanceof Date ||
    ('_methodName' in (obj as any)) ||
    ('nanoseconds' in (obj as any) && 'seconds' in (obj as any))
  ) {
    return obj;
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = removeUndefined(value);
    }
  }
  return result;
}
