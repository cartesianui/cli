import { entityActions } from '@cartesianui/common';
import { _Entity_ } from '../../models';


const actions = entityActions<_Entity_, '_Entity_'>('_Entity_');

// Example of extending the actions with custom actions

// import { createAction, props } from '@ngrx/store'

// export const additionalActions = {

//     // It overrides the default entityActions
//     createEntity = createAction(
//     '[Entity] Create _Entity_',
//     props<{ entity: _Entity_ }>()
//     );

//     ActivateEntity = createAction(
//     '[Entity] Activate _Entity_',
//     props<{ id: string }>()
//     );

//     ActivateEntitySuccess = createAction(
//     '[Entity] Activate _Entity_ Success',
//     props<{ entity: _Entity_ }>()
//     );

//     ActivateEntityFailure = createAction(
//     '[Entity] Activate _Entity_ Failure',
//     props<{ message: string; errors?: any }>()
//     );
// };

// Merge base + custom actions
export const _Entity_Actions = {
  ...actions,
  //...additionalActions
};




