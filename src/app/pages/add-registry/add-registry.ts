import { Component } from '@angular/core';

type AddRegistryMethod = 'manual' | 'jar' | 'json';

@Component({
  selector: 'app-add-registry',
  templateUrl: './add-registry.html',
})
export class AddRegistryComponent {
  selectMethod(method: AddRegistryMethod): void {
    // TODO: implement each flow
    console.log('Selected method:', method);
  }
}
