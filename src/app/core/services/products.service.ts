import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiListResponse,
  ApiPagedResponse,
  Product,
  ProductCreate,
  ProductListParams,
  ProductUpdate,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  list(): Observable<Product[]> {
    return this.http
      .get<ApiListResponse<Product>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  listPaged(params: ProductListParams): Observable<ApiPagedResponse<Product>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));

    if (params.q?.trim()) {
      httpParams = httpParams.set('q', params.q.trim());
    }
    if (params.field) {
      httpParams = httpParams.set('field', params.field);
    }
    if (params.active !== undefined) {
      httpParams = httpParams.set('active', String(params.active));
    }
    if (params.product_type) {
      httpParams = httpParams.set('product_type', params.product_type);
    }
    if (params.category_id !== undefined) {
      httpParams = httpParams.set('category_id', String(params.category_id));
    }

    return this.http.get<ApiPagedResponse<Product>>(this.baseUrl, { params: httpParams });
  }

  create(payload: ProductCreate): Observable<{ ok: boolean; id: number }> {
    return this.http.post<{ ok: boolean; id: number }>(this.baseUrl, payload);
  }

  update(id: number, payload: ProductUpdate): Observable<{ ok: boolean; message?: string }> {
    return this.http.put<{ ok: boolean; message?: string }>(`${this.baseUrl}/${id}`, payload);
  }
}
