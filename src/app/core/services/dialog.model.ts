import { InjectionToken, type Injector, type Type } from '@angular/core';
import { Subject } from 'rxjs';

export interface DialogConfig<TData = unknown> {
  header?: string;
  width?: string;
  data?: TData;
}

export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA');

export class DialogRef<TResult = unknown> {
  private readonly closedSource = new Subject<TResult | undefined>();

  public readonly closed = this.closedSource.asObservable();

  constructor(private readonly onClose: () => void) {}

  public close(result?: TResult): void {
    this.onClose();
    this.closedSource.next(result);
    this.closedSource.complete();
  }
}

export interface OpenDialog {
  component: Type<unknown>;
  config: DialogConfig;
  injector: Injector;
  ref: { close(): void };
}
