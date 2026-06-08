import { Component, inject, signal } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { firstValueFrom } from 'rxjs';
import { MINECRAFT_VERSIONS } from '../../../../models/modpack/minecraft-versions';
import { DIALOG_DATA, DialogRef } from '../../../../core/services/dialog.model';
import { RegistryService } from '../../../../models/registry/registry.service';
import type { VersionModel } from '../../../../models/version/version.model';

export interface AddVersionDialogData {
  registryId: string;
  versions: Signal<VersionModel[]>;
  selectedVersionIndex: WritableSignal<number>;
}

@Component({
  selector: 'app-add-version-dialog',
  templateUrl: './add-version-dialog.html',
  imports: [ButtonModule, InputTextModule, SelectModule, FormsModule],
})
export class AddVersionDialogComponent {
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  private readonly data = inject<AddVersionDialogData>(DIALOG_DATA);
  private readonly registryService = inject(RegistryService);

  protected readonly minecraftVersions = MINECRAFT_VERSIONS;
  protected readonly submitting = signal(false);

  protected value = '';
  protected mcVersion = MINECRAFT_VERSIONS.find((v) => !v.disabled)?.value ?? '';

  protected async submit(): Promise<void> {
    if (!this.value.trim() || !this.mcVersion.trim() || this.submitting()) return;

    this.submitting.set(true);
    try {
      const current = this.data.versions();
      await firstValueFrom(
        this.registryService.update(this.data.registryId, {
          versions: [
            ...current,
            { value: this.value.trim(), mcVersion: this.mcVersion.trim(), items: [] },
          ],
        }),
      );
      this.data.selectedVersionIndex.set(current.length);
      this.dialogRef.close();
    } finally {
      this.submitting.set(false);
    }
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
