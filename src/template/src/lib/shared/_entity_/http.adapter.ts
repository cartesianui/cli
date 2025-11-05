import { Injectable } from '@angular/core';
import { convertObjectKeysToCamel } from '@cartesianui/core';

@Injectable()
export class _Entity_Adapter {
  constructor() {}

  /**
   * Camelize response keys
   *
   * @param libraryName Object to camelize keys of
   */
  static adapter(response: any): any {
    return Object.assign({}, response, convertObjectKeysToCamel(response));
  }
}