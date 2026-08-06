import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiListResponse,
  Supplier,
  SupplierCreate,
  SupplierUpdate,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class SuppliersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/suppliers`;

  list(): Observable<Supplier[]> {
    return this.http
      .get<ApiListResponse<Supplier>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  create(payload: SupplierCreate): Observable<{ ok: boolean; id: number }> {
    return this.http.post<{ ok: boolean; id: number }>(this.baseUrl, payload);
  }

  update(id: number, payload: SupplierUpdate): Observable<{ ok: boolean; message?: string }> {
    return this.http.put<{ ok: boolean; message?: string }>(`${this.baseUrl}/${id}`, payload);
  }
}
