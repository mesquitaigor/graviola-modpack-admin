import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-add-item-dialog',
  templateUrl: './add-item-dialog.html',
  imports: [DialogModule, ButtonModule, InputTextModule],
})
export class AddItemDialogComponent {
  public visible = input(false);
  public visibleChange = output<boolean>();
}
