import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { EntityEffect } from '@cartesianui/common';
import { _Entity_Actions } from './actions';
import { _Entity_ } from '../../models';
import { _Entity_HttpService, I_Entity_HttpServiceExtension } from '../../shared';

@Injectable()
export class _Entity_Effects extends EntityEffect<_Entity_, I_Entity_HttpServiceExtension> {
  constructor(actions$: Actions, httpService: _Entity_HttpService) {
    super(httpService, _Entity_Actions);
  }
}
