import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SalesReportData {
  from: string;
  to: string;
  summary: {
    sales_count: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  by_day: Array<{ sale_date: string; sales_count: number; total: number }>;
  top_products: Array<{
    id: number;
    sku: string;
    name: string;
    quantity_sold: number;
    amount_sold: number;
  }>;
}

export interface InventoryReportData {
  summary: {
    products_count: number;
    total_units: number;
    inventory_value: number;
    out_of_stock: number;
    low_stock: number;
  };
  items: Array<{
    id: number;
    sku: string;
    name: string;
    product_type: string;
    price: number;
    cost: number;
    stock: number;
    category_name: string;
    inventory_value: number;
    stock_status: 'ok' | 'bajo' | 'sin_stock' | 'n/a';
  }>;
}

export interface PurchasesReportData {
  from: string;
  to: string;
  summary: {
    purchases_count: number;
    subtotal: number;
    tax: number;
    total: number;
  };
  by_supplier: Array<{
    id: number;
    supplier_name: string;
    purchases_count: number;
    total: number;
  }>;
  recent: Array<{
    id: number;
    purchase_number: string;
    purchased_at: string;
    total: number;
    status: string;
    supplier_name: string;
    user_name: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reports`;

  sales(from: string, to: string): Observable<SalesReportData> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .get<{ ok: boolean; data: SalesReportData }>(`${this.baseUrl}/sales`, { params })
      .pipe(map((res) => res.data));
  }

  inventory(): Observable<InventoryReportData> {
    return this.http
      .get<{ ok: boolean; data: InventoryReportData }>(`${this.baseUrl}/inventory`)
      .pipe(map((res) => res.data));
  }

  purchases(from: string, to: string): Observable<PurchasesReportData> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http
      .get<{ ok: boolean; data: PurchasesReportData }>(`${this.baseUrl}/purchases`, {
        params,
      })
      .pipe(map((res) => res.data));
  }
}
