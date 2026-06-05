import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-upload-item-lang-dialog',
  standalone: true,
  imports: [DialogModule],
  templateUrl: './upload-item-lang-dialog.html',
})
export class UploadItemLangDialogComponent {
  @Input() visible = false;
  @Input() importInProgress = false;
  @Input() importSummary = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() filesSelected = new EventEmitter<File[]>();

  public onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith('.json') || file.type === 'application/json';
    });

    this.filesSelected.emit(files);
    input.value = '';
  }
}
