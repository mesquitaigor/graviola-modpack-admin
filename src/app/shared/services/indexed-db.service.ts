import { Injectable } from '@angular/core';

export interface StoreSchema {
  name: string;
  options?: IDBObjectStoreParameters;
  indexes?: {
    name: string;
    keyPath: string | string[];
    options?: IDBIndexParameters;
  }[];
}

@Injectable({ providedIn: 'root' })
export class IndexedDbService {
  private readonly DB_NAME = 'graviola-modpack-admin';
  private readonly DB_VERSION = 2;

  private dbPromise: Promise<IDBDatabase> | null = null;
  private pendingStores: StoreSchema[] = [];
  private reopenRequested = false;
  private currentVersion = this.DB_VERSION;

  /**
   * Registers a store schema before the DB is opened.
   * Must be called in the constructor of domain services.
   */
  registerStore(schema: StoreSchema): void {
    this.pendingStores.push(schema);
    if (this.dbPromise) {
      this.reopenRequested = true;
    }
  }

  async isStoreRegistered(storeName: string): Promise<boolean> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      return db.objectStoreNames.contains(storeName);
    }

    if (this.pendingStores.some((store) => store.name === storeName)) {
      return true;
    }

    return false;
  }

  async getDb(): Promise<IDBDatabase> {
    if (this.dbPromise && !this.reopenRequested) {
      return this.dbPromise;
    }

    if (this.dbPromise && this.reopenRequested) {
      const currentDb = await this.dbPromise;
      currentDb.close();
      this.dbPromise = null;
    }

    const stores = [...this.pendingStores];
    const openVersion = this.currentVersion;
    this.reopenRequested = false;
    this.currentVersion += 1;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, openVersion);

      req.onupgradeneeded = ({ target }) => {
        const db = (target as IDBOpenDBRequest).result;
        for (const store of stores) {
          if (!db.objectStoreNames.contains(store.name)) {
            const os = db.createObjectStore(store.name, store.options);
            for (const idx of store.indexes ?? []) {
              os.createIndex(idx.name, idx.keyPath as string, idx.options);
            }
          }
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  private toPromise<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDb();
    return this.toPromise(
      db.transaction(storeName, 'readonly').objectStore(storeName).getAll(),
    );
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.getDb();
    return this.toPromise(
      db.transaction(storeName, 'readonly').objectStore(storeName).get(key),
    );
  }

  async add<T>(storeName: string, value: T): Promise<IDBValidKey> {
    const db = await this.getDb();
    console.log(db);
    return this.toPromise(
      db.transaction(storeName, 'readwrite').objectStore(storeName).add(value),
    );
  }

  async put<T>(storeName: string, value: T): Promise<IDBValidKey> {
    const db = await this.getDb();
    return this.toPromise(
      db.transaction(storeName, 'readwrite').objectStore(storeName).put(value),
    );
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.getDb();
    await this.toPromise(
      db.transaction(storeName, 'readwrite').objectStore(storeName).delete(key),
    );
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.getDb();
    await this.toPromise(
      db.transaction(storeName, 'readwrite').objectStore(storeName).clear(),
    );
  }
}
