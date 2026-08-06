import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, Product, ProductCreate } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  list(): Observable<Product[]> {
    return this.http
      .get<ApiListResponse<Product>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  create(payload: ProductCreate): Observable<{ ok: boolean; id: number }> {
    return this.http.post<{ ok: boolean; id: number }>(this.baseUrl, payload);
  }
}
