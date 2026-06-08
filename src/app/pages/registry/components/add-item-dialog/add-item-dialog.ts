import { Component, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, type AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { RegistryService } from '../../../../models/registry/registry.service';
import { DialogService } from '../../../../core/services/dialog.service';
import { UploadItemTagsDialogComponent } from '../upload-item-tags-dialog/upload-item-tags-dialog';
import ItemModel from '../../../../models/item/item.model';

@Component({
  selector: 'app-add-item-dialog',
  templateUrl: './add-item-dialog.html',
  imports: [DialogModule, ButtonModule, AutoCompleteModule, FormsModule],
})
export class AddItemDialogComponent {
  private readonly registryService = inject(RegistryService);
  private readonly dialogService = inject(DialogService);
  private readonly registries = toSignal(this.registryService.registries$, { initialValue: [] });
  private readonly registry = computed(() =>
    this.registries().find((r) => r.id === this.registryId()),
  );
  private readonly versions = computed(() => this.registry()?.versions ?? []);
  private readonly selectedVersion = computed(() => this.versions()[this.selectedVersionIndex()]);
  private readonly itemTags = computed(() => this.registry()?.itemTags ?? []);
  private readonly versionLangs = computed(() => this.selectedVersion()?.langs ?? []);

  public visible = input(false);
  public registryId = input<string>('');
  public selectedVersionIndex = input<number>(0);
  public visibleChange = output<boolean>();
  public importLangRequest = output<void>();

  protected id = '';
  protected name = '';
  protected readonly iconDataUrl = signal<string | undefined>(undefined);
  protected readonly idSearchQuery = signal('');
  protected readonly nameSearchQuery = signal('');
  protected readonly filteredIdSuggestions = computed(() => {
    const query = this.idSearchQuery().trim().toLowerCase();
    const ids = this.itemTags().flatMap((tag) => tag.values ?? []);
    const source = [...new Set(ids)].sort();
    return query ? source.filter((id) => id.toLowerCase().includes(query)) : source;
  });
  protected readonly filteredNameSuggestions = computed(() => {
    const query = this.nameSearchQuery().trim().toLowerCase();
    const names = this.versionLangs().flatMap((lang) => Object.values(lang.values ?? {}));
    const source = [...new Set(names)].sort();
    return query ? source.filter((name) => name.toLowerCase().includes(query)) : source;
  });

  protected searchId(event: AutoCompleteCompleteEvent): void {
    this.idSearchQuery.set(event.query);
  }

  protected searchName(event: AutoCompleteCompleteEvent): void {
    this.nameSearchQuery.set(event.query);
  }

  protected requestImportTags(): void {
    this.dialogService.open(UploadItemTagsDialogComponent, {
      header: 'Carregar tags de itens',
      width: 'min(96vw, 42rem)',
      data: { registryId: this.registryId() },
    });
  }

  protected requestImportLang(): void {
    this.importLangRequest.emit();
  }

  protected onIconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file || !this.isPngFile(file)) {
      return;
    }

    this.fileToDataUrl(file).then((dataUrl) => {
      this.iconDataUrl.set(dataUrl);
    });
  }

  protected clearIcon(): void {
    this.iconDataUrl.set(undefined);
  }

  protected async submit(): Promise<void> {
    if (!this.id.trim()) return;

    const currentRegistry = this.registry();
    const version = this.selectedVersion();
    if (!currentRegistry?.id || !version) return;

    const index = this.selectedVersionIndex();
    const newItem = new ItemModel();
    newItem.id = this.id.trim();
    newItem.name = this.name.trim() || undefined;
    newItem.iconDataUrl = this.iconDataUrl();

    const updatedItems = [...(version.items ?? []), newItem];
    const updatedVersions = this.versions().map((v, i) =>
      i === index ? { ...v, items: updatedItems } : v,
    );

    await firstValueFrom(
      this.registryService.update(currentRegistry.id, { versions: updatedVersions }),
    );

    this.reset();
    this.visibleChange.emit(false);
  }

  protected cancel(): void {
    this.reset();
    this.visibleChange.emit(false);
  }

  private isPngFile(file: File): boolean {
    return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
  }

  private fileToDataUrl(file: File): Promise<string | undefined> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  }

  private reset(): void {
    this.id = '';
    this.name = '';
    this.iconDataUrl.set(undefined);
    this.idSearchQuery.set('');
    this.nameSearchQuery.set('');
  }
}
