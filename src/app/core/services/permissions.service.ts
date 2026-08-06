import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, Permission } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/permissions`;

  list(): Observable<Permission[]> {
    return this.http
      .get<ApiListResponse<Permission>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }
}
