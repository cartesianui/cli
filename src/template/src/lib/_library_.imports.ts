// Angular core modules
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Third-party UI modules
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { 
  NgxDatatableModule,
} from '@swimlane/ngx-datatable';

// Cartesian UI modules
import { CommonModule as CartesianCommonModule } from '@cartesianui/common';
import { BoLayoutModule } from '@cartesianui/coreui';

/**
 * 🧩 Core shared imports
 * Common imports used across listing & form modules
 */
export const COMMON_IMPORTS = [
  CommonModule,
  CartesianCommonModule,
  BoLayoutModule,
];

/**
 * 📋 Listing-specific imports
 */
export const LISTING_IMPORTS = [
  ...COMMON_IMPORTS,
  NgxDatatableModule,
  BsDatepickerModule
];

/**
 * 📝 Form-specific imports
 */
export const FORM_IMPORTS = [
  ...COMMON_IMPORTS,
  FormsModule,
  ReactiveFormsModule,
  RouterModule,
  BsDropdownModule,
  ButtonsModule,
  TabsModule,
  TypeaheadModule,
  BsDatepickerModule,
];
