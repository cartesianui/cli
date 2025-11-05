import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { EntityEffect } from '@cartesianui/common';
import { _Entity_Actions } from './actions';
import { _Entity_ } from '../../models';
import { _Entity_HttpService } from '../../shared';


@Injectable()
export class _Entity_Effects extends EntityEffect<_Entity_> {
  constructor(
    actions$: Actions,
    httpService: _Entity_HttpService
  ) {
    super(httpService, _Entity_Actions);
  }

  // Can override methods here if needed
  // Example of overriding a method
  // fetchEntities$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(_Entity_Actions.fetchEntities),
  //     map(({ criteria }) => criteria),
  //     switchMap((criteria) => {      
  //       return this.httpService.getAll(criteria).pipe(
  //         map(({ data, meta }) => _Entity_Actions.loadEntities({ entities: data, meta })),
  //         catchError((error) => of(_Entity_Actions.fetchEntitiesFailure({ error })))
  //       );
  //     })
  //   )
  // ); 

  // activateEntity$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(_Entity_Actions.activateEntity),
  //     switchMap(({ id }) =>
  //       this.httpService.activate(id).pipe(
  //         map(({ data }) => _Entity_Actions.activateEntitySuccess({ entity: data })),
  //         catchError(({ message, errors }) =>
  //           of(_Entity_Actions.activateEntityFailure({ message, errors }))
  //         )
  //       )
  //     )
  //   )
  // );
}
