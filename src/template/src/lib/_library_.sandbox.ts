import { inject, Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { Sandbox, EntitySandbox } from '@cartesianui/common';

@Injectable()
export class _Library_Sandbox extends Sandbox {

  private store = inject(Store);
  // `EntitySandbox` instances below need access to the active Injector to
  // resolve the per-entity `cancel`/`activate` etc. action streams. Without
  // this override `this.injector` is undefined and the first form interaction
  // throws. The base Sandbox class declares the field; we just need to wire
  // the concrete inject() call.
  protected override injector = inject(Injector);

}