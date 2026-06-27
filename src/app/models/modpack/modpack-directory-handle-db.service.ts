import { Injectable, inject } from '@angular/core';
import { IndexedDbService } from '../../shared/services/indexed-db.service';

interface ModpackDirectoryHandleRecord {
  modpackId: number;
  handle: FileSystemDirectoryHandle;
}

@Injectable({ providedIn: 'root' })
export class ModpackDirectoryHandleDbService {
  private readonly dbStoreKey = 'modpack-directory-handles';
  private readonly db = inject(IndexedDbService);

  constructor() {
    this.db.registerStore({
      name: this.dbStoreKey,
      options: { keyPath: 'modpackId' },
    });
  }

  async get(modpackId: number): Promise<FileSystemDirectoryHandle | undefined> {
    const record = await this.db.get<ModpackDirectoryHandleRecord>(
      this.dbStoreKey,
      modpackId,
    );
    return isDirectoryHandle(record?.handle) ? record.handle : undefined;
  }

  async save(
    modpackId: number,
    handle: FileSystemDirectoryHandle,
  ): Promise<void> {
    await this.db.put<ModpackDirectoryHandleRecord>(this.dbStoreKey, {
      modpackId,
      handle,
    });
  }

  async delete(modpackId: number): Promise<void> {
    await this.db.delete(this.dbStoreKey, modpackId);
  }
}

function isDirectoryHandle(
  value: unknown,
): value is FileSystemDirectoryHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    (value as FileSystemHandle).kind === 'directory' &&
    'queryPermission' in value
  );
}
