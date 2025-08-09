import { ParentModel, FieldDescriptor } from '@cartesianui/common';

export interface _IEntity_ {
  id: string | undefined;
  field?: string | undefined;
}

export class _Entity_ extends ParentModel implements _IEntity_ {
  public id: string;
  public field?: string;


  constructor(data?: _IEntity_) {
    super(data);
  }

  /* LIST_VIEW_FIELDS */
  /* FORM_FIELDS */
}