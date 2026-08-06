import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiListResponse,
  UserAccount,
  UserCreate,
  UserUpdate,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  list(): Observable<UserAccount[]> {
    return this.http
      .get<ApiListResponse<UserAccount>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  create(payload: UserCreate): Observable<{ ok: boolean; id: number }> {
    return this.http.post<{ ok: boolean; id: number }>(this.baseUrl, payload);
  }

  update(id: number, payload: UserUpdate): Observable<{ ok: boolean; message?: string }> {
    return this.http.put<{ ok: boolean; message?: string }>(`${this.baseUrl}/${id}`, payload);
  }
}
