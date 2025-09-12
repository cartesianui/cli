import { Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { Sandbox, EntitySandbox } from '@cartesianui/common';


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
