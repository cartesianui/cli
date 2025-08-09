import { Injectable, Injector } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { RequestCriteria } from '@cartesianui/core';
import { Sandbox } from '@cartesianui/common';


@Injectable()
export class _Library_Sandbox extends Sandbox {

  constructor(
    protected store: Store,
    protected override injector: Injector
  ) {
    super(injector);
  }

  /* STUB_CONTENT */

}
