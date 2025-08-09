import { Component, Injector } from '@angular/core';
import { BaseComponent } from '@cartesianui/common';

@Component({
  selector: `app-_library_`,
  template: `<router-outlet></router-outlet>`
})
export class EntryComponent extends BaseComponent {
  constructor(injector: Injector) {
    super(injector);
  }
}

