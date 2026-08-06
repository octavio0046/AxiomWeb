export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  role_id?: number;
  role_name?: string;
}

export interface LoginResponse {
  ok: boolean;
  token: string;
  user: AuthUser;
  permissions?: string[];
  message?: string;
}

export interface MeResponse {
  ok: boolean;
  user: AuthUser;
  permissions?: string[];
  message?: string;
}

export interface ApiListResponse<T> {
  ok: boolean;
  data: T[];
  message?: string;
}

export interface ApiItemResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  is_active?: number;
}

export type ProductType = 'product' | 'spare_part' | 'service';

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  sku: string;
  name: string;
  description?: string | null;
  product_type: ProductType;
  price: number;
  cost: number;
  stock: number;
  is_active?: number;
}

export interface ProductCreate {
  category_id: number;
  sku: string;
  name: string;
  description?: string | null;
  product_type: ProductType;
  price: number;
  cost: number;
}

export interface Customer {
  id: number;
  name: string;
  document_number?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active?: number;
}

export interface CustomerCreate {
  name: string;
  document_number?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
}

export interface UserAccount {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: number;
  role_id: number;
  role_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreate {
  role_id: number;
  username: string;
  email: string;
  password: string;
  full_name: string;
  is_active?: number;
}

export interface UserUpdate {
  role_id?: number;
  email?: string;
  full_name?: string;
  is_active?: number;
  password?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Sale {
  id: number;
  sale_number: string;
  sold_at: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  user_id: number;
  user_name?: string;
  customer_id?: number | null;
  customer_name?: string | null;
  notes?: string | null;
}

export interface SaleItem {
  id: number;
  product_id: number;
  sku?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface SalePayment {
  id: number;
  method: PaymentMethod | string;
  amount: number;
  paid_at?: string;
  reference?: string | null;
}

export interface SaleDetail extends Sale {
  items: SaleItem[];
  payments: SalePayment[];
}

export interface SaleItemInput {
  product_id: number;
  quantity: number;
}

export interface SalePaymentInput {
  method: PaymentMethod;
  amount: number;
}

export interface SaleCreate {
  customer_id: number | null;
  tax: number;
  items: SaleItemInput[];
  payments: SalePaymentInput[];
}

export interface Supplier {
  id: number;
  name: string;
  document_number?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active?: number;
}

export interface SupplierCreate {
  name: string;
  document_number?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface Purchase {
  id: number;
  purchase_number: string;
  purchased_at: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  supplier_id: number;
  supplier_name?: string;
  user_id: number;
  user_name?: string;
  notes?: string | null;
}

export interface PurchaseItem {
  id: number;
  product_id: number;
  sku?: string;
  product_name?: string;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

export interface PurchaseDetail extends Purchase {
  items: PurchaseItem[];
}

export interface PurchaseItemInput {
  product_id: number;
  quantity: number;
  unit_cost: number;
}

export interface PurchaseCreate {
  supplier_id: number;
  tax: number;
  notes?: string | null;
  items: PurchaseItemInput[];
}
