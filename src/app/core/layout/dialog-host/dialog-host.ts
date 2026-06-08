import { Component, inject } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { DialogService } from '../../services/dialog.service';
import type { OpenDialog } from '../../services/dialog.model';

@Component({
  selector: 'app-dialog-host',
  templateUrl: './dialog-host.html',
  imports: [DialogModule, NgComponentOutlet],
})
export class DialogHostComponent {
  private readonly dialogService = inject(DialogService);

  protected readonly stack = this.dialogService.stack;

  protected onVisibleChange(dialog: OpenDialog, visible: boolean): void {
    if (!visible) {
      dialog.ref.close();
    }
  }
}
