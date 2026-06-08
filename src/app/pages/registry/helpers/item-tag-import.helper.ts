import ItemTagModel from '../../../models/item-tag/item-tag.model';
import { getFileRelativePath } from './file.helper';
import { normalizeTagPath, normalizeTagValue } from './text-normalize.helper';

export function resolveItemTagId(file: File, fallbackNamespace?: string): string {
  const relativePath = getFileRelativePath(file);
  const withoutExtension = relativePath.replace(/\.json$/i, '');
  const rawSegments = withoutExtension
    .split(/[\\/]+/)
    .map((segment) => segment.trim())
    .filter((segment) => !!segment);

  if (!rawSegments.length) {
    return '';
  }

  const segments = rawSegments.map((segment) => normalizeTagPath(segment));
  const tagsIndex = segments.findIndex((segment) => segment === 'tags');
  const itemsIndex = tagsIndex >= 0 && segments[tagsIndex + 1] === 'items' ? tagsIndex + 1 : -1;

  if (itemsIndex > 0) {
    const namespace = segments[tagsIndex - 1] || fallbackNamespace || 'minecraft';
    const tagPath = segments.slice(itemsIndex + 1).join('/');
    return normalizeTagPath(`${namespace}:${tagPath}`);
  }

  if (segments.length >= 2) {
    const namespace = segments[0] || fallbackNamespace || 'minecraft';
    const tagPath = segments.slice(1).join('/');
    return normalizeTagPath(`${namespace}:${tagPath}`);
  }

  const namespace = fallbackNamespace || 'minecraft';
  return normalizeTagPath(`${namespace}:${segments[0]}`);
}

export async function parseItemTags(
  files: File[],
  fallbackNamespace?: string,
): Promise<ItemTagModel[]> {
  const parsedTags: ItemTagModel[] = [];

  for (const file of files) {
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as { values?: unknown };
      const values = Array.isArray(payload.values)
        ? payload.values
            .filter((value): value is string => typeof value === 'string')
            .map((value) => normalizeTagValue(value))
            .filter((value) => !!value)
        : [];

      if (!values.length) {
        continue;
      }

      const tagId = resolveItemTagId(file, fallbackNamespace);
      if (!tagId) {
        continue;
      }

      parsedTags.push({
        tagId,
        values: Array.from(new Set(values)),
      });
    } catch (error) {
      console.warn('Arquivo de tag invalido ignorado:', file.name, error);
    }
  }

  return parsedTags;
}

export function mergeItemTags(existingTags: ItemTagModel[], newTags: ItemTagModel[]): ItemTagModel[] {
  const mergedById = new Map<string, ItemTagModel>();

  for (const tag of existingTags) {
    const key = normalizeTagPath(tag.tagId ?? '');
    if (!key) {
      continue;
    }

    mergedById.set(key, {
      tagId: key,
      values: tag.values ? [...tag.values] : [],
    });
  }

  for (const tag of newTags) {
    const key = normalizeTagPath(tag.tagId ?? '');
    if (!key) {
      continue;
    }

    mergedById.set(key, {
      tagId: key,
      values: tag.values ? [...tag.values] : [],
    });
  }

  return Array.from(mergedById.values()).sort((left, right) =>
    (left.tagId ?? '').localeCompare(right.tagId ?? ''),
  );
}
