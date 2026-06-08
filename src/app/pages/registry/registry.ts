import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import ItemModel from '../../models/item/item.model';
import ItemTagModel from '../../models/item-tag/item-tag.model';
import ItemTextureModel from '../../models/item-texture/item-texture.model';
import { RegistryService } from '../../models/registry/registry.service';
import { UploadItemLangDialogComponent } from './components/upload-item-lang-dialog/upload-item-lang-dialog';
import { UploadItemTagsDialogComponent } from './components/upload-item-tags-dialog/upload-item-tags-dialog';
import {
  type ItemTagImportReviewItem,
  ItemTagsImportReviewDialogComponent,
} from './components/item-tags-import-review-dialog/item-tags-import-review-dialog';
import { UploadTexturesDialogComponent } from './components/upload-textures-dialog/upload-textures-dialog';
import { TexturesGalleryDialogComponent } from './components/textures-gallery-dialog/textures-gallery-dialog';
import {
  type TextureImportReviewItem,
  TexturesImportReviewDialogComponent,
} from './components/textures-import-review-dialog/textures-import-review-dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { MessageService, type MenuItem } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AddItemDialogComponent } from './components/add-item-dialog/add-item-dialog';
import type { ItemAddEvent } from './components/add-item-dialog/add-item-dialog';
import { AddVersionDialogComponent } from './components/add-version-dialog/add-version-dialog';
import type { AddVersionDialogData } from './components/add-version-dialog/add-version-dialog';
import { SelectVersionDialogComponent } from './components/select-version-dialog/select-version-dialog';
import type { SelectVersionDialogData } from './components/select-version-dialog/select-version-dialog';
import { EditRegistryDialogComponent } from './components/edit-registry-dialog/edit-registry-dialog';
import type { EditRegistryDialogData } from './components/edit-registry-dialog/edit-registry-dialog';
import { DeleteVersionDialogComponent } from './components/delete-version-dialog/delete-version-dialog';
import type { DeleteVersionDialogData } from './components/delete-version-dialog/delete-version-dialog';
import { DeleteRegistryDialogComponent } from './components/delete-registry-dialog/delete-registry-dialog';
import type { DeleteRegistryDialogData } from './components/delete-registry-dialog/delete-registry-dialog';
import { UploadVersionLangDialogComponent } from './components/upload-version-lang-dialog/upload-version-lang-dialog';
import { fileBaseName, fileToBlob, isImageFile, isJsonFile } from './helpers/file.helper';
import { normalizeKey, normalizeTagPath } from './helpers/text-normalize.helper';
import { mergeItemTags, parseItemTags } from './helpers/item-tag-import.helper';
import {
  filterLangsByKeyPrefix,
  mergeItemLangs,
  parseItemLangFiles,
} from './helpers/item-lang-import.helper';
import { RegistryDialogsService } from './services/registry-dialogs.service';
import { DialogService } from '../../core/services/dialog.service';

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
    FormsModule,
    ButtonModule,
    InputTextModule,
    MenuModule,
    ToastModule,
    AddItemDialogComponent,
    UploadItemLangDialogComponent,
    UploadItemTagsDialogComponent,
    ItemTagsImportReviewDialogComponent,
    UploadTexturesDialogComponent,
    TexturesGalleryDialogComponent,
    TexturesImportReviewDialogComponent,
  ],
  providers: [MessageService, RegistryDialogsService],
  templateUrl: './registry.html',
})
export class Registry {
  private readonly route = inject(ActivatedRoute);
  private readonly registryService = inject(RegistryService);
  private readonly messageService = inject(MessageService);
  private readonly dialogService = inject(DialogService);
  protected readonly dialogs = inject(RegistryDialogsService);

