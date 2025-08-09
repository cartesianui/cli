
import { _Entity_ } from '../models';
import { _Entity_Actions } from './_entity_.actions';
import { createEntityFeature } from '@cartesianui/common';


// Export via destructuring
// to import: import * as from_Entity from './file/path'
// export const {
//   featureKey,
//   reducer,
//   feature,
//   selectIds,
//   selectEntities,
//   selectAll,
//   selectTotal,
//   selected,
//   meta,
//   request,
//   creation,
//   updation,
//   entities
// } = createEntityFeature<_Entity_>('entities', _Entity_Actions);

// Export without destructuring
// to import: import {from_Entity } from './file/path'
export const from_Entity_ = createEntityFeature<_Entity_>('_PentityName_', _Entity_Actions);


// Example of extending the feature with custom selectors
// Extend with custom selectors

// import { createSelector } from '@ngrx/store';

// Select only active entities
// export const selectActiveEntities = createSelector(
//   selectAllEntities,
//   (entities: Entity[]) => entities.filter((e) => e.active)
// );

// // Select only inactive entities
// export const selectInactiveEntities = createSelector(
//   selectAllEntities,
//   (entities: Entity[]) => entities.filter((e) => !e.active)
// );

// // Select count of active entities
// export const selectActiveEntityCount = createSelector(
//   selectActiveEntities,
//   (activeEntities) => activeEntities.length
// );