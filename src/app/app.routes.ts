import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
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
      {
        path: '',
        component: Home,
        canActivate: [permissionGuard('dashboard.view')],
      },
      {
        path: 'products',
        component: Products,
        canActivate: [permissionGuard('products.view', 'products.manage')],
      },
      {
        path: 'customers',
        component: Customers,
        canActivate: [permissionGuard('customers.view', 'customers.manage')],
      },
      {
        path: 'users',
        component: Users,
        canActivate: [permissionGuard('users.manage')],
      },
      {
        path: 'suppliers',
        component: Suppliers,
        canActivate: [permissionGuard('suppliers.view', 'suppliers.manage')],
      },
      {
        path: 'purchases/new',
        component: PurchaseCreate,
        canActivate: [permissionGuard('purchases.create')],
      },
      {
        path: 'purchases/:id',
        component: PurchaseDetailPage,
        canActivate: [permissionGuard('purchases.view', 'purchases.create')],
      },
      {
        path: 'purchases',
        component: Purchases,
        canActivate: [permissionGuard('purchases.view', 'purchases.create')],
      },
      {
        path: 'sales/new',
        component: SaleCreate,
        canActivate: [permissionGuard('sales.create')],
      },
      {
        path: 'sales',
        component: Sales,
        canActivate: [permissionGuard('sales.view', 'sales.create')],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
