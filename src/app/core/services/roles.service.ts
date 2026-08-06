import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiItemResponse,
  ApiListResponse,
  Role,
  RolePermissionsData,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/roles`;

  list(): Observable<Role[]> {
    return this.http
      .get<ApiListResponse<Role>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }

  getPermissions(roleId: number): Observable<RolePermissionsData> {
    return this.http
      .get<ApiItemResponse<RolePermissionsData>>(`${this.baseUrl}/${roleId}/permissions`)
      .pipe(map((res) => res.data));
  }

  updatePermissions(
    roleId: number,
    permissionIds: number[]
  ): Observable<{ ok: boolean; message?: string; permission_ids?: number[] }> {
    return this.http.put<{ ok: boolean; message?: string; permission_ids?: number[] }>(
      `${this.baseUrl}/${roleId}/permissions`,
      { permission_ids: permissionIds }
    );
  }
}
