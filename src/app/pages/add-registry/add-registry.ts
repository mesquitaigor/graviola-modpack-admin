import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RegistryService } from '../../models/registry/registry.service';
import RegistryModel from '../../models/registry/registry.model';

type AddRegistryMethod = 'manual' | 'jar' | 'json';
type Step = 'select-method' | 'manual-form';

@Component({
  selector: 'app-add-registry',
  templateUrl: './add-registry.html',
  imports: [ReactiveFormsModule],
})
export class AddRegistryComponent {
  private readonly router = inject(Router);
  private readonly registryService = inject(RegistryService);

  readonly step = signal<Step>('select-method');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    namespace: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)],
    }),
  });

  selectMethod(method: AddRegistryMethod): void {
    if (method === 'manual') {
      this.step.set('manual-form');
    }
  }

  back(): void {
    this.step.set('select-method');
    this.form.reset();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    const { name, namespace } = this.form.getRawValue();
    // toCreateData mutates the object and assigns id — keep the reference
    const registry: RegistryModel = { name, namespace, items: [] };

    try {
      await firstValueFrom(this.registryService.add(registry));
      if (registry.id) {
        this.router.navigate(['/registry', registry.id]);
      }
    } finally {
      this.saving.set(false);
    }
  }
}
