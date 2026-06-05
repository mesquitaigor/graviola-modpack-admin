import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

export interface TextureImportReviewItem {
  key: string;
  fileName: string;
  itemName: string;
  imageBlob: Blob;
  hasConflict: boolean;
  replaceConfirmed: boolean;
  existingItemName?: string;
  existingImageBlob?: Blob;
}

@Component({
  selector: 'app-textures-import-review-dialog',
  standalone: true,
  imports: [DialogModule],
  templateUrl: './textures-import-review-dialog.html',
})
export class TexturesImportReviewDialogComponent {
  @Input() visible = false;
  @Input() items: TextureImportReviewItem[] = [];
  @Input() importInProgress = false;
  @Input() previewSrc: (item: TextureImportReviewItem) => string | undefined =
    () => undefined;
  @Input()
  existingPreviewSrc: (item: TextureImportReviewItem) => string | undefined =
    () => undefined;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmImport = new EventEmitter<void>();
  @Output() cancelImport = new EventEmitter<void>();
  @Output() confirmReplace = new EventEmitter<string>();
  @Output() confirmAllReplacements = new EventEmitter<void>();

  public pendingConflictCount(): number {
    return this.items.filter(
      (item) => item.hasConflict && !item.replaceConfirmed,
    ).length;
  }
}
