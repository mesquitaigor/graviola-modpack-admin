import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { firstValueFrom } from 'rxjs';
import { DIALOG_DATA, DialogRef } from '../../../../core/services/dialog.model';
import { RegistryService } from '../../../../models/registry/registry.service';
import type { VersionModel } from '../../../../models/version/version.model';
import type { Signal, WritableSignal } from '@angular/core';

export interface DeleteVersionDialogData {
  registryId: string;
  version: VersionModel;
  index: number;
  versions: Signal<VersionModel[]>;
  selectedVersionIndex: WritableSignal<number>;
}

@Component({
  selector: 'app-delete-version-dialog',
  templateUrl: './delete-version-dialog.html',
  imports: [ButtonModule],
})
export class DeleteVersionDialogComponent {
  private readonly data = inject<DeleteVersionDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  private readonly registryService = inject(RegistryService);

  protected readonly submitting = signal(false);
  protected readonly versionValue = this.data.version.value ?? '';
  protected readonly mcVersion = this.data.version.mcVersion ?? '';

  protected async confirm(): Promise<void> {
    if (this.submitting()) return;
    this.submitting.set(true);
    try {
      const updatedVersions = this.data.versions().filter((_, i) => i !== this.data.index);
      await firstValueFrom(
        this.registryService.update(this.data.registryId, { versions: updatedVersions }),
      );
      this.data.selectedVersionIndex.set(
        Math.min(this.data.index, Math.max(0, updatedVersions.length - 1)),
      );
      this.dialogRef.close(true);
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
