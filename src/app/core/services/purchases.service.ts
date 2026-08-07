import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiItemResponse,
  ApiListResponse,
  ApiPagedResponse,
  Purchase,
  PurchaseCreate,
  PurchaseDetail,
  PurchaseListParams,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/purchases`;

  list(): Observable<Purchase[]> {
    return this.http
      .get<ApiListResponse<Purchase>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  listPaged(params: PurchaseListParams): Observable<ApiPagedResponse<Purchase>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('pageSize', String(params.pageSize ?? 10));

    if (params.q?.trim()) {
      httpParams = httpParams.set('q', params.q.trim());
    }
    if (params.field) {
      httpParams = httpParams.set('field', params.field);
    }

    return this.http.get<ApiPagedResponse<Purchase>>(this.baseUrl, {
      params: httpParams,
    });
  }

  getById(id: number): Observable<PurchaseDetail> {
    return this.http
      .get<ApiItemResponse<PurchaseDetail>>(`${this.baseUrl}/${id}`)
      .pipe(map((res) => res.data));
  }

  create(payload: PurchaseCreate): Observable<{
    ok: boolean;
    id: number;
    purchase_number: string;
  }> {
    return this.http.post<{
      ok: boolean;
      id: number;
      purchase_number: string;
    }>(this.baseUrl, payload);
  }
}