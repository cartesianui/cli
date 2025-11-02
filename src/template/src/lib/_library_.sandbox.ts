import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Sandbox, EntitySandbox } from '@cartesianui/common';

@Injectable()
export class _Library_Sandbox extends Sandbox {

  private store = inject(Store);

}