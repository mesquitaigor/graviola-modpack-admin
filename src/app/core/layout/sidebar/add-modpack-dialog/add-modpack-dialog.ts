import { Component, inject, output, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ModpackService } from '../../../../models/modpack/modpack.service';
import { FileSystemService } from '../../../../core/services/file-system.service';
import { MINECRAFT_VERSIONS } from '../../../../models/modpack/minecraft-versions';

@Component({
  selector: 'app-add-modpack-dialog',
  templateUrl: './add-modpack-dialog.html',
  imports: [
    DialogModule,
    InputTextModule,
    ButtonModule,
    FormsModule,
    SelectModule,
    ReactiveFormsModule,
  ],
})
export class AddModpackDialogComponent {
  private readonly modpackService = inject(ModpackService);
  private readonly fileSystem = inject(FileSystemService);
  private readonly fb = inject(FormBuilder);

  public readonly closed = output<void>();

  public readonly visible = signal(false);
  public readonly saving = signal(false);
  public readonly pickingFolder = signal(false);

  public readonly modpackForm = this.fb.group({
    name: [''],
    version: [''],
    directoryHandle: [null as FileSystemDirectoryHandle | null],
  });
  public readonly minecraftVersions = MINECRAFT_VERSIONS;
  public readonly directoryHandle = signal(
    null as FileSystemDirectoryHandle | null,
  );

  public open(): void {
    this.modpackForm.reset();
    this.visible.set(true);
  }

  public async pickFolder() {
    this.pickingFolder.set(true);
    const directoryHandle = await this.fileSystem.pickDirectory();
    this.modpackForm.get('directoryHandle')?.setValue(directoryHandle);
    this.directoryHandle.set(directoryHandle);
    this.pickingFolder.set(false);

    const minecraftInstanceFileHandle = await directoryHandle?.getFileHandle(
      'minecraftinstance.json',
      {
        create: false,
      },
    );
    const minecraftInstanceFile = await minecraftInstanceFileHandle?.getFile();
    if (minecraftInstanceFile) {
      const jsonText = await minecraftInstanceFile.text();
      const minecraftInstance = JSON.parse(jsonText);
      this.modpackForm.get('version')?.setValue(minecraftInstance.gameVersion);
      this.modpackForm.get('name')?.setValue(minecraftInstance.name);
    }
  }

  public resetDirectory(): void {
    this.modpackForm.get('directoryHandle')?.setValue(null);
    this.directoryHandle.set(null);
    this.modpackForm.reset();
  }

  public async save() {
    if (
      !this.modpackForm.get('name')?.value?.trim() ||
      !this.modpackForm.get('version')?.value?.trim() ||
      !this.directoryHandle
    )
      return;
    this.saving.set(true);
    await this.modpackService.add({
      name: this.modpackForm.get('name')?.value?.trim() || '',
      version: this.modpackForm.get('version')?.value?.trim() || '',
      icon: this.modpackForm.get('name')?.value?.trim()[0]?.toUpperCase() || '',
      directoryHandle: this.directoryHandle()!,
    });
    this.saving.set(false);
    this.visible.set(false);
    this.closed.emit();
  }
}
