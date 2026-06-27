import { Injectable, inject, signal } from '@angular/core';
import { FileSystemService } from '../../core/services/file-system.service';
import type { ModpackModel } from './modpack.model';
import { ModpackDbService } from './modpack-db.service';

@Injectable({ providedIn: 'root' })
export class ModpackService {
  private readonly modpackDb = inject(ModpackDbService);
  private readonly fileSystem = inject(FileSystemService);

  private modpacks = signal<ModpackModel[]>([]);
  private loaded = signal(false);
  public readonly modpacks$ = this.modpacks.asReadonly();
  public readonly loaded$ = this.loaded.asReadonly();

  constructor() {
    this.loadAll();
  }

  private async loadAll(): Promise<void> {
    const modpacks = await this.modpackDb.getAll();
    const restored = await Promise.all(
      modpacks.map(async (modpack) => this.restoreDirectoryAccess(modpack)),
    );
    this.modpacks.set(restored);
    this.loaded.set(true);
  }

  private async restoreDirectoryAccess(
    modpack: ModpackModel,
  ): Promise<ModpackModel> {
    if (!modpack.directoryHandle) {
      return modpack;
    }

    await this.fileSystem.verifyPermission(modpack.directoryHandle);
    return modpack;
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
