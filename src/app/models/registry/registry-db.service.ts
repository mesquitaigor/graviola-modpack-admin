import { inject, Injectable } from '@angular/core';
import { IndexedDbService } from '../../shared/services/indexed-db.service';
import type RegistryData from './registry.data';
import { from, Observable, of, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RegistryDbService {
  private readonly dbStoreKey = 'registries';
  private db = inject(IndexedDbService);

  constructor() {
    this.db.registerStore({
      name: this.dbStoreKey,
      options: { keyPath: 'id', autoIncrement: true },
    });
  }

  getAll(): Observable<RegistryData[]> {
    return from(this.db.isStoreRegistered(this.dbStoreKey)).pipe(
      switchMap((isRegistered) => {
        if (!isRegistered) {
          return of([]);
        }
        return from(this.db.getAll<RegistryData>(this.dbStoreKey));
      }),
    );
  }

  getById(id: string): Observable<RegistryData | undefined> {
    return from(this.db.get<RegistryData>(this.dbStoreKey, id));
  }

  add(data: RegistryData): Observable<IDBValidKey> {
    return from(this.db.add<RegistryData>(this.dbStoreKey, data));
  }

  save(data: RegistryData): Observable<IDBValidKey> {
    return from(this.db.put<RegistryData>(this.dbStoreKey, data));
  }

  delete(id: string): Observable<void> {
    return from(this.db.delete(this.dbStoreKey, id));
  }
}
