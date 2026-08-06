import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginResponse, MeResponse } from '../models/api.models';

const TOKEN_KEY = 'axiom_token';
const USER_KEY = 'axiom_user';
const PERMS_KEY = 'axiom_permissions';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<AuthUser | null>(this.readStoredUser());
  private readonly tokenSignal = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly permissionsSignal = signal<string[]>(this.readStoredPermissions());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly permissions = this.permissionsSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        tap((res) => {
          if (res.ok && res.token) {
            this.persistSession(res.token, res.user, res.permissions || []);
          }
        })
      );
  }

  refreshMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${environment.apiUrl}/auth/me`).pipe(
      tap((res) => {
        if (res.ok && res.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          localStorage.setItem(PERMS_KEY, JSON.stringify(res.permissions || []));
          this.currentUserSignal.set(res.user);
          this.permissionsSignal.set(res.permissions || []);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMS_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.permissionsSignal.set([]);
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  hasPermission(...codes: string[]): boolean {
    const perms = this.permissionsSignal();
    return codes.some((code) => perms.includes(code));
  }

  private persistSession(token: string, user: AuthUser, permissions: string[]): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(PERMS_KEY, JSON.stringify(permissions));
    this.tokenSignal.set(token);
    this.currentUserSignal.set(user);
    this.permissionsSignal.set(permissions);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private readStoredPermissions(): string[] {
    const raw = localStorage.getItem(PERMS_KEY);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
