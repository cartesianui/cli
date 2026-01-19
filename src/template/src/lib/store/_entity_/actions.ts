import { entityActions } from '@cartesianui/common';
import { _Entity_ } from '../../models';
// import { createAction, props } from '@ngrx/store'

const actions = entityActions<_Entity_, '_Entity_'>('_Entity_');

// Example of extending the actions with custom actions
// export const additionalActions = {
  // It overrides the default entityActions
  // activateEntity: createAction('[_Entity_] Activate _Entity_', props<{ id: string }>()),
  // activateEntitySuccess: createAction('[_Entity_] Activate _Entity_ Success', props<{ entity: _Entity_ }>()),
  // activateEntityFailure: createAction('[_Entity_] Activate _Entity_ Failure', props<{ message: string; errors?: any }>()),
// };

// Merge base + custom actions
export const _Entity_Actions = {
  ...actions,
  //...additionalActions
};




