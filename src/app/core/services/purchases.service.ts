import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiItemResponse,
  ApiListResponse,
  Purchase,
  PurchaseCreate,
  PurchaseDetail,
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
