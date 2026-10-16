import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'expense-management',
    loadComponent: () => import('./view/expense-management/expense-management').then((m) => m.ExpenseManagement),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'expense-management',
  },
  {
    path: 'members-management',
    loadComponent: () => import('./view/members-management/members-management').then((m) => m.MembersManagement),
  },
];
