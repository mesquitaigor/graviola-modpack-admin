import { Injectable, inject, signal } from '@angular/core';
import type { ModpackModel } from './modpack.model';
import { ModpackDbService } from './modpack-db.service';

@Injectable({ providedIn: 'root' })
export class ModpackService {
  private readonly modpackDb = inject(ModpackDbService);

  private modpacks = signal<ModpackModel[]>([]);
  private loaded = signal(false);
  public readonly modpacks$ = this.modpacks.asReadonly();
  public readonly loaded$ = this.loaded.asReadonly();

  constructor() {
    this.loadAll();
  }

  private async loadAll(): Promise<void> {
    const modpacks = await this.modpackDb.getAll();
    this.modpacks.set(modpacks);
    this.loaded.set(true);
  }

  getById(id: number): ModpackModel | undefined {
    return this.modpacks().find((p) => p.id === id);
  }

  async add(modpack: Omit<ModpackModel, 'id'>): Promise<void> {
    await this.modpackDb.add(modpack);
    await this.loadAll();
  }

  async update(
    id: number,
    changes: Partial<Omit<ModpackModel, 'id'>>,
  ): Promise<void> {
    const existing = this.getById(id);
    if (!existing) return;
    await this.modpackDb.save({ ...existing, ...changes });
    this.modpacks.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  }

  async remove(id: number): Promise<void> {
    await this.modpackDb.delete(id);
    this.modpacks.update((list) => list.filter((p) => p.id !== id));
  }
}