  private readonly registryId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );
  private readonly registries = toSignal(this.registryService.registries$, {
    initialValue: [],
  });

  public readonly registry = computed(() =>
    this.registries().find((registry) => registry.id === this.registryId()),
  );
  public readonly versions = computed(() => this.registry()?.versions ?? []);
  public readonly selectedVersionIndex = signal(0);
  public readonly selectedVersion = computed(() => this.versions()[this.selectedVersionIndex()]);

  private readonly menuRef = viewChild<Menu>('registryMenu');

  protected readonly menuItems = computed<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.openEditRegistryDialog(),
      },
    ];

    if (this.selectedVersion()) {
      items.push({
        label: 'Deletar versão',
        icon: 'pi pi-trash',
        styleClass: 'text-red-600',
        command: () => this.confirmDeleteVersion(),
      });
    }

    items.push(
      { separator: true },
      {
        label: 'Deletar registro',
        icon: 'pi pi-trash',
        styleClass: 'text-red-600',
        command: () => this.confirmDeleteRegistry(),
      },
    );

    return items;
  });
  public readonly items = computed(() => this.selectedVersion()?.items ?? []);
  public readonly itemLangs = computed(() => this.registry()?.langs ?? []);
  public readonly itemTags = computed(() => this.registry()?.itemTags ?? []);
  public readonly itemIdSuggestions = computed(() => {
    const ids = this.itemTags().flatMap((tag) => tag.values ?? []);
    return [...new Set(ids)].sort();
  });
  public readonly versionLangs = computed(() => this.selectedVersion()?.langs ?? []);
  public readonly itemNameSuggestions = computed(() => {
    const names = this.versionLangs().flatMap((lang) => Object.values(lang.values ?? {}));
    return [...new Set(names)].sort();
  });
  public readonly itemLangEntryCount = computed(() =>
    this.itemLangs().reduce((count, lang) => count + Object.keys(lang.values ?? {}).length, 0),
  );
  public readonly itemTextures = computed(() => this.registry()?.itemTextures ?? []);
  public readonly texturePreview = signal<ItemTextureModel[]>([]);
  public readonly pendingTextureImports = signal<TextureImportReviewItem[]>([]);
  public readonly pendingItemTagImports = signal<ItemTagImportReviewItem[]>([]);
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
  public readonly resolveTextureSrc = (texture: ItemTextureModel) => this.textureSrc(texture);
  public readonly resolvePendingTextureSrc = (item: TextureImportReviewItem) =>
    this.pendingTextureSrc(item);
  public readonly resolveExistingPendingTextureSrc = (item: TextureImportReviewItem) =>
    this.existingPendingTextureSrc(item);

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

  public openSelectVersionDialog(): void {
    const id = this.registry()?.id;
    if (!id) return;
    this.dialogService.open<void, SelectVersionDialogData>(SelectVersionDialogComponent, {
      header: 'Versões do mod',
      width: '26rem',
      data: {
        registryId: id,
        versions: this.versions,
        selectedVersionIndex: this.selectedVersionIndex,
      },
    });
  }

  public openAddVersionDialog(): void {
    const id = this.registry()?.id;
    if (!id) return;
    this.dialogService.open<void, AddVersionDialogData>(AddVersionDialogComponent, {
      header: 'Adicionar versão',
      width: '22rem',
      data: {
        registryId: id,
        versions: this.versions,
        selectedVersionIndex: this.selectedVersionIndex,
      },
    });
  }

  public toggleMenu(event: MouseEvent): void {
    this.menuRef()?.toggle(event);
  }

  public openEditRegistryDialog(): void {
    const currentRegistry = this.registry();
    if (!currentRegistry?.id) return;

    this.dialogService.open<void, EditRegistryDialogData>(EditRegistryDialogComponent, {
      header: 'Editar registro',
      width: '22rem',
      data: {
        registryId: currentRegistry.id,
        name: currentRegistry.name ?? '',
        namespace: currentRegistry.namespace ?? '',
      },
    });
  }

  public confirmDeleteVersion(): void {
    const version = this.selectedVersion();
    const currentRegistry = this.registry();
    if (!version || !currentRegistry?.id) return;

    const ref = this.dialogService.open<boolean, DeleteVersionDialogData>(
      DeleteVersionDialogComponent,
      {
        header: 'Deletar versão',
        width: '22rem',
        data: {
          registryId: currentRegistry.id,
          version,
          index: this.selectedVersionIndex(),
          versions: this.versions,
          selectedVersionIndex: this.selectedVersionIndex,
        },
      },
    );

    ref.closed.subscribe((success) => {
      if (success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Versão deletada',
          detail: `A versão "v${version.value}" foi removida com sucesso.`,
        });
      } else if (success === false) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao deletar versão',
          detail: 'Não foi possível remover a versão. Tente novamente.',
        });
      }
    });
  }

  public confirmDeleteRegistry(): void {
    const currentRegistry = this.registry();
    if (!currentRegistry?.id) return;

    const registryName = currentRegistry.name || 'Registro sem nome';

    const ref = this.dialogService.open<boolean, DeleteRegistryDialogData>(
      DeleteRegistryDialogComponent,
      {
        header: 'Deletar registro',
        width: '22rem',
        data: {
          registryId: currentRegistry.id,
          registryName,
        },
      },
    );

    ref.closed.subscribe((success) => {
      if (success === false) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao deletar registro',
          detail: 'Não foi possível remover o registro. Tente novamente.',
        });
      }
    });
  }

  public async addItem(event: ItemAddEvent): Promise<void> {
    const currentRegistry = this.registry();
    const version = this.selectedVersion();
    if (!currentRegistry?.id || !version) return;

    const index = this.selectedVersionIndex();
    const newItem = new ItemModel();
    newItem.id = event.id;
    newItem.name = event.name;
    newItem.iconDataUrl = event.iconDataUrl;
    const updatedItems = [...(version.items ?? []), newItem];
    const updatedVersions = this.versions().map((v, i) =>
      i === index ? { ...v, items: updatedItems } : v,
    );

    await firstValueFrom(
      this.registryService.update(currentRegistry.id, { versions: updatedVersions }),
    );
    this.dialogs.close('addItem');
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
      const imageFiles = files.filter((file) => isImageFile(file));

      if (!imageFiles.length) {
        this.dialogs.close('uploadTextures');
        this.uploadSummary.set('Nenhuma textura de imagem valida foi encontrada.');
        return;
      }

      const existingTextures = new Map<string, ItemTextureModel>();
      for (const texture of currentRegistry.itemTextures ?? []) {
        const key = normalizeKey(texture.itemId ?? texture.itemName);
        if (key) {
          existingTextures.set(key, texture);
        }
      }

      const reviewItems: TextureImportReviewItem[] = [];

      for (const file of imageFiles) {
        const itemKey = normalizeKey(file.name);
        if (!itemKey) {
          continue;
        }

        const existingTexture = existingTextures.get(itemKey);
        reviewItems.push({
          key: itemKey,
          fileName: file.name,
          itemName: fileBaseName(file.name),
          imageBlob: await fileToBlob(file),
          hasConflict: !!existingTexture,
          replaceConfirmed: !existingTexture,
          existingItemName: existingTexture?.itemName ?? existingTexture?.itemId ?? undefined,
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
      this.dialogs.closeAndOpen('uploadTextures', 'textureImportReview');
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
      this.itemTagsImportSummary.set('Registro nao encontrado para salvar tags.');
      return;
    }

    if (!files.length) {
      this.itemTagsImportSummary.set('Nenhum arquivo JSON selecionado.');
      return;
    }

    this.itemTagsImportInProgress.set(true);

    try {
      const tagFiles = files.filter((file) => isJsonFile(file));
      if (!tagFiles.length) {
        this.itemTagsImportSummary.set('Nenhum arquivo de tag valido foi encontrado.');
        return;
      }

      const parsedTags = await parseItemTags(tagFiles, currentRegistry.namespace);
      if (!parsedTags.length) {
        this.itemTagsImportSummary.set('Nenhuma tag valida foi encontrada nos JSONs.');
        return;
      }

      const existingTagIds = new Set(
        (currentRegistry.itemTags ?? [])
          .map((tag) => normalizeTagPath(tag.tagId ?? ''))
          .filter((tagId) => !!tagId),
      );

      const reviewItems: ItemTagImportReviewItem[] = parsedTags.map((tag) => ({
        tagId: tag.tagId ?? '',
        values: tag.values ?? [],
        alreadyExists: existingTagIds.has(normalizeTagPath(tag.tagId ?? '')),
      }));

      this.pendingItemTagImports.set(reviewItems);
      this.dialogs.closeAndOpen('uploadItemTags', 'itemTagImportReview');
    } catch (e) {
      console.error(e);
      this.itemTagsImportSummary.set('Erro ao importar tags de itens.');
    } finally {
      this.itemTagsImportInProgress.set(false);
    }
  }

  public cancelItemTagImport(): void {
    this.pendingItemTagImports.set([]);
    this.dialogs.close('itemTagImportReview');
  }

  public async confirmItemTagImport(items: ItemTagImportReviewItem[]): Promise<void> {
    const currentRegistry = this.registry();
    if (!currentRegistry?.id) {
      this.itemTagsImportSummary.set('Registro nao encontrado para salvar tags.');
      return;
    }

    if (!items.length) {
      this.cancelItemTagImport();
      return;
    }

    this.itemTagsImportInProgress.set(true);

    try {
      const newTags: ItemTagModel[] = items.map((item) => ({
        tagId: item.tagId,
        values: [...item.values],
      }));

      const mergedItemTags = mergeItemTags(currentRegistry.itemTags ?? [], newTags);

      await firstValueFrom(
        this.registryService.update(currentRegistry.id, {
          itemTags: mergedItemTags,
        }),
      );

      this.pendingItemTagImports.set([]);
      this.dialogs.close('itemTagImportReview');
      this.itemTagsImportSummary.set(
        `${newTags.length} tag(s) de item importada(s) com sucesso.`,
      );
      this.updateImportSession('tags', {
        importedEntries: newTags.length,
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
      this.itemLangImportSummary.set('Registro nao encontrado para salvar lang.');
      return;
    }

    if (!files.length) {
      this.itemLangImportSummary.set('Nenhum arquivo de lang selecionado.');
      return;
    }

    this.itemLangImportInProgress.set(true);

    try {
      const langFiles = files.filter((file) => isJsonFile(file));
      if (!langFiles.length) {
        this.itemLangImportSummary.set('Nenhum arquivo de lang valido foi encontrado.');
        return;
      }

      const parsedLangs = await parseItemLangFiles(langFiles);
      if (!parsedLangs.length) {
        this.itemLangImportSummary.set('Nenhuma traducao valida foi encontrada nos JSONs.');
        return;
      }

      const mergedItemLangs = mergeItemLangs(currentRegistry.langs ?? [], parsedLangs);

      await firstValueFrom(
        this.registryService.update(currentRegistry.id, {
          langs: mergedItemLangs,
        }),
      );

      const importedEntries = parsedLangs.reduce(
        (count, lang) => count + Object.keys(lang.values ?? {}).length,
        0,
      );

      this.dialogs.close('uploadItemLang');
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

  public openUploadVersionLangDialog(): void {
    const ref = this.dialogService.open<File[]>(UploadVersionLangDialogComponent, {
      header: 'Carregar arquivos de lang',
      width: 'min(96vw, 42rem)',
    });

    ref.closed.subscribe((files) => {
      if (files?.length) {
        this.uploadVersionLang(files);
      }
    });
  }

  private async uploadVersionLang(files: File[]): Promise<void> {
    const currentRegistry = this.registry();
    const version = this.selectedVersion();
    const index = this.selectedVersionIndex();

    if (!currentRegistry?.id || !version) return;

    try {
      const langFiles = files.filter((file) => isJsonFile(file));
      const parsedLangs = await parseItemLangFiles(langFiles);
      const itemLangs = filterLangsByKeyPrefix(parsedLangs, 'item.');
      if (!itemLangs.length) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Nenhuma tradução importada',
          detail: 'Nenhuma traducao de item (prefixo "item.") foi encontrada nos JSONs selecionados.',
        });
        return;
      }

      const mergedLangs = mergeItemLangs(version.langs ?? [], itemLangs);
      const updatedVersions = this.versions().map((v, i) =>
        i === index ? { ...v, langs: mergedLangs } : v,
      );

      await firstValueFrom(
        this.registryService.update(currentRegistry.id, { versions: updatedVersions }),
      );

      const importedEntries = itemLangs.reduce(
        (count, lang) => count + Object.keys(lang.values ?? {}).length,
        0,
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Lang importada',
        detail: `${itemLangs.length} locale(s) e ${importedEntries} traducao(oes) de item importada(s) com sucesso.`,
      });
    } catch (e) {
      console.error(e);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro ao importar lang',
        detail: 'Não foi possível importar os arquivos de lang da versão. Tente novamente.',
      });
    }
  }

  public confirmTextureReplacement(key: string): void {
    this.pendingTextureImports.update((items) =>
      items.map((item) => (item.key === key ? { ...item, replaceConfirmed: true } : item)),
    );
  }

  public confirmAllTextureReplacements(): void {
    this.pendingTextureImports.update((items) =>
      items.map((item) => (item.hasConflict ? { ...item, replaceConfirmed: true } : item)),
    );
  }

  public cancelTextureImport(): void {
    this.pendingTextureImports.set([]);
    this.dialogs.close('textureImportReview');
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
        const key = normalizeKey(texture.itemId ?? texture.itemName);
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
      this.dialogs.close('textureImportReview');
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

    const cacheKey = normalizeKey(texture.itemId ?? texture.itemName);
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

    const cacheKey = normalizeKey(texture.itemId ?? texture.itemName);
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

  public existingPendingTextureSrc(item: TextureImportReviewItem): string | undefined {
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
      .map((value) => normalizeKey(value))
      .filter((value) => !!value);

    return this.itemTextures().find((texture) => {
      const textureKey = normalizeKey(texture.itemId ?? texture.itemName);
      return candidateKeys.includes(textureKey);
    });
  }

  private clearTextureUrlCache(): void {
    for (const url of this.textureObjectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.textureObjectUrls.clear();
  }

  private pickRandomTextures(textures: ItemTextureModel[], quantity: number): ItemTextureModel[] {
    const shuffled = [...textures].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, quantity);
  }
}
