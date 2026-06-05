import { inject, Injectable } from '@angular/core';
import { IndexedDbService } from '../../shared/services/indexed-db.service';
import RegistryData from './registry.data';
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

  getById(id: number): Observable<RegistryData | undefined> {
    return from(this.db.get<RegistryData>(this.dbStoreKey, id));
  }

  add(data: Omit<RegistryData, 'id'>): Observable<IDBValidKey> {
    if ('id' in data) {
      delete data.id;
    }
    return from(this.db.add<Omit<RegistryData, 'id'>>(this.dbStoreKey, data));
  }

  save(data: RegistryData): Observable<IDBValidKey> {
    return from(this.db.put<RegistryData>(this.dbStoreKey, data));
  }

  delete(id: number): Observable<void> {
    return from(this.db.delete(this.dbStoreKey, id));
  }
}
