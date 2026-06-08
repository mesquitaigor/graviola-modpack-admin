import { Injectable, signal, type Signal, type WritableSignal } from '@angular/core';

export type RegistryDialogKey =
  | 'addItem'
  | 'uploadTextures'
  | 'uploadItemTags'
  | 'uploadItemLang'
  | 'textureImportReview'
  | 'itemTagImportReview'
  | 'allTextures';

const DIALOG_KEYS: RegistryDialogKey[] = [
  'addItem',
  'uploadTextures',
  'uploadItemTags',
  'uploadItemLang',
  'textureImportReview',
  'itemTagImportReview',
  'allTextures',
];

@Injectable()
export class RegistryDialogsService {
  private readonly visibility = new Map<RegistryDialogKey, WritableSignal<boolean>>(
    DIALOG_KEYS.map((key) => [key, signal(false)]),
  );

  public isOpen(key: RegistryDialogKey): Signal<boolean> {
    return this.signalFor(key);
  }

  public open(key: RegistryDialogKey): void {
    this.signalFor(key).set(true);
  }

  public close(key: RegistryDialogKey): void {
    this.signalFor(key).set(false);
  }

  public setOpen(key: RegistryDialogKey, value: boolean): void {
    this.signalFor(key).set(value);
  }

  public closeAndOpen(toClose: RegistryDialogKey, toOpen: RegistryDialogKey): void {
    this.close(toClose);
    this.open(toOpen);
  }

  private signalFor(key: RegistryDialogKey): WritableSignal<boolean> {
    const existing = this.visibility.get(key);
    if (!existing) {
      throw new Error(`Dialog desconhecido: ${key}`);
    }
    return existing;
  }
}
