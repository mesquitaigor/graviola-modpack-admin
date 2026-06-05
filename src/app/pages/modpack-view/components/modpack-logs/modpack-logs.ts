import {
  Component,
  inject,
  input,
  effect,
  untracked,
  type OnDestroy,
} from '@angular/core';
import { FileSystemService } from '../../../../core/services/file-system.service';
import type { FolderStatus } from '../folder-status/folder-status';

@Component({
  selector: 'app-modpack-logs',
  templateUrl: './modpack-logs.html',
})
export class ModpackLogsComponent implements OnDestroy {
  private fileSystem = inject(FileSystemService);

  directoryHandle = input<FileSystemDirectoryHandle | undefined>(undefined);
  folderStatus = input<FolderStatus>('checking');

  logLines: string[] = [];
  logStatus: 'idle' | 'watching' | 'file-not-found' = 'idle';
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const status = this.folderStatus();
      untracked(() => {
        if (status !== 'ok') {
          this.stop();
        }
      });
    });
  }

  start(): void {
    const handle = this.directoryHandle();
    if (!handle || this.pollInterval) return;
    this.logStatus = 'watching';
    const poll = async () => {
      const content = await this.fileSystem.readTextFile(
        handle,
        'logs',
        'latest.log',
      );
      if (content === null) {
        this.logStatus = 'file-not-found';
        return;
      }
      this.logLines = content.split('\n').filter((l) => l.trim());
    };
    poll();
    this.pollInterval = setInterval(poll, 1000);
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.logStatus = 'idle';
    this.logLines = [];
  }

  getLineClass(line: string): string {
    if (/\[ERROR\]|\bERROR\b/.test(line)) return 'text-red-400';
    if (/\[WARN\]|\bWARN\b/.test(line)) return 'text-yellow-400';
    if (/\[INFO\]|\bINFO\b/.test(line)) return 'text-slate-300';
    return 'text-slate-500';
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
