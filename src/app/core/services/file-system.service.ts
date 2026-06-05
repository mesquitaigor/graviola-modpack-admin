import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  async listDirectoryEntries(
    dir: FileSystemDirectoryHandle,
    ...path: string[]
  ): Promise<Array<{ name: string; kind: FileSystemHandleKind }> | null> {
    try {
      let current: FileSystemDirectoryHandle = dir;
      for (const segment of path) {
        current = await current.getDirectoryHandle(segment);
      }

      const entries: Array<{ name: string; kind: FileSystemHandleKind }> = [];
      for await (const [name, handle] of current.entries()) {
        entries.push({ name, kind: handle.kind });
      }

      return entries.sort((left, right) => {
        if (left.kind !== right.kind) {
          return left.kind === 'directory' ? -1 : 1;
        }
        return left.name.localeCompare(right.name);
      });
    } catch {
      return null;
    }
  }

  async pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      return await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch {
      // User cancelled or browser denied
      return null;
    }
  }

  async checkPermission(
    handle: FileSystemDirectoryHandle,
    mode: FileSystemPermissionMode = 'readwrite',
  ): Promise<PermissionState> {
    return handle.queryPermission({ mode });
  }

  async verifyPermission(
    handle: FileSystemDirectoryHandle,
    mode: FileSystemPermissionMode = 'readwrite',
  ): Promise<boolean> {
    const status = await handle.queryPermission({ mode });
    if (status === 'granted') return true;
    const requested = await handle.requestPermission({ mode });
    return requested === 'granted';
  }

  async readTextFile(
    dir: FileSystemDirectoryHandle,
    ...path: string[]
  ): Promise<string | null> {
    try {
      let current: FileSystemDirectoryHandle = dir;
      for (const segment of path.slice(0, -1)) {
        current = await current.getDirectoryHandle(segment);
      }
      const filename = path[path.length - 1];
      if (filename === undefined) return null;
      const fileHandle = await current.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch {
      return null;
    }
  }
}
