export function toPlain<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => toPlain(item)) as unknown as T;
  }

  if (value && typeof value === 'object' && value.constructor === Object) {
    const plainObject: Record<string | symbol, unknown> = {};

    for (const [key, val] of Object.entries(value)) {
      plainObject[key] = toPlain(val);
    }

    return plainObject as T;
  }

  return value;
}
