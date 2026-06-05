import { Component, inject, input, signal } from '@angular/core';
import { DatapackService } from '../../../../models/datapack/datapack.service';
import DatapackModel from '../../../../models/datapack/datapack.model';
import type { ModpackModel } from '../../../../models/modpack/modpack.model';

@Component({
  selector: 'app-datapacks-list',
  imports: [],
  templateUrl: './datapacks-list.html',
})
export class DatapacksList {
  private readonly datapackService = inject(DatapackService);
  public readonly modpack = input.required<ModpackModel>();
  public readonly datapackStatus = signal<
    'idle' | 'loading' | 'ready' | 'empty'
  >('idle');
  public readonly datapacks = signal<DatapackModel[]>([]);

  async loadDatapacks(): Promise<void> {
    this.datapackStatus.set('loading');
    await this.datapackService.reload();
    const datapacks = this.datapackService.datapacks$();
    this.datapacks.set(datapacks);
    this.datapackStatus.set(datapacks.length ? 'ready' : 'empty');
  }
}
