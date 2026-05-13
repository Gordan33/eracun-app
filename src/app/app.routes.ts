import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'invoice/new', pathMatch: 'full' },
      {
        path: 'invoice',
        loadChildren: () =>
          import('./features/invoice/invoice.routes').then(m => m.INVOICE_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
