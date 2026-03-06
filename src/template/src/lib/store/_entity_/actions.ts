import { entityActions } from '@cartesianui/common';
import { _Entity_ } from '../../models';

const actions = entityActions<_Entity_, '_Entity_'>('_Entity_');

export const _Entity_Actions = {
  ...actions,
};
