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
  stock: number;
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
