import { Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { Sandbox, EntitySandbox } from '@cartesianui/common';


@Injectable()
export class _Library_Sandbox extends Sandbox {

  /* MICRO_STUB_DEF_CONTENT */

  constructor(
    protected store: Store,
    protected override injector: Injector
  ) {
    super(injector);

    /* MICRO_STUB_CTOR_CONTENT */

  }

  /* STUB_CONTENT */
}
