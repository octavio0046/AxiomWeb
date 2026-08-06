import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, Role } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http
      .get<ApiListResponse<Role>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }
}
