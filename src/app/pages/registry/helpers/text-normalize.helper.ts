export function normalizeKey(value?: string): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeTagValue(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeTagPath(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/[^a-z0-9_/:.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}
