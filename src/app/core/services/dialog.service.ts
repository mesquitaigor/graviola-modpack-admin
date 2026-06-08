import { Injectable, Injector, inject, signal, type Type } from '@angular/core';
import { DIALOG_DATA, DialogRef, type DialogConfig, type OpenDialog } from './dialog.model';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly parentInjector = inject(Injector);

  public readonly stack = signal<OpenDialog[]>([]);

  public open<TResult = unknown, TData = unknown>(
    component: Type<unknown>,
    config: DialogConfig<TData> = {},
  ): DialogRef<TResult> {
    const ref = new DialogRef<TResult>(() =>
      this.stack.update((s) => s.filter((d) => d.ref !== ref)),
    );

    const injector = Injector.create({
      providers: [
        { provide: DIALOG_DATA, useValue: config.data },
        { provide: DialogRef, useValue: ref },
      ],
      parent: this.parentInjector,
    });

    this.stack.update((s) => [...s, { component, config, injector, ref }]);

    return ref;
  }
}
