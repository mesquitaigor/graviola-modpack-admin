import { Injectable, inject } from '@angular/core';
import { IndexedDbService } from '../../shared/services/indexed-db.service';
import DatapackModel from './datapack.model';

@Injectable({ providedIn: 'root' })
export class DatapackDbService {
  private readonly dbStoreKey = 'datapacks';
  private db = inject(IndexedDbService);

  constructor() {
    this.db.registerStore({
      name: this.dbStoreKey,
      options: { keyPath: 'id', autoIncrement: true },
    });
  }

  async getAll(): Promise<DatapackModel[]> {
    if (!(await this.db.isStoreRegistered(this.dbStoreKey))) {
      return Promise.resolve([]);
    }
    return this.db.getAll<DatapackModel>(this.dbStoreKey);
  }

  getById(id: number): Promise<DatapackModel | undefined> {
    return this.db.get<DatapackModel>(this.dbStoreKey, id);
  }

  add(datapack: Omit<DatapackModel, 'id'>): Promise<IDBValidKey> {
    return this.db.add<Omit<DatapackModel, 'id'>>(this.dbStoreKey, datapack);
  }

  save(datapack: DatapackModel): Promise<IDBValidKey> {
    return this.db.put<DatapackModel>(this.dbStoreKey, datapack);
  }

  delete(id: number): Promise<void> {
    return this.db.delete(this.dbStoreKey, id);
  }
}
