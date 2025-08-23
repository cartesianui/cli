import { ParentModel, FieldDescriptor, DateFormat } from '@cartesianui/common';
import { Validators, ValidatorFn } from '@angular/forms';

export interface _IEntity_ {
  id: string | undefined;
  [prop: string]: any; // allow any other properties
}

export class _Entity_ extends ParentModel implements _IEntity_ {
  public id: string;
  public field?: string;

  constructor(data?: _IEntity_) {
    super(data);
  }

  // static override get dataTableCols(): FieldDescriptor[] {
  //   return [
  //     { key: 'id', label: 'Id', opt: { link: true, formatter: { type: 'pattern', pattern: 'name (code)'} } },
  //     { key: 'accountingClass', label: 'Class' },
  //     { key: 'openingBalance', label: 'Opening Balance', opt: { formatter: { type: 'currency' } } },
  //     { key: 'openedAt', label: 'Opened At', opt: { formatter: { type: 'date', to: DateFormat.MED } } },
  //     { key: 'balance', label: 'Balance', opt: { formatter: { type: 'currency', locale: 'en-PK', currency: 'PKR' } } }
  //   ];
  // }
  /* LIST_VIEW_FIELDS */

  // Current below structure is supported
  // static override formFields?: FieldDescriptor[] = [
  //   { key: 'name', label: 'Name', opt: { validators: [Validators.required, Validators.minLength(3)] } },
  //   { key: 'openingBalance', label: 'Opening Bal' },
  //   { key: 'code', label: 'Code' },
  //   { key: 'openedAt', label: 'Opened At', opt: { formatter: { type: 'date'} } },
  // ];
  /* FORM_FIELDS */
}