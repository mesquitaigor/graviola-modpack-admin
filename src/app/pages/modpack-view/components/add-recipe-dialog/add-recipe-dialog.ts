import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-add-recipe-dialog',
  imports: [
    DialogModule,
    ToggleSwitchModule,
    ReactiveFormsModule,
    TooltipModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './add-recipe-dialog.html',
})
export class AddRecipeDialog {
  private readonly formBuild = inject(FormBuilder);
  public recipeForm = this.formBuild.group({
    showNotification: [true],
    group: [''],
    category: [''],
    pattern0: [''],
    pattern1: [''],
    pattern2: [''],
    pattern3: [''],
    pattern4: [''],
    pattern5: [''],
    pattern6: [''],
    pattern7: [''],
    pattern8: [''],
  });
  public readonly patternSlots = Array(9);
  public visible = false;
}
