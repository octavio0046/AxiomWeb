import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiListResponse, Category } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  list(): Observable<Category[]> {
    return this.http
      .get<ApiListResponse<Category>>(this.baseUrl)
      .pipe(map((res) => res.data ?? []));
  }
}
