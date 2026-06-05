import { Component, inject, input, viewChild } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { ModpackModel } from '../../../../models/modpack/modpack.model';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { EditModpackDialogComponent } from '../edit-modpack-dialog/edit-modpack-dialog';
import { Router } from '@angular/router';
import { ModpackService } from '../../../../models/modpack/modpack.service';

@Component({
  selector: 'app-modpack-header',
  imports: [MenuModule],
  templateUrl: './modpack-header.html',
})
export class ModpackHeaderComponent {
  private readonly router = inject(Router);
  private confirmation = inject(ConfirmationService);
  private modpackService = inject(ModpackService);
  public readonly modpack = input.required<ModpackModel>();
  private editDialog = viewChild.required(EditModpackDialogComponent);
  public readonly menuItems: MenuItem[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      command: () => this.editDialog().open(),
    },
    { separator: true },
    {
      label: 'Deletar',
      icon: 'pi pi-trash',
      styleClass: 'text-red-600',
      command: () => this.confirmDelete(),
    },
  ];
  confirmDelete(): void {
    const pack = this.modpack();
    if (!pack) return;
    this.confirmation.confirm({
      message: `Tem certeza que deseja deletar "${pack.name}"? Esta ação não pode ser desfeita.`,
      header: 'Deletar modpack',
      icon: 'pi pi-trash',
      acceptLabel: 'Deletar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        await this.modpackService.remove(pack.id);
        this.router.navigate(['/']);
      },
    });
  }
}
