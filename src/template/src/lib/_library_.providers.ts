import { EnvironmentProviders, importProvidersFrom, makeEnvironmentProviders } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { _Library_Sandbox } from './_library_.sandbox';

/**
 *  Entity sepecific
 */


export function provide_Library_Root(): EnvironmentProviders {
  return makeEnvironmentProviders([]);
};
  
export function provide_Library_Feature(): EnvironmentProviders {
  return makeEnvironmentProviders([
    importProvidersFrom(
      // CommonModule,
      // FormsModule,
      // ReactiveFormsModule,
      // CartesianCommonModule,
      
      // Store Providers
    ),
    _Library_Sandbox,
    // Shared Services
  ]);
}