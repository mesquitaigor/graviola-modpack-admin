import { Injectable, inject } from '@angular/core';
import { IndexedDbService } from '../../shared/services/indexed-db.service';
import type { ModpackModel } from './modpack.model';
import { ModpackDirectoryHandleDbService } from './modpack-directory-handle-db.service';

type ModpackRecord = Omit<ModpackModel, 'directoryHandle'> & {
  directoryHandle?: FileSystemDirectoryHandle;
};

@Injectable({ providedIn: 'root' })
export class ModpackDbService {
  private readonly dbStoreKey = 'modpacks';
  private readonly db = inject(IndexedDbService);
  private readonly directoryHandleDb = inject(ModpackDirectoryHandleDbService);

  constructor() {
    this.db.registerStore({
      name: this.dbStoreKey,
      options: { keyPath: 'id', autoIncrement: true },
    });
    this.db.registerStore({
      name: 'modpack-directory-handles',
      options: { keyPath: 'modpackId' },
    });
  }

  async getAll(): Promise<ModpackModel[]> {
    if (!(await this.db.isStoreRegistered(this.dbStoreKey))) {
      return Promise.resolve([]);
    }

    const records = await this.db.getAll<ModpackRecord>(this.dbStoreKey);
    return Promise.all(records.map((record) => this.hydrate(record)));
  }

  async getById(id: number): Promise<ModpackModel | undefined> {
    const record = await this.db.get<ModpackRecord>(this.dbStoreKey, id);
    if (!record) return undefined;
    return this.hydrate(record);
  }

  async add(modpack: Omit<ModpackModel, 'id'>): Promise<IDBValidKey> {
    const { directoryHandle, ...record } = modpack;
    const id = await this.db.add<Omit<ModpackRecord, 'id'>>(this.dbStoreKey, {
      ...record,
      directoryName: directoryHandle?.name ?? record.directoryName,
    });

    if (directoryHandle && typeof id === 'number') {
      await this.directoryHandleDb.save(id, directoryHandle);
    }

    return id;
  }

  async save(modpack: ModpackModel): Promise<IDBValidKey> {
    const { directoryHandle, ...record } = modpack;

    if (directoryHandle) {
      await this.directoryHandleDb.save(modpack.id, directoryHandle);
    }

    return this.db.put<ModpackRecord>(this.dbStoreKey, {
      ...record,
      directoryName: directoryHandle?.name ?? record.directoryName,
    });
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(this.dbStoreKey, id);
    await this.directoryHandleDb.delete(id);
  }

  private async hydrate(record: ModpackRecord): Promise<ModpackModel> {
    let directoryHandle = await this.directoryHandleDb.get(record.id);

    if (!directoryHandle && isDirectoryHandle(record.directoryHandle)) {
      directoryHandle = record.directoryHandle;
      await this.directoryHandleDb.save(record.id, directoryHandle);
    }

    const { directoryHandle: _legacyHandle, ...rest } = record;

    return {
      ...rest,
      directoryHandle,
      directoryName:
        rest.directoryName ?? directoryHandle?.name ?? _legacyHandle?.name,
    };
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
