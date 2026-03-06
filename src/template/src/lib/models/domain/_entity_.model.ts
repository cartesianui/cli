import { BaseModel, FieldDescriptor, DateFormat } from '@cartesianui/common';
import { Validators, ValidatorFn } from '@angular/forms';

export interface _IEntity_ {
  id: string | undefined;
  field?: any; 
}

export class _Entity_ extends BaseModel implements _IEntity_ {
  id: string;
  field?: string;

  constructor(data?: _IEntity_) {
    super(data);
  }
}