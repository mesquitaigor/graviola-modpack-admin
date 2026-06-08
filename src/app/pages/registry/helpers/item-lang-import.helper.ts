import LangModel from '../../../models/lang/lang.model';
import { getFileRelativePath } from './file.helper';

export function resolveLangLocale(file: File): string {
  const relativePath = getFileRelativePath(file).toLowerCase();
  const fromPathMatch = relativePath.match(/\/lang\/([a-z]{2}_[a-z]{2})\.json$/i);
  if (fromPathMatch?.[1]) {
    return fromPathMatch[1].toLowerCase();
  }

  const fromNameMatch = file.name.toLowerCase().match(/^([a-z]{2}_[a-z]{2})\.json$/);
  if (fromNameMatch?.[1]) {
    return fromNameMatch[1].toLowerCase();
  }

  return 'unknown';
}

export async function parseItemLangFiles(files: File[]): Promise<LangModel[]> {
  const langsByLocale = new Map<string, Record<string, string>>();

  for (const file of files) {
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as Record<string, unknown>;
      const values: Record<string, string> = {};

      for (const [key, value] of Object.entries(payload)) {
        if (typeof value !== 'string') {
          continue;
        }

        const normalizedKey = key.trim().toLowerCase();
        if (!normalizedKey) {
          continue;
        }

        values[normalizedKey] = value.trim();
      }

      const locale = resolveLangLocale(file);
      if (!locale || !Object.keys(values).length) {
        continue;
      }

      const currentValues = langsByLocale.get(locale) ?? {};
      langsByLocale.set(locale, {
        ...currentValues,
        ...values,
      });
    } catch (error) {
      console.warn('Arquivo de lang invalido ignorado:', file.name, error);
    }
  }

  return Array.from(langsByLocale.entries())
    .map(([locale, values]) => ({ locale, values }))
    .sort((left, right) => (left.locale ?? '').localeCompare(right.locale ?? ''));
}

export function filterLangsByKeyPrefix(langs: LangModel[], prefix: string): LangModel[] {
  return langs
    .map((lang) => ({
      locale: lang.locale,
      values: Object.fromEntries(
        Object.entries(lang.values ?? {}).filter(([key]) => key.startsWith(prefix)),
      ),
    }))
    .filter((lang) => Object.keys(lang.values).length > 0);
}

export function mergeItemLangs(existingLangs: LangModel[], newLangs: LangModel[]): LangModel[] {
  const mergedByLocale = new Map<string, LangModel>();

  for (const lang of existingLangs) {
    const locale = (lang.locale ?? '').trim().toLowerCase();
    if (!locale) {
      continue;
    }

    mergedByLocale.set(locale, {
      locale,
      values: lang.values ? { ...lang.values } : {},
    });
  }

  for (const lang of newLangs) {
    const locale = (lang.locale ?? '').trim().toLowerCase();
    if (!locale) {
      continue;
    }

    const current = mergedByLocale.get(locale);
    mergedByLocale.set(locale, {
      locale,
      values: {
        ...(current?.values ?? {}),
        ...(lang.values ?? {}),
      },
    });
  }

  return Array.from(mergedByLocale.values()).sort((left, right) =>
    (left.locale ?? '').localeCompare(right.locale ?? ''),
  );
}
