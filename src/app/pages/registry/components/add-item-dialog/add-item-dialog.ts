import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, type AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

export interface ItemAddEvent {
  id: string;
  name?: string;
  iconDataUrl?: string;
}

@Component({
  selector: 'app-add-item-dialog',
  templateUrl: './add-item-dialog.html',
  imports: [DialogModule, ButtonModule, AutoCompleteModule, FormsModule],
})
export class AddItemDialogComponent {
  public visible = input(false);
  public idSuggestions = input<string[]>([]);
  public nameSuggestions = input<string[]>([]);
  public visibleChange = output<boolean>();
  public itemAdd = output<ItemAddEvent>();
  public importTagsRequest = output<void>();
  public importLangRequest = output<void>();

  protected id = '';
  protected name = '';
  protected readonly iconDataUrl = signal<string | undefined>(undefined);
  protected readonly idSearchQuery = signal('');
  protected readonly nameSearchQuery = signal('');
  protected readonly filteredIdSuggestions = computed(() => {
    const query = this.idSearchQuery().trim().toLowerCase();
    const source = this.idSuggestions();
    return query ? source.filter((id) => id.toLowerCase().includes(query)) : source;
  });
  protected readonly filteredNameSuggestions = computed(() => {
    const query = this.nameSearchQuery().trim().toLowerCase();
    const source = this.nameSuggestions();
    return query ? source.filter((name) => name.toLowerCase().includes(query)) : source;
  });

  protected searchId(event: AutoCompleteCompleteEvent): void {
    this.idSearchQuery.set(event.query);
  }

  protected searchName(event: AutoCompleteCompleteEvent): void {
    this.nameSearchQuery.set(event.query);
  }

  protected requestImportTags(): void {
    this.importTagsRequest.emit();
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

  protected submit(): void {
    if (!this.id.trim()) return;
    this.itemAdd.emit({
      id: this.id.trim(),
      name: this.name.trim() || undefined,
      iconDataUrl: this.iconDataUrl(),
    });
    this.reset();
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
