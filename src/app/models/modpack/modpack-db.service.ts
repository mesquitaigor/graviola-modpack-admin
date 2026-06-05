import { Injectable, inject } from '@angular/core';
import { IndexedDbService } from '../../shared/services/indexed-db.service';
import type { ModpackModel } from './modpack.model';

@Injectable({ providedIn: 'root' })
export class ModpackDbService {
  private readonly dbStoreKey = 'modpacks';
  private db = inject(IndexedDbService);

  constructor() {
    this.db.registerStore({
      name: this.dbStoreKey,
      options: { keyPath: 'id', autoIncrement: true },
    });
  }

  async getAll(): Promise<ModpackModel[]> {
    if (!(await this.db.isStoreRegistered(this.dbStoreKey))) {
      return Promise.resolve([]);
    }
    return this.db.getAll<ModpackModel>(this.dbStoreKey);
  }

  getById(id: number): Promise<ModpackModel | undefined> {
    return this.db.get<ModpackModel>(this.dbStoreKey, id);
  }

  add(modpack: Omit<ModpackModel, 'id'>): Promise<IDBValidKey> {
    return this.db.add<Omit<ModpackModel, 'id'>>(this.dbStoreKey, modpack);
  }

  save(modpack: ModpackModel): Promise<IDBValidKey> {
    return this.db.put<ModpackModel>(this.dbStoreKey, modpack);
  }

  delete(id: number): Promise<void> {
    return this.db.delete(this.dbStoreKey, id);
  }
}
