import { Component, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ModpackService } from '../../../models/modpack/modpack.service';
import { AddModpackDialogComponent } from './add-modpack-dialog/add-modpack-dialog';
import { RegistryService } from '../../../models/registry/registry.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  imports: [
    AvatarModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    AddModpackDialogComponent,
  ],
})
export class SidebarComponent {
  private readonly modpackService = inject(ModpackService);
  private readonly registryService = inject(RegistryService);

  public readonly collapsed = signal(false);
  public readonly modpacks = this.modpackService.modpacks$;
  public readonly registries = toSignal(this.registryService.registries$, {
    initialValue: [],
  });

  private readonly dialog = viewChild.required(AddModpackDialogComponent);

  public toggle() {
    this.collapsed.update((v) => !v);
  }

  public openAddDialog() {
    this.dialog().open();
  }
}
