import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, Sale, SaleCreate } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/sales`;

  list(): Observable<Sale[]> {
    return this.http
      .get<ApiListResponse<Sale>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
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
