import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogRef } from '../../../../core/services/dialog.model';

@Component({
  selector: 'app-upload-version-lang-dialog',
  templateUrl: './upload-version-lang-dialog.html',
  imports: [ButtonModule],
})
export class UploadVersionLangDialogComponent {
  private readonly dialogRef = inject<DialogRef<File[]>>(DialogRef);

  protected readonly files = signal<File[]>([]);

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith('.json') || file.type === 'application/json';
    });

    this.files.set(files);
  }

  protected submit(): void {
    if (!this.files().length) return;
    this.dialogRef.close(this.files());
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
