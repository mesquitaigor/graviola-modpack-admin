import { inject, Injectable, signal } from '@angular/core';
import { DatapackDbService } from './datapack-db.service';
import DatapackModel from './datapack.model';

@Injectable({ providedIn: 'root' })
export class DatapackService {
  private readonly datapackDb = inject(DatapackDbService);
  private datapacks = signal<DatapackModel[]>([]);
  private loaded = signal(false);
  public readonly datapacks$ = this.datapacks.asReadonly();
  public readonly loaded$ = this.loaded.asReadonly();
  constructor() {
    this.loadAll();
  }

  private async loadAll(): Promise<void> {
    const datapacks = await this.datapackDb.getAll();
    this.datapacks.set(datapacks);
    this.loaded.set(true);
  }

  async reload(): Promise<void> {
    await this.loadAll();
  }

  getById(id: number): DatapackModel | undefined {
    return this.datapacks().find((p) => p.id === id);
  }

  async add(datapack: Omit<DatapackModel, 'id'>): Promise<void> {
    await this.datapackDb.add(datapack);
    await this.loadAll();
  }

  async update(
    id: number,
    changes: Partial<Omit<DatapackModel, 'id'>>,
  ): Promise<void> {
    const existing = this.getById(id);
    if (!existing) return;
    await this.datapackDb.save({ ...existing, ...changes });
    this.datapacks.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  }

  async remove(id: number): Promise<void> {
    await this.datapackDb.delete(id);
    this.datapacks.update((list) => list.filter((p) => p.id !== id));
  }
}
