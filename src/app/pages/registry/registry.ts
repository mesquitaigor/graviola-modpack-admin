import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import ItemModel from '../../models/item/item.model';
import LangFileModel from '../../models/lang-file/lang-file.model';
import ItemTagModel from '../../models/item-tag/item-tag.model';
import ItemTextureModel from '../../models/item-texture/item-texture.model';
import { RegistryService } from '../../models/registry/registry.service';
import { UploadItemLangDialogComponent } from './components/upload-item-lang-dialog/upload-item-lang-dialog';
import { UploadItemTagsDialogComponent } from './components/upload-item-tags-dialog/upload-item-tags-dialog';
import { UploadTexturesDialogComponent } from './components/upload-textures-dialog/upload-textures-dialog';
import { TexturesGalleryDialogComponent } from './components/textures-gallery-dialog/textures-gallery-dialog';
import {
  type TextureImportReviewItem,
  TexturesImportReviewDialogComponent,
} from './components/textures-import-review-dialog/textures-import-review-dialog';
import { ButtonModule } from 'primeng/button';
import { AddItemDialogComponent } from './components/add-item-dialog/add-item-dialog';

type ImportSource = 'textures' | 'tags' | 'lang';

interface RegistryImportSourceSummary {
  selectedFiles: number;
  importedEntries: number;
  conflicts: number;
  skipped: number;
  locales: number;
}

interface RegistryImportSession {
  textures: RegistryImportSourceSummary;
  tags: RegistryImportSourceSummary;
  lang: RegistryImportSourceSummary;
  updatedAt?: string;
}

@Component({
  selector: 'app-registry',
  imports: [
    ButtonModule,
    AddItemDialogComponent,
    UploadItemLangDialogComponent,
    UploadItemTagsDialogComponent,
    UploadTexturesDialogComponent,
    TexturesGalleryDialogComponent,
    TexturesImportReviewDialogComponent,
  ],
  templateUrl: './registry.html',
})
export class Registry {
  private readonly route = inject(ActivatedRoute);
  private readonly registryService = inject(RegistryService);

