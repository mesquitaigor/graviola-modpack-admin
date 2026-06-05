import { inject, Injectable, signal } from '@angular/core';
import RecipeModel from './recipe.model';
import { RecipeDbService } from './recipe-db.service';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly recipeDb = inject(RecipeDbService);
  private recipes = signal<RecipeModel[]>([]);
  private loaded = signal(false);
  public readonly recipes$ = this.recipes.asReadonly();
  public readonly loaded$ = this.loaded.asReadonly();
  constructor() {
    this.loadAll();
  }

  private async loadAll(): Promise<void> {
    const recipes = await this.recipeDb.getAll();
    this.recipes.set(recipes);
    this.loaded.set(true);
  }

  async reload(): Promise<void> {
    await this.loadAll();
  }

  getById(id: number): RecipeModel | undefined {
    return this.recipes().find((p) => p.id === id);
  }

  async add(recipe: Omit<RecipeModel, 'id'>): Promise<void> {
    await this.recipeDb.add(recipe);
    await this.loadAll();
  }

  async update(
    id: number,
    changes: Partial<Omit<RecipeModel, 'id'>>,
  ): Promise<void> {
    const existing = this.getById(id);
    if (!existing) return;
    await this.recipeDb.save({ ...existing, ...changes });
    this.recipes.update((list) =>
      list.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  }

  async remove(id: number): Promise<void> {
    await this.recipeDb.delete(id);
    this.recipes.update((list) => list.filter((p) => p.id !== id));
  }
}
