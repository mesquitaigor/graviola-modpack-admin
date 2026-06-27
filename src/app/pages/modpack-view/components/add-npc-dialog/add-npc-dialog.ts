import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FileSystemService } from '../../../../core/services/file-system.service';

export interface NpcFileEntry {
  saveName: string;
  name: string;
}

type LoadStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'no-saves-folder'
  | 'no-saves'
  | 'missing-directory';

@Component({
  selector: 'app-add-npc-dialog',
  imports: [DialogModule, SelectModule, FormsModule],
  templateUrl: './add-npc-dialog.html',
})
export class AddNpcDialog {
  private readonly fileSystem = inject(FileSystemService);

  public readonly directoryHandle = input<FileSystemDirectoryHandle | undefined>();
  public readonly npcSelected = output<NpcFileEntry>();

  public visible = false;
  public readonly loadStatus = signal<LoadStatus>('idle');
  public readonly saves = signal<string[]>([]);
  public readonly selectedSave = signal<string | null>(null);
  public readonly npcFiles = signal<NpcFileEntry[]>([]);
  public readonly filesStatus = signal<'idle' | 'loading' | 'ready' | 'no-folder' | 'empty'>(
    'idle',
  );

  public open(): void {
    this.visible = true;
  }

  public selectNpc(file: NpcFileEntry): void {
    this.npcSelected.emit(file);
    this.visible = false;
  }

  public async loadSaves(): Promise<void> {
    const handle = this.directoryHandle();
    if (!handle) {
      this.loadStatus.set('missing-directory');
      this.saves.set([]);
      this.selectedSave.set(null);
      this.npcFiles.set([]);
      return;
    }

    this.loadStatus.set('loading');
    this.filesStatus.set('idle');
    this.npcFiles.set([]);

    const entries = await this.fileSystem.listDirectoryEntries(handle, 'saves');
    if (entries === null) {
      this.loadStatus.set('no-saves-folder');
      this.saves.set([]);
      this.selectedSave.set(null);
      return;
    }

    const saveNames = entries
      .filter((entry) => entry.kind === 'directory')
      .map((entry) => entry.name);

    if (!saveNames.length) {
      this.loadStatus.set('no-saves');
      this.saves.set([]);
      this.selectedSave.set(null);
      return;
    }

    this.saves.set(saveNames);
    this.selectedSave.set(saveNames[0] ?? null);
    this.loadStatus.set('ready');
    await this.loadNpcFiles();
  }

  public async onSaveChange(saveName: string): Promise<void> {
    this.selectedSave.set(saveName);
    await this.loadNpcFiles();
  }

  public async loadNpcFiles(): Promise<void> {
    const handle = this.directoryHandle();
    const save = this.selectedSave();
    if (!handle || !save) {
      this.filesStatus.set('idle');
      this.npcFiles.set([]);
      return;
    }

    this.filesStatus.set('loading');

    const entries = await this.fileSystem.listDirectoryEntries(
      handle,
      'saves',
      save,
      'easy_npc',
      'npcs',
    );

    if (entries === null) {
      this.filesStatus.set('no-folder');
      this.npcFiles.set([]);
      return;
    }

    const files = entries
      .filter((entry) => entry.kind === 'file')
      .map((entry) => ({ saveName: save, name: entry.name }));

    this.npcFiles.set(files);
    this.filesStatus.set(files.length ? 'ready' : 'empty');
  }
}
