import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { DIALOG_DATA, DialogRef } from '../../../../core/services/dialog.model';
import { RegistryService } from '../../../../models/registry/registry.service';
import { collectFilesFromEntry, isJsonFile } from '../../helpers/file.helper';
import { normalizeTagPath } from '../../helpers/text-normalize.helper';
import { mergeItemTags, parseItemTags } from '../../helpers/item-tag-import.helper';

export interface UploadItemTagsDialogData {
  registryId: string;
}

interface TagReviewItem {
  tagId: string;
  values: string[];
  alreadyExists: boolean;
  removed: boolean;
}

@Component({
  selector: 'app-upload-item-tags-dialog',
  templateUrl: './upload-item-tags-dialog.html',
  imports: [],
})
export class UploadItemTagsDialogComponent {
  private readonly dialogRef = inject<DialogRef>(DialogRef);
  private readonly data = inject<UploadItemTagsDialogData>(DIALOG_DATA);
  private readonly registryService = inject(RegistryService);
  private readonly registries = toSignal(this.registryService.registries$, { initialValue: [] });
  private readonly registry = computed(() =>
    this.registries().find((r) => r.id === this.data.registryId),
  );

  @ViewChild('fileInput') private readonly fileInputRef!: ElementRef<HTMLInputElement>;

  protected readonly step = signal<'upload' | 'review'>('upload');
  protected readonly isDragOver = signal(false);
  protected readonly removedTagIds = signal<Set<string>>(new Set());
  protected readonly rawItems = signal<Omit<TagReviewItem, 'removed'>[]>([]);
  protected readonly displayItems = computed<TagReviewItem[]>(() => {
    const removed = this.removedTagIds();
    return this.rawItems().map((item) => ({ ...item, removed: removed.has(item.tagId) }));
  });

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    const container = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as Node | null;
    if (!container.contains(relatedTarget)) {
      this.isDragOver.set(false);
    }
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDragOver.set(false);

    const items = Array.from(event.dataTransfer?.items ?? []);
    const entries = items
      .map((item) => item.webkitGetAsEntry())
      .filter((entry): entry is FileSystemEntry => entry !== null);

    const allFiles = (await Promise.all(entries.map(collectFilesFromEntry))).flat();
    const jsonFiles = allFiles.filter(isJsonFile);

    await this.processFiles(jsonFiles);
  }

  protected async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((f) => isJsonFile(f));
    input.value = '';
    await this.processFiles(files);
  }

  protected openFilePicker(): void {
    this.fileInputRef.nativeElement.click();
  }

  private async processFiles(files: File[]): Promise<void> {
    if (!files.length) return;

    const currentRegistry = this.registry();
    if (!currentRegistry) return;

    const parsedTags = await parseItemTags(files, currentRegistry.namespace);
    if (!parsedTags.length) return;

    const existingTagIds = new Set(
      (currentRegistry.itemTags ?? [])
        .map((tag) => normalizeTagPath(tag.tagId ?? ''))
        .filter(Boolean),
    );

    this.rawItems.set(
      parsedTags.map((tag) => ({
        tagId: tag.tagId ?? '',
        values: tag.values ?? [],
        alreadyExists: existingTagIds.has(normalizeTagPath(tag.tagId ?? '')),
      })),
    );
    this.removedTagIds.set(new Set());
    this.step.set('review');
  }

  protected toggleItem(tagId: string): void {
    this.removedTagIds.update((current) => {
      const next = new Set(current);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  protected async confirm(): Promise<void> {
    const currentRegistry = this.registry();
    if (!currentRegistry?.id) return;

    const removed = this.removedTagIds();
    const itemsToImport = this.rawItems().filter((item) => !removed.has(item.tagId));

    if (itemsToImport.length) {
      const newTags = itemsToImport.map((item) => ({
        tagId: item.tagId,
        values: [...item.values],
      }));
      const mergedItemTags = mergeItemTags(currentRegistry.itemTags ?? [], newTags);
      await firstValueFrom(
        this.registryService.update(currentRegistry.id, { itemTags: mergedItemTags }),
      );
    }

    this.dialogRef.close();
  }

  protected back(): void {
    this.step.set('upload');
    this.rawItems.set([]);
    this.removedTagIds.set(new Set());
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