  private readonly registryId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { initialValue: 0 },
  );
  private readonly registries = toSignal(this.registryService.registries$, {
    initialValue: [],
  });

  public readonly registry = computed(() =>
    this.registries().find((registry) => registry.id === this.registryId()),
  );
  public readonly items = computed(() => this.registry()?.items ?? []);
  public readonly itemLangs = computed(() => this.registry()?.langsFiles ?? []);
  public readonly itemTags = computed(() => this.registry()?.itemTags ?? []);
  public readonly itemLangEntryCount = computed(() =>
    this.itemLangs().reduce(
      (count, lang) => count + Object.keys(lang.values ?? {}).length,
      0,
    ),
  );
  public readonly itemTextures = computed(
    () => this.registry()?.itemTextures ?? [],
  );
  public readonly texturePreview = signal<ItemTextureModel[]>([]);
  public readonly pendingTextureImports = signal<TextureImportReviewItem[]>([]);
  public readonly showUploadItemLangDialog = signal(false);
  public readonly showUploadItemTagsDialog = signal(false);
  public readonly showUploadTexturesDialog = signal(false);
  public readonly showImportReviewDialog = signal(false);
  public readonly showAllTexturesDialog = signal(false);
  public readonly showAddItemDialog = signal(false);
  public readonly itemLangImportInProgress = signal(false);
  public readonly itemLangImportSummary = signal('');
  public readonly itemTagsImportInProgress = signal(false);
  public readonly itemTagsImportSummary = signal('');
  public readonly uploadInProgress = signal(false);
  public readonly uploadSummary = signal('');
  public readonly importSession = signal<RegistryImportSession>({
    textures: {
      selectedFiles: 0,
      importedEntries: 0,
      conflicts: 0,
      skipped: 0,
      locales: 0,
    },
    tags: {
      selectedFiles: 0,
      importedEntries: 0,
      conflicts: 0,
      skipped: 0,
      locales: 0,
    },
    lang: {
      selectedFiles: 0,
      importedEntries: 0,
      conflicts: 0,
      skipped: 0,
      locales: 0,
    },
    updatedAt: undefined,
  });
  public readonly resolveTextureSrc = (texture: ItemTextureModel) =>
    this.textureSrc(texture);
  public readonly resolvePendingTextureSrc = (item: TextureImportReviewItem) =>
    this.pendingTextureSrc(item);
  public readonly resolveExistingPendingTextureSrc = (
    item: TextureImportReviewItem,
  ) => this.existingPendingTextureSrc(item);

  private readonly textureObjectUrls = new Map<string, string>();

  constructor() {
    effect(() => {
      const textures = this.itemTextures();
      this.texturePreview.set(this.pickRandomTextures(textures, 5));
      this.clearTextureUrlCache();
    });
    effect(() => {
      this.itemTextures();
      this.clearTextureUrlCache();
    });
  }

  public updateNamespace(namespace: string): void {
    const currentRegistry = this.registry();
    if (!currentRegistry?.id) {
      return;
    }

    this.registryService.update(currentRegistry.id, { namespace }).subscribe();
  }

  public async uploadTextures(files: File[]): Promise<void> {
    const currentRegistry = this.registry();
    this.updateImportSession('textures', {
      selectedFiles: files.length,
    });

    if (!currentRegistry?.id) {
      this.uploadSummary.set('Registro nao encontrado para salvar texturas.');
      return;
    }

    if (!files.length) {
      this.uploadSummary.set('Nenhuma imagem selecionada.');
      return;
    }

    try {
      const imageFiles = files.filter((file) => this.isTextureFile(file));

      if (!imageFiles.length) {
        this.showUploadTexturesDialog.set(false);
        this.uploadSummary.set(
          'Nenhuma textura de imagem valida foi encontrada.',
        );
        return;
      }

      const existingTextures = new Map<string, ItemTextureModel>();
      for (const texture of currentRegistry.itemTextures ?? []) {
        const key = this.normalizeKey(texture.itemId ?? texture.itemName);
        if (key) {
          existingTextures.set(key, texture);
        }
      }

      const reviewItems: TextureImportReviewItem[] = [];

      for (const file of imageFiles) {
        const itemKey = this.normalizeKey(file.name);
        if (!itemKey) {
          continue;
        }

        const existingTexture = existingTextures.get(itemKey);
        reviewItems.push({
          key: itemKey,
          fileName: file.name,
          itemName: this.fileBaseName(file.name),
          imageBlob: await this.fileToBlob(file),
          hasConflict: !!existingTexture,
          replaceConfirmed: !existingTexture,
          existingItemName:
            existingTexture?.itemName ?? existingTexture?.itemId ?? undefined,
          existingImageBlob: existingTexture?.imageBlob,
        });
      }

      const sortedReviewItems = [...reviewItems].sort((a, b) => {
        if (a.hasConflict !== b.hasConflict) {
          return a.hasConflict ? -1 : 1;
        }

        return a.itemName.localeCompare(b.itemName);
      });

      this.pendingTextureImports.set(sortedReviewItems);
      this.showUploadTexturesDialog.set(false);
      this.showImportReviewDialog.set(true);
      this.uploadSummary.set('');
      this.updateImportSession('textures', {
        importedEntries: sortedReviewItems.length,
        conflicts: sortedReviewItems.filter((item) => item.hasConflict).length,
      });
    } catch (e) {
      console.error(e);
      this.uploadSummary.set('Erro ao processar ou salvar as texturas.');
    }
  }

  public async uploadItemTags(files: File[]): Promise<void> {
    const currentRegistry = this.registry();
    this.updateImportSession('tags', {
      selectedFiles: files.length,
    });

    if (!currentRegistry?.id) {
      this.itemTagsImportSummary.set(
        'Registro nao encontrado para salvar tags.',
      );
      return;
    }

    if (!files.length) {
      this.itemTagsImportSummary.set('Nenhum arquivo JSON selecionado.');
      return;
    }

    this.itemTagsImportInProgress.set(true);

    try {
      const tagFiles = files.filter((file) => this.isItemTagFile(file));
      if (!tagFiles.length) {
        this.itemTagsImportSummary.set(
          'Nenhum arquivo de tag valido foi encontrado.',
        );
        return;
      }

      const parsedTags = await this.parseItemTags(tagFiles, currentRegistry);
      if (!parsedTags.length) {
        this.itemTagsImportSummary.set(
          'Nenhuma tag valida foi encontrada nos JSONs.',
        );
        return;
      }

      const mergedItemTags = this.mergeItemTags(
        currentRegistry.itemTags ?? [],
        parsedTags,
      );

      await firstValueFrom(
        this.registryService.update(currentRegistry.id, {
          itemTags: mergedItemTags,
        }),
      );

      this.showUploadItemTagsDialog.set(false);
      this.itemTagsImportSummary.set(
        `${parsedTags.length} tag(s) de item importada(s) com sucesso.`,
      );
      this.updateImportSession('tags', {
        importedEntries: parsedTags.length,
      });
    } catch (e) {
      console.error(e);
      this.itemTagsImportSummary.set('Erro ao importar tags de itens.');
    } finally {
      this.itemTagsImportInProgress.set(false);
    }
  }

  public async uploadItemLang(files: File[]): Promise<void> {
    const currentRegistry = this.registry();
    this.updateImportSession('lang', {
      selectedFiles: files.length,
    });

    if (!currentRegistry?.id) {
      this.itemLangImportSummary.set(
        'Registro nao encontrado para salvar lang.',
      );
      return;
    }

    if (!files.length) {
      this.itemLangImportSummary.set('Nenhum arquivo de lang selecionado.');
      return;
    }

    this.itemLangImportInProgress.set(true);

    try {
      const langFiles = files.filter((file) => this.isItemLangFile(file));
      if (!langFiles.length) {
        this.itemLangImportSummary.set(
          'Nenhum arquivo de lang valido foi encontrado.',
        );
        return;
      }

      const parsedLangs = await this.parseItemLangFiles(langFiles);
      if (!parsedLangs.length) {
        this.itemLangImportSummary.set(
          'Nenhuma traducao valida foi encontrada nos JSONs.',
        );
        return;
      }

      const mergedItemLangs = this.mergeItemLangs(
        currentRegistry.langsFiles ?? [],
        parsedLangs,
      );

      await firstValueFrom(
        this.registryService.update(currentRegistry.id, {
          langsFiles: mergedItemLangs,
        }),
      );

      const importedEntries = parsedLangs.reduce(
        (count, lang) => count + Object.keys(lang.values ?? {}).length,
        0,
      );

      this.showUploadItemLangDialog.set(false);
      this.itemLangImportSummary.set(
        `${parsedLangs.length} locale(s) e ${importedEntries} traducao(oes) importada(s) com sucesso.`,
      );
      this.updateImportSession('lang', {
        importedEntries,
        locales: parsedLangs.length,
      });
    } catch (e) {
      console.error(e);
      this.itemLangImportSummary.set('Erro ao importar arquivos de lang.');
    } finally {
      this.itemLangImportInProgress.set(false);
    }
  }

  public confirmTextureReplacement(key: string): void {
    this.pendingTextureImports.update((items) =>
      items.map((item) =>
        item.key === key ? { ...item, replaceConfirmed: true } : item,
      ),
    );
  }

  public confirmAllTextureReplacements(): void {
    this.pendingTextureImports.update((items) =>
      items.map((item) =>
        item.hasConflict ? { ...item, replaceConfirmed: true } : item,
      ),
    );
  }

  public cancelTextureImport(): void {
    this.pendingTextureImports.set([]);
    this.showImportReviewDialog.set(false);
  }

  public async confirmTextureImport(): Promise<void> {
    const currentRegistry = this.registry();
    if (!currentRegistry?.id) {
      this.uploadSummary.set('Registro nao encontrado para salvar texturas.');
      return;
    }

    this.uploadInProgress.set(true);

    try {
      const texturesByKey = new Map<string, ItemTextureModel>();

      for (const texture of currentRegistry.itemTextures ?? []) {
        const key = this.normalizeKey(texture.itemId ?? texture.itemName);
        if (key) {
          texturesByKey.set(key, texture);
        }
      }

      let importedCount = 0;
      let skippedConflicts = 0;
      for (const item of this.pendingTextureImports()) {
        if (item.hasConflict && !item.replaceConfirmed) {
          skippedConflicts += 1;
          continue;
        }

        texturesByKey.set(item.key, {
          itemId: item.key,
          itemName: item.itemName,
          imageBlob: item.imageBlob,
        });
        importedCount += 1;
      }

      await firstValueFrom(
        this.registryService.update(currentRegistry.id, {
          itemTextures: Array.from(texturesByKey.values()),
        }),
      );

      this.pendingTextureImports.set([]);
      this.showImportReviewDialog.set(false);
      this.uploadSummary.set(
        skippedConflicts
          ? `${importedCount} textura(s) importada(s). ${skippedConflicts} conflito(s) nao confirmado(s) foram ignorados.`
          : `${importedCount} textura(s) importada(s) com sucesso.`,
      );
      this.updateImportSession('textures', {
        importedEntries: importedCount,
        skipped: skippedConflicts,
      });
    } catch (e) {
      console.error(e);
      this.uploadSummary.set('Erro ao importar as texturas.');
    } finally {
      this.uploadInProgress.set(false);
    }
  }

  private normalizeKey(value?: string): string {
    return (value ?? '')
      .toLowerCase()
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private normalizeTagValue(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeTagPath(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\\/g, '/')
      .replace(/[^a-z0-9_/:.-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private fileBaseName(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, '');
  }

  private isTextureFile(file: File): boolean {
    if (file.type.startsWith('image/')) {
      return true;
    }

    const name = file.name.toLowerCase();
    return /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.tga)$/.test(name);
  }

  private isItemTagFile(file: File): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.json') || file.type === 'application/json';
  }

  private isItemLangFile(file: File): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.json') || file.type === 'application/json';
  }

  private async parseItemLangFiles(files: File[]): Promise<LangFileModel[]> {
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

        const locale = this.resolveLangLocale(file);
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
      .sort((left, right) =>
        (left.locale ?? '').localeCompare(right.locale ?? ''),
      );
  }

  private resolveLangLocale(file: File): string {
    const relativePath = this.getFileRelativePath(file).toLowerCase();
    const fromPathMatch = relativePath.match(
      /\/lang\/([a-z]{2}_[a-z]{2})\.json$/i,
    );
    if (fromPathMatch?.[1]) {
      return fromPathMatch[1].toLowerCase();
    }

    const fromNameMatch = file.name
      .toLowerCase()
      .match(/^([a-z]{2}_[a-z]{2})\.json$/);
    if (fromNameMatch?.[1]) {
      return fromNameMatch[1].toLowerCase();
    }

    return 'unknown';
  }

  private async parseItemTags(
    files: File[],
    registry: { namespace?: string },
  ): Promise<ItemTagModel[]> {
    const parsedTags: ItemTagModel[] = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const payload = JSON.parse(text) as { values?: unknown };
        const values = Array.isArray(payload.values)
          ? payload.values
              .filter((value): value is string => typeof value === 'string')
              .map((value) => this.normalizeTagValue(value))
              .filter((value) => !!value)
          : [];

        if (!values.length) {
          continue;
        }

        const tagId = this.resolveItemTagId(file, registry.namespace);
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

  private resolveItemTagId(file: File, fallbackNamespace?: string): string {
    const relativePath = this.getFileRelativePath(file);
    const withoutExtension = relativePath.replace(/\.json$/i, '');
    const rawSegments = withoutExtension
      .split(/[\\/]+/)
      .map((segment) => segment.trim())
      .filter((segment) => !!segment);

    if (!rawSegments.length) {
      return '';
    }

    const segments = rawSegments.map((segment) =>
      this.normalizeTagPath(segment),
    );
    const tagsIndex = segments.findIndex((segment) => segment === 'tags');
    const itemsIndex =
      tagsIndex >= 0 && segments[tagsIndex + 1] === 'items'
        ? tagsIndex + 1
        : -1;

    if (itemsIndex > 0) {
      const namespace =
        segments[tagsIndex - 1] || fallbackNamespace || 'minecraft';
      const tagPath = segments.slice(itemsIndex + 1).join('/');
      return this.normalizeTagPath(`${namespace}:${tagPath}`);
    }

    if (segments.length >= 2) {
      const namespace = segments[0] || fallbackNamespace || 'minecraft';
      const tagPath = segments.slice(1).join('/');
      return this.normalizeTagPath(`${namespace}:${tagPath}`);
    }

    const namespace = fallbackNamespace || 'minecraft';
    return this.normalizeTagPath(`${namespace}:${segments[0]}`);
  }

  private getFileRelativePath(file: File): string {
    const candidate = (file as File & { webkitRelativePath?: string })
      .webkitRelativePath;
    return (candidate || file.name).replace(/\\/g, '/');
  }

  private mergeItemTags(
    existingTags: ItemTagModel[],
    newTags: ItemTagModel[],
  ): ItemTagModel[] {
    const mergedById = new Map<string, ItemTagModel>();

    for (const tag of existingTags) {
      const key = this.normalizeTagPath(tag.tagId ?? '');
      if (!key) {
        continue;
      }

      mergedById.set(key, {
        tagId: key,
        values: tag.values ? [...tag.values] : [],
      });
    }

    for (const tag of newTags) {
      const key = this.normalizeTagPath(tag.tagId ?? '');
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

  private mergeItemLangs(
    existingLangs: LangFileModel[],
    newLangs: LangFileModel[],
  ): LangFileModel[] {
    const mergedByLocale = new Map<string, LangFileModel>();

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

  private updateImportSession(
    source: ImportSource,
    changes: Partial<RegistryImportSourceSummary>,
  ): void {
    this.importSession.update((session) => ({
      ...session,
      [source]: {
        ...session[source],
        ...changes,
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  public itemDisplayName(item: ItemModel): string {
    if (item.name?.trim()) {
      return item.name;
    }

    const translationKey = this.resolveItemTranslationKey(item.id);
    if (!translationKey) {
      return 'Item sem nome';
    }

    const selectedLangValues = this.resolvePreferredLangValues();
    const translated = selectedLangValues[translationKey];
    return translated?.trim() || 'Item sem nome';
  }

  private resolvePreferredLangValues(): Record<string, string> {
    const langs = this.itemLangs();
    if (!langs.length) {
      return {};
    }

    const preferredLocales = ['pt_br', 'en_us'];
    for (const locale of preferredLocales) {
      const selected = langs.find((lang) => lang.locale === locale);
      if (selected?.values) {
        return selected.values;
      }
    }

    return langs[0]?.values ?? {};
  }

  private resolveItemTranslationKey(itemId?: string): string {
    if (!itemId) {
      return '';
    }

    const normalizedId = itemId.trim().toLowerCase();
    if (!normalizedId) {
      return '';
    }

    if (normalizedId.startsWith('item.')) {
      return normalizedId;
    }

    const [namespace, itemPath] = normalizedId.includes(':')
      ? normalizedId.split(':', 2)
      : [this.registry()?.namespace || 'minecraft', normalizedId];

    const normalizedPath = itemPath?.replace(/\//g, '.');
    return `item.${namespace}.${normalizedPath}`;
  }

  public itemImageSrc(item: ItemModel): string | undefined {
    if (item.iconDataUrl) {
      return item.iconDataUrl;
    }

    const texture = this.findTextureForItem(item);
    if (!texture?.imageBlob) {
      return undefined;
    }

    const cacheKey = this.normalizeKey(texture.itemId ?? texture.itemName);
    const cachedUrl = this.textureObjectUrls.get(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    const objectUrl = URL.createObjectURL(texture.imageBlob);
    this.textureObjectUrls.set(cacheKey, objectUrl);
    return objectUrl;
  }

  public textureSrc(texture: ItemTextureModel): string | undefined {
    if (!texture.imageBlob) {
      return undefined;
    }

    const cacheKey = this.normalizeKey(texture.itemId ?? texture.itemName);
    const cachedUrl = this.textureObjectUrls.get(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    const objectUrl = URL.createObjectURL(texture.imageBlob);
    this.textureObjectUrls.set(cacheKey, objectUrl);
    return objectUrl;
  }

  public pendingTextureSrc(item: TextureImportReviewItem): string | undefined {
    const cachedUrl = this.textureObjectUrls.get(`pending:${item.key}`);
    if (cachedUrl) {
      return cachedUrl;
    }

    const objectUrl = URL.createObjectURL(item.imageBlob);
    this.textureObjectUrls.set(`pending:${item.key}`, objectUrl);
    return objectUrl;
  }

  public existingPendingTextureSrc(
    item: TextureImportReviewItem,
  ): string | undefined {
    if (!item.existingImageBlob) {
      return undefined;
    }

    const cachedUrl = this.textureObjectUrls.get(`existing:${item.key}`);
    if (cachedUrl) {
      return cachedUrl;
    }

    const objectUrl = URL.createObjectURL(item.existingImageBlob);
    this.textureObjectUrls.set(`existing:${item.key}`, objectUrl);
    return objectUrl;
  }

  private findTextureForItem(item: ItemModel): ItemTextureModel | undefined {
    const candidateKeys = [item.id, item.name, item.icon, item.iconId]
      .map((value) => this.normalizeKey(value))
      .filter((value) => !!value);

    return this.itemTextures().find((texture) => {
      const textureKey = this.normalizeKey(texture.itemId ?? texture.itemName);
      return candidateKeys.includes(textureKey);
    });
  }

  private clearTextureUrlCache(): void {
    for (const url of this.textureObjectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.textureObjectUrls.clear();
  }

  private pickRandomTextures(
    textures: ItemTextureModel[],
    quantity: number,
  ): ItemTextureModel[] {
    const shuffled = [...textures].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, quantity);
  }

  private async fileToBlob(file: File): Promise<Blob> {
    const content = await file.arrayBuffer();
    return new Blob([content], { type: file.type });
  }
}
