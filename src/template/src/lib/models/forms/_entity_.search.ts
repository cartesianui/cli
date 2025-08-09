import { Injectable } from '@angular/core';
import { WhereItem } from '@cartesianui/core';

@Injectable()
export class _Entity_Search {
  field: WhereItem = { column: 'field', operator: '=', value: null };
}
