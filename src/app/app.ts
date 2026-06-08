import { Component, inject, type OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/layout/sidebar/sidebar';
import { DialogHostComponent } from './core/layout/dialog-host/dialog-host';
import { RegistryService } from './models/registry/registry.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [SidebarComponent, DialogHostComponent, RouterOutlet],
})
export class App implements OnInit {
  private readonly registryService = inject(RegistryService);

  public ngOnInit(): void {
    this.registryService.loaded$.subscribe((loaded) => {
      if (loaded && this.registryService.getRegistries().length === 0) {
        this.registryService.loadPredfinedRegistries();
      }
    });
  }
}
