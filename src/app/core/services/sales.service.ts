import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiItemResponse,
  ApiListResponse,
  ApiPagedResponse,
  Sale,
  SaleCreate,
  SaleDetail,
  SaleListParams,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales`;

  list(): Observable<Sale[]> {
    return this.http
      .get<ApiListResponse<Sale>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  listPaged(params: SaleListParams): Observable<ApiPagedResponse<Sale>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));

    if (params.q?.trim()) {
      httpParams = httpParams.set('q', params.q.trim());
    }
    if (params.field) {
      httpParams = httpParams.set('field', params.field);
    }

    return this.http.get<ApiPagedResponse<Sale>>(this.baseUrl, { params: httpParams });
  }

  getById(id: number): Observable<SaleDetail> {
    return this.http
      .get<ApiItemResponse<SaleDetail>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: SaleCreate): Observable<{
    ok: boolean;
    id: number;
    sale_number: string;
    subtotal: number;
    tax: number;
    total: number;
  }> {
    return this.http.post<{
      ok: boolean;
      id: number;
      sale_number: string;
      subtotal: number;
      tax: number;
      total: number;
    }>(this.baseUrl, payload);
  }
}
