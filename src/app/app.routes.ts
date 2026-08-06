import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { Shell } from './layout/shell/shell';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Products } from './pages/products/products';
import { Customers } from './pages/customers/customers';
import { Sales } from './pages/sales/sales';
import { SaleCreate } from './pages/sale-create/sale-create';
import { Users } from './pages/users/users';
import { Suppliers } from './pages/suppliers/suppliers';
import { Purchases } from './pages/purchases/purchases';
import { PurchaseCreate } from './pages/purchase-create/purchase-create';
import { PurchaseDetailPage } from './pages/purchase-detail/purchase-detail';

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
      { path: 'users', component: Users },
      { path: 'suppliers', component: Suppliers },
      { path: 'purchases/new', component: PurchaseCreate },
      { path: 'purchases/:id', component: PurchaseDetailPage },
      { path: 'purchases', component: Purchases },
      { path: 'sales/new', component: SaleCreate },
      { path: 'sales', component: Sales },
    ],
  },
  { path: '**', redirectTo: '' },
];



