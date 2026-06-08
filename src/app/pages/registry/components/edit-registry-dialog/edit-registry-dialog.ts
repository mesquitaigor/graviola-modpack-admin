import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { firstValueFrom } from 'rxjs';
import { DIALOG_DATA, DialogRef } from '../../../../core/services/dialog.model';
import { RegistryService } from '../../../../models/registry/registry.service';

export interface EditRegistryDialogData {
  registryId: string;
  name: string;
  namespace: string;
}

@Component({
  selector: 'app-edit-registry-dialog',
  templateUrl: './edit-registry-dialog.html',
  imports: [ButtonModule, InputTextModule, FormsModule],
})
export class EditRegistryDialogComponent {
  private readonly data = inject<EditRegistryDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  private readonly registryService = inject(RegistryService);

  protected readonly submitting = signal(false);

  protected name = this.data.name;
  protected namespace = this.data.namespace;

  protected async submit(): Promise<void> {
    if (!this.name.trim() || this.submitting()) return;

    this.submitting.set(true);
    try {
      await firstValueFrom(
        this.registryService.update(this.data.registryId, {
          name: this.name.trim(),
          namespace: this.namespace.trim(),
        }),
      );
      this.dialogRef.close();
    } finally {
      this.submitting.set(false);
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
