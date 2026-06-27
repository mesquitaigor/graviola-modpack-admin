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
  private readonly DB_VERSION = 3;

  private dbPromise: Promise<IDBDatabase> | null = null;
  private openPromise: Promise<IDBDatabase> | null = null;
  private pendingStores: StoreSchema[] = [];
  private reopenRequested = false;
  private currentVersion = this.DB_VERSION;

  /**
   * Registers a store schema before the DB is opened.
   * Must be called in the constructor of domain services.
   */
  registerStore(schema: StoreSchema): void {
    const alreadyRegistered = this.pendingStores.some(
      (store) => store.name === schema.name,
    );
    if (alreadyRegistered) {
      return;
    }

    this.pendingStores.push(schema);
    if (this.dbPromise) {
      this.reopenRequested = true;
    }
  }

  async isStoreRegistered(storeName: string): Promise<boolean> {
    if (this.pendingStores.some((store) => store.name === storeName)) {
      return true;
    }

    if (this.dbPromise) {
      const db = await this.dbPromise;
      return db.objectStoreNames.contains(storeName);
    }

    return false;
  }

  async getDb(): Promise<IDBDatabase> {
    const db = await this.openIfNeeded();
    if (!this.hasAllStores(db)) {
      db.close();
      this.dbPromise = null;
      this.currentVersion = db.version;
      this.reopenRequested = true;
      return this.getDb();
    }
    return db;
  }

  private async openIfNeeded(): Promise<IDBDatabase> {
    if (this.openPromise) {
      return this.openPromise;
    }

    if (this.dbPromise && !this.reopenRequested) {
      return this.dbPromise;
    }

    if (this.dbPromise && this.reopenRequested) {
      const currentDb = await this.dbPromise;
      currentDb.close();
      this.dbPromise = null;
      this.currentVersion = currentDb.version;
    }

    this.openPromise = this.openDatabase();
    try {
      this.dbPromise = this.openPromise;
      return await this.openPromise;
    } finally {
      this.openPromise = null;
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    const stores = [...this.pendingStores];
    const openVersion = Math.max(this.currentVersion, this.DB_VERSION) + 1;
    this.reopenRequested = false;
    this.currentVersion = openVersion;

    return new Promise<IDBDatabase>((resolve, reject) => {
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
  }

  private hasAllStores(db: IDBDatabase): boolean {
    return this.pendingStores.every((store) =>
      db.objectStoreNames.contains(store.name),
    );
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
