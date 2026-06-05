import { inject, Injectable } from '@angular/core';
import {
  catchError,
  from,
  map,
  mergeMap,
  Observable,
  of,
  switchMap,
  toArray,
  tap,
  BehaviorSubject,
} from 'rxjs';
import { RegistryDbService } from './registry-db.service';
import RegistryMapper from './registry.mapper';
import { MINECRAFT_REGISTRY } from './registry.minecraft';
import RegistryModel from './registry.model';

@Injectable({ providedIn: 'root' })
export class RegistryService {
  private readonly registryDb = inject(RegistryDbService);
  private readonly registries = new BehaviorSubject<RegistryModel[]>([]);
  private loaded = new BehaviorSubject<boolean>(false);

  public readonly registries$ = this.registries.asObservable();
  public readonly loaded$ = this.loaded.asObservable();

  constructor() {
    this.loadAll().subscribe(() => {
      console.log('oi');
    });
  }

  public getRegistries(): RegistryModel[] {
    return this.registries.getValue();
  }

  public loadPredfinedRegistries(): void {
    const allRegistries = this.registries.getValue();
    console.log(allRegistries);
    const minecraftRegistered = allRegistries.find((registry) => {
      console.log(registry);
      return registry.namespace === 'minecraft';
    });

    if (minecraftRegistered) {
      return;
    }

    const minecraftRegistryModel = RegistryMapper.toModel(MINECRAFT_REGISTRY);

    this.loadEmbeddedIcons(minecraftRegistryModel)
      .pipe(
        switchMap((minecraftRegistry) => this.add(minecraftRegistry)),
        catchError((err): Observable<void> => {
          console.log(err);
          return of(void 0);
        }),
      )
      .subscribe();
  }

  private loadAll(): Observable<void> {
    return this.registryDb.getAll().pipe(
      map((registriesData) =>
        registriesData.map((data) => RegistryMapper.toModel(data)),
      ),
      tap((registries) => {
        this.registries.next(registries);
        this.loaded.next(true);
      }),
      map(() => void 0),
    );
  }

  reload(): Observable<void> {
    return this.loadAll();
  }

  getById(id: string): RegistryModel | undefined {
    return this.registries.getValue().find((registry) => registry.id === id);
  }

  add(registry: Omit<RegistryModel, 'id'>): Observable<void> {
    const now = new Date();
    const id = crypto.randomUUID();
    const modId = registry.namespace
      ? registry.namespace.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : crypto.randomUUID();
    const data = RegistryMapper.toData({
      ...registry,
      id,
      modId: registry.modId ?? modId,
      createdAt: registry.createdAt ?? now,
    } as RegistryModel);
    return this.registryDb.add(data).pipe(switchMap(() => this.loadAll()));
  }

  update(
    id: string,
    changes: Partial<Omit<RegistryModel, 'id'>>,
  ): Observable<void> {
    const { id: _, ...changesData } = RegistryMapper.toData(
      changes as RegistryModel,
    );
    const existing = this.getById(id);

    if (!existing) {
      return of(void 0);
    }

    return this.registryDb
      .save({
        ...RegistryMapper.toData(existing),
        ...changesData,
        updatedAt: new Date().toISOString(),
      })
      .pipe(
        tap(() => {
          this.registries.next(
            this.registries
              .getValue()
              .map((registry) =>
                registry.id === id
                  ? { ...registry, ...changes, updatedAt: new Date() }
                  : registry,
              ),
          );
        }),
        map(() => void 0),
      );
  }

  remove(id: string): Observable<void> {
    return this.registryDb.delete(id).pipe(
      tap(() => {
        this.registries.next(
          this.registries.getValue().filter((registry) => registry.id !== id),
        );
      }),
      map(() => void 0),
    );
  }

  private loadEmbeddedIcons(
    registry: RegistryModel,
  ): Observable<Omit<RegistryModel, 'id'>> {
    return from(registry.items ?? []).pipe(
      mergeMap((item) => from(item.loadEmbeddedIcon()).pipe(map(() => item))),
      toArray(),
      map((items) => ({
        ...registry,
        items,
      })),
    );
  }
}
