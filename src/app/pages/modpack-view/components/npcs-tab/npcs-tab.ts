import { Component, input, signal, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import NpcModel from '../../../../models/npcs/npc.model';
import type { ModpackModel } from '../../../../models/modpack/modpack.model';
import {
  AddNpcDialog,
  type NpcFileEntry,
} from '../add-npc-dialog/add-npc-dialog';

@Component({
  selector: 'app-npcs-tab',
  standalone: true,
  imports: [ButtonModule, AddNpcDialog],
  templateUrl: './npcs-tab.html',
})
export class NpcsTab {
  private readonly addNpcDialog = viewChild.required(AddNpcDialog);

  public readonly modpack = input.required<ModpackModel>();
  public readonly addedNpcs = signal<NpcModel[]>([]);

  public addDialog(): void {
    this.addNpcDialog().open();
  }

  public onNpcSelected(file: NpcFileEntry): void {
    const name = file.name.replace(/\.[^.]+$/, '');
    const alreadyAdded = this.addedNpcs().some(
      (npc) => npc.name === name && npc.saveName === file.saveName,
    );
    if (alreadyAdded) return;

    const npc = new NpcModel();
    npc.name = name;
    npc.saveName = file.saveName;
    npc.fileName = file.name;
    this.addedNpcs.update((npcs) => [...npcs, npc]);
  }
}
