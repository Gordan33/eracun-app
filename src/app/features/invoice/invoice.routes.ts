import { Routes } from '@angular/router';

export const INVOICE_ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-form/invoice-form.component').then(m => m.InvoiceFormComponent),
  },
];
