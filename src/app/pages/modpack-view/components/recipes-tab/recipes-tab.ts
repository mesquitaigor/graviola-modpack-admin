import { Component, signal, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import RecipeModel from '../../../../models/recipes/recipe.model';
import { AddRecipeDialog } from '../add-recipe-dialog/add-recipe-dialog';

@Component({
  selector: 'app-recipes-tab',
  standalone: true,
  imports: [ButtonModule, AddRecipeDialog],
  templateUrl: './recipes-tab.html',
})
export class RecipesTab {
  private readonly addRecipeDialog = viewChild.required(AddRecipeDialog);
  public readonly addedRecipes = signal<RecipeModel[]>([{ name: 'Recipe 1' }]);
  public addDialog(): void {
    this.addRecipeDialog().visible = true;
  }
}
