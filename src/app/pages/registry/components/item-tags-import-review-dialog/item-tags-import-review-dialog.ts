import { Component, computed, effect, input, output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export interface ItemTagImportReviewItem {
  tagId: string;
  values: string[];
  alreadyExists: boolean;
}

export interface ItemTagImportReviewView extends ItemTagImportReviewItem {
  removed: boolean;
}

@Component({
  selector: 'app-item-tags-import-review-dialog',
  templateUrl: './item-tags-import-review-dialog.html',
  imports: [DialogModule, ButtonModule],
})
export class ItemTagsImportReviewDialogComponent {
  public visible = input(false);
  public items = input<ItemTagImportReviewItem[]>([]);
  public importInProgress = input(false);

  public visibleChange = output<boolean>();
  public confirmImport = output<ItemTagImportReviewItem[]>();
  public cancelImport = output<void>();

  protected readonly removedTagIds = signal<Set<string>>(new Set());
  protected readonly displayItems = computed<ItemTagImportReviewView[]>(() => {
    const removedTagIds = this.removedTagIds();
    return this.items().map((item) => ({ ...item, removed: removedTagIds.has(item.tagId) }));
  });

  constructor() {
    effect(() => {
      this.items();
      this.removedTagIds.set(new Set());
    });
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

  protected confirm(): void {
    const removedTagIds = this.removedTagIds();
    const itemsToImport = this.items().filter((item) => !removedTagIds.has(item.tagId));
    this.confirmImport.emit(itemsToImport);
  }

  protected cancel(): void {
    this.cancelImport.emit();
  }
}
