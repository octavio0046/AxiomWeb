import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { Shell } from './layout/shell/shell';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Products } from './pages/products/products';
import { Customers } from './pages/customers/customers';
import { Sales } from './pages/sales/sales';
import { SaleCreate } from './pages/sale-create/sale-create';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', component: Home },
      { path: 'products', component: Products },
      { path: 'customers', component: Customers },
      { path: 'sales', component: Sales },
      { path: 'sales/new', component: SaleCreate },
    ],
  },
  { path: '**', redirectTo: '' },
];
