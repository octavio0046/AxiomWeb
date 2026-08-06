import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, Customer, CustomerCreate } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  list(): Observable<Customer[]> {
    return this.http
      .get<ApiListResponse<Customer>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  create(payload: CustomerCreate): Observable<{ ok: boolean; id: number }> {
    return this.http.post<{ ok: boolean; id: number }>(this.baseUrl, payload);
  }
}
