import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { RequestCriteriaOuput } from '@cartesianui/core';
import { BaseComponent } from '@cartesianui/common';
import { _Library_Sandbox } from './_library_.sandbox';


@Component({
    selector: `app-_library_`,
    template: `<router-outlet></router-outlet>`,
    imports: [CommonModule, RouterOutlet],
    standalone: true
})
export class EntryComponent extends BaseComponent {

  public sb = inject(_Library_Sandbox);

  constructor() {
    super();
    console.log('📦 _Library_ feature initialized');
    // Pre-load any data
    // Here you can load any common data in store state
    // e.g. this.sb.{anyEntity}.getAll({} as RequestCriteriaOuput, true);
  }
}
