import { Injectable } from "@angular/core";
import { Actions } from "@ngrx/effects";
import { EntityEffect } from "@cartesianui/common";
import { _Entity_Actions } from "./actions";
import { _Entity_ } from "../../models";
import { _Entity_HttpService, I_Entity_HttpServiceExtension} from "../../shared";

@Injectable()
export class _Entity_Effects extends EntityEffect<_Entity_, I_Entity_HttpServiceExtension> {
  constructor(actions$: Actions, httpService: _Entity_HttpService) {
    super(httpService, _Entity_Actions);
  }

  // Can override methods here if needed
  // Example of overriding a method
  // fetchEntities$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(_Entity_Actions.fetchByVisitId),
  //     map((action: any) => action),
  //     switchMap(({ id, criteria }) => {
  //       return this.httpService.getAll(id, criteria).pipe(
  //         map(({ data, meta }: ICartesianResponse) => this.actions.load({ entities: data, meta })),
  //         catchError(({ errors, message }: ICartesianResponse) => of(this.actions.fetchFailure({ errors, message })))
  //       );
  //     })
  //   )
  // );

  // activateEntity$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(_Entity_Actions.activateEntity),
  //     map((action: any) => action),
  //     switchMap(({ id }) => {
  //       return this.httpService.activate(id).pipe(
  //         map(({ data, meta }: ICartesianResponse) => _Entity_Actions.activateEntitySuccess({ entity: data })),
  //         catchError(({ errors, message }: ICartesianResponse) => of(_Entity_Actions.activateEntityFailure({ message, errors })))
  //       )
  //     })
  //   )
  // );
}
