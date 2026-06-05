import { Component, effect, inject, signal, viewChild, type OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { ModpackService } from '../../models/modpack/modpack.service';
import { EditModpackDialogComponent } from './components/edit-modpack-dialog/edit-modpack-dialog';
import {
  FolderStatusComponent,
  type FolderStatus,
} from './components/folder-status/folder-status';
import { ModpackLogsComponent } from './components/modpack-logs/modpack-logs';
import { ModpackHeaderComponent } from './components/modpack-header/modpack-header';
import { DatapacksList } from './components/datapacks-list/datapacks-list';
import { RecipesTab } from './components/recipes-tab/recipes-tab';

@Component({
  selector: 'app-modpack-view',
  templateUrl: './modpack-view.html',
  imports: [
    ConfirmDialogModule,
    MenuModule,
    ButtonModule,
    TabsModule,
    EditModpackDialogComponent,
    FolderStatusComponent,
    ModpackLogsComponent,
    DatapacksList,
    ModpackHeaderComponent,
    RecipesTab,
  ],
  providers: [ConfirmationService],
})
export class ModpackViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modpackService = inject(ModpackService);
  private readonly datapacksList = viewChild(DatapacksList);

  public readonly modpackId = signal<number>(this.idRouter);
  public readonly modpack = signal(
    this.modpackService.getById(this.modpackId()),
  );
  public readonly activeTab = signal<'general' | 'datapacks' | 'recipes'>(
    'recipes',
  );
  public readonly folderStatus = signal<FolderStatus>('checking');

  get idRouter() {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  constructor() {
    effect(async () => {
      if (this.modpackService.modpacks$()) {
        this.modpack.set(this.modpackService.getById(this.idRouter));
      }
    });
  }

  public ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.modpack.set(this.modpackService.getById(this.idRouter));
      }
    });
  }

  async selectTab(tab: 'general' | 'datapacks'): Promise<void> {
    this.activeTab.set(tab);
    if (tab === 'datapacks') {
      queueMicrotask(() => {
        void this.datapacksList()?.loadDatapacks();
      });
    }
  }

  async onTabValueChange(tab: string | number | undefined): Promise<void> {
    if (tab === 'general' || tab === 'datapacks') {
      await this.selectTab(tab);
    }
  }
}
