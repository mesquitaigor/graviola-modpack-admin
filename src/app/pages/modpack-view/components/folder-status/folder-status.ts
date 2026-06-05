import { Component, inject, input, output, OnInit } from '@angular/core';
import { ModpackModel } from '../../../../models/modpack/modpack.model';
import { FileSystemService } from '../../../../core/services/file-system.service';
import { ModpackService } from '../../../../models/modpack/modpack.service';

export type FolderStatus = 'checking' | 'ok' | 'missing' | 'no-handle';

@Component({
  selector: 'app-folder-status',
  templateUrl: './folder-status.html',
})
export class FolderStatusComponent implements OnInit {
  private fileSystem = inject(FileSystemService);
  private modpackService = inject(ModpackService);

  modpack = input.required<ModpackModel>();
  statusChange = output<FolderStatus>();

  status: FolderStatus = 'checking';

  ngOnInit(): void {
    this.check();
  }

  private async check(): Promise<void> {
    const pack = this.modpack();
    if (!pack.directoryHandle) {
      this.setStatus('no-handle');
      return;
    }
    const state = await this.fileSystem.checkPermission(pack.directoryHandle);
    this.setStatus(state === 'granted' ? 'ok' : 'missing');
  }

  async fixFolder(): Promise<void> {
    const pack = this.modpack();

    if (this.status === 'missing') {
      const ok = await this.fileSystem.verifyPermission(pack.directoryHandle!);
      if (ok) {
        this.setStatus('ok');
        return;
      }
    }

    const handle = await this.fileSystem.pickDirectory();
    if (!handle) return;
    await this.modpackService.update(pack.id, { directoryHandle: handle });
    this.setStatus('ok');
  }

  async changeFolder(): Promise<void> {
    const pack = this.modpack();
    const handle = await this.fileSystem.pickDirectory();
    if (!handle) return;
    await this.modpackService.update(pack.id, { directoryHandle: handle });
    this.setStatus('ok');
  }

  private setStatus(status: FolderStatus): void {
    this.status = status;
    this.statusChange.emit(status);
  }
}
