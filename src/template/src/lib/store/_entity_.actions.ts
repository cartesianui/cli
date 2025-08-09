import { createEntityActions } from '@cartesianui/common';
import { _Entity_, _Entity_Search } from '../models';


const actions = createEntityActions<_Entity_, _Entity_Search, '_Entity_'>('_Entity_');

// Example of extending the actions with custom actions

// import { createAction, props } from '@ngrx/store'

// export const additionalActions = {

//     // It overrides the default createEntityActions
//     createEntity = createAction(
//     '[Entity] Create Entity',
//     props<{ entity: Entity }>()
//     );

//     ActivateEntity = createAction(
//     '[Entity] Activate Entity',
//     props<{ id: string }>()
//     );

//     ActivateEntitySuccess = createAction(
//     '[Entity] Activate Entity Success',
//     props<{ entity: Entity }>()
//     );

//     ActivateEntityFailure = createAction(
//     '[Entity] Activate Entity Failure',
//     props<{ message: string; errors?: any }>()
//     );
// };

// Merge base + custom actions
export const _Entity_Actions = {
  ...actions,
  //...additionalActions
};




