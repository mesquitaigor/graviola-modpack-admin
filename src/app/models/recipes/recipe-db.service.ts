import { inject, Injectable } from '@angular/core';
import { IndexedDbService } from '../../shared/services/indexed-db.service';
import RecipeModel from './recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipeDbService {
  private readonly dbStoreKey = 'recipes';
  private db = inject(IndexedDbService);

  constructor() {
    this.db.registerStore({
      name: this.dbStoreKey,
      options: { keyPath: 'id', autoIncrement: true },
    });
  }

  async getAll(): Promise<RecipeModel[]> {
    if (!(await this.db.isStoreRegistered(this.dbStoreKey))) {
      return Promise.resolve([]);
    }
    return this.db.getAll<RecipeModel>(this.dbStoreKey);
  }

  getById(id: number): Promise<RecipeModel | undefined> {
    return this.db.get<RecipeModel>(this.dbStoreKey, id);
  }

  add(recipe: Omit<RecipeModel, 'id'>): Promise<IDBValidKey> {
    return this.db.add<Omit<RecipeModel, 'id'>>(this.dbStoreKey, recipe);
  }

  save(recipe: RecipeModel): Promise<IDBValidKey> {
    return this.db.put<RecipeModel>(this.dbStoreKey, recipe);
  }

  delete(id: number): Promise<void> {
    return this.db.delete(this.dbStoreKey, id);
  }
}
