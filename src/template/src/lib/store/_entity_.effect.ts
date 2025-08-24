import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { RequestCriteria } from '@cartesianui/core';
import { BaseEntityEffects } from '@cartesianui/common';
import { _Entity_Actions } from './_entity_.actions';
import { _Entity_ } from '../models';
import { _Entity_HttpService } from '../shared';


@Injectable()
export class _Entity_Effects extends BaseEntityEffects<_Entity_> {
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
  //     ofType(EntityActions.fetchEntities),
  //     map(({ criteria }) => criteria),
  //     switchMap((criteria) => {      
  //       return this.httpService.getAll(criteria).pipe(
  //         map(({ data, meta }) => EntityActions.loadEntities({ entities: data, meta })),
  //         catchError((error) => of(EntityActions.fetchEntitiesFailure({ error })))
  //       );
  //     })
  //   )
  // ); 

  // activateEntity$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(EntityActions.activateEntity),
  //     switchMap(({ id }) =>
  //       this.httpService.activate(id).pipe(
  //         map(({ data }) => EntityActions.activateEntitySuccess({ entity: data })),
  //         catchError(({ message, errors }) =>
  //           of(EntityActions.activateEntityFailure({ message, errors }))
  //         )
  //       )
  //     )
  //   )
  // );
}
