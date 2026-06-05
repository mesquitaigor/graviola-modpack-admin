import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-upload-textures-dialog',
  standalone: true,
  imports: [DialogModule],
  templateUrl: './upload-textures-dialog.html',
})
export class UploadTexturesDialogComponent {
  @Input() visible = false;
  @Input() uploadInProgress = false;
  @Input() uploadSummary = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() filesSelected = new EventEmitter<File[]>();

  public onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((file) => {
      if (file.type.startsWith('image/')) {
        return true;
      }

      const name = file.name.toLowerCase();
      return /(\.png|\.jpg|\.jpeg|\.webp|\.gif|\.bmp|\.tga)$/.test(name);
    });

    this.filesSelected.emit(files);
    input.value = '';
  }
}
