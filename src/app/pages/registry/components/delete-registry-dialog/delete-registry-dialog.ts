import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { firstValueFrom } from 'rxjs';
import { DIALOG_DATA, DialogRef } from '../../../../core/services/dialog.model';
import { RegistryService } from '../../../../models/registry/registry.service';

export interface DeleteRegistryDialogData {
  registryId: string;
  registryName: string;
}

@Component({
  selector: 'app-delete-registry-dialog',
  templateUrl: './delete-registry-dialog.html',
  imports: [ButtonModule],
})
export class DeleteRegistryDialogComponent {
  private readonly data = inject<DeleteRegistryDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  private readonly registryService = inject(RegistryService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly registryName = this.data.registryName;

  protected async confirm(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    try {
      await firstValueFrom(this.registryService.remove(this.data.registryId));
      this.dialogRef.close(true);
      this.router.navigate(['/']);
    } catch {
      this.dialogRef.close(false);
    } finally {
      this.submitting.set(false);
    }
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
