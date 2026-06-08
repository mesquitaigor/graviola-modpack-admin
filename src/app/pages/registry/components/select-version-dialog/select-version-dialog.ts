import { Component, computed, inject, signal } from '@angular/core';
import type { Signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import type { VersionModel } from '../../../../models/version/version.model';
import { DIALOG_DATA, DialogRef } from '../../../../core/services/dialog.model';
import { DialogService } from '../../../../core/services/dialog.service';
import { AddVersionDialogComponent } from '../add-version-dialog/add-version-dialog';
import type { AddVersionDialogData } from '../add-version-dialog/add-version-dialog';

interface VersionGroup {
  mcVersion: string;
  items: { value: string; index: number }[];
}

export interface SelectVersionDialogData {
  registryId: string;
  versions: Signal<VersionModel[]>;
  selectedVersionIndex: WritableSignal<number>;
}

@Component({
  selector: 'app-select-version-dialog',
  templateUrl: './select-version-dialog.html',
  imports: [ButtonModule, IconFieldModule, InputIconModule, InputTextModule, FormsModule],
})
export class SelectVersionDialogComponent {
  private readonly data = inject<SelectVersionDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<void>>(DialogRef);
  private readonly dialogService = inject(DialogService);

  protected readonly versions = this.data.versions;
  protected readonly selectedVersionIndex = this.data.selectedVersionIndex;

  protected readonly searchQuery = signal('');

  protected readonly filteredGroups = computed<VersionGroup[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const grouped = new Map<string, { value: string; index: number }[]>();

    this.versions().forEach((v, i) => {
      if (
        query &&
        !v.value?.toLowerCase().includes(query) &&
        !v.mcVersion?.toLowerCase().includes(query)
      ) {
        return;
      }
      const list = grouped.get(v.mcVersion || '') ?? [];
      list.push({ value: v.value || '', index: i });
      grouped.set(v.mcVersion || '', list);
    });

    return Array.from(grouped.entries()).map(([mcVersion, items]) => ({ mcVersion, items }));
  });

  protected selectVersion(index: number): void {
    this.selectedVersionIndex.set(index);
    this.dialogRef.close();
  }

  protected requestAdd(): void {
    this.dialogService.open<void, AddVersionDialogData>(AddVersionDialogComponent, {
      header: 'Adicionar versão',
      width: '22rem',
      data: {
        registryId: this.data.registryId,
        versions: this.data.versions,
        selectedVersionIndex: this.data.selectedVersionIndex,
      },
    });
  }
}
