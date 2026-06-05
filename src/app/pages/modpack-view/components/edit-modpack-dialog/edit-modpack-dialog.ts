import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ModpackService } from '../../../../models/modpack/modpack.service';
import { MINECRAFT_VERSIONS } from '../../../../models/modpack/minecraft-versions';

@Component({
  selector: 'app-edit-modpack-dialog',
  templateUrl: './edit-modpack-dialog.html',
  imports: [
    DialogModule,
    InputTextModule,
    SelectModule,
    ButtonModule,
    FormsModule,
  ],
})
export class EditModpackDialogComponent {
  private modpackService = inject(ModpackService);

  modpackId = input.required<number>();

  readonly minecraftVersions = MINECRAFT_VERSIONS;

  visible = false;
  saving = false;
  name = '';
  version = '';

  open(): void {
    const pack = this.modpackService.getById(this.modpackId());
    if (!pack) return;
    this.name = pack.name;
    this.version = pack.version;
    this.visible = true;
  }

  async save(): Promise<void> {
    if (!this.name.trim() || !this.version.trim()) return;
    this.saving = true;
    await this.modpackService.update(this.modpackId(), {
      name: this.name.trim(),
      version: this.version.trim(),
      icon: this.name.trim().charAt(0).toUpperCase(),
    });
    this.saving = false;
    this.visible = false;
  }
}
