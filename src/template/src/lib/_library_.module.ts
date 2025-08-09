import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { CommonModule as CartesianCommonModule } from '@cartesianui/common';
import { BoLayoutModule } from '@cartesianui/coreui';

import { _Library_RoutingModule } from './_library_-routing.module';
import { _Library_Sandbox } from './_library_.sandbox';

/**
 *  Entity sepecif imports will come here
 */

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CartesianCommonModule.forFeature(),
    BoLayoutModule.forFeature(),
    _Library_RoutingModule,
    BsDropdownModule.forRoot(),
    ButtonsModule.forRoot(),
    TabsModule.forRoot(),
    NgxDatatableModule,
    BsDatepickerModule.forRoot(),
    TypeaheadModule,
  ],
  exports: [
  ],
  providers: [
    _Library_Sandbox,
  ],
})
export class _Library_Module {}
