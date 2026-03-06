// _library_.routes.ts template
import { Routes } from '@angular/router';
import { provide_Library_Feature } from './_library_.providers';
import { EntryComponent } from './entry.component';

export const routes: Routes = [
  {
    path: '',
    component: EntryComponent,
    providers: [
      provide_Library_Feature()
    ],
    children: []
  }
];