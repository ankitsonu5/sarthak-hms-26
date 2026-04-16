import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { ApiService, ApiResponse } from '../services/api.service';
import { StorageService } from '../services/storage.service';

export interface AuthUser {
  user_id: string;
  employee_id?: string;
  full_name: string;
  email: string;
  role_id: string;
  role_name: string;
  hospital_id?: string;
  status: string;
  branches?: { branch_id: string; branch_name: string; branch_code: string; role_name: string }[];
  permissions?: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  role_id: number;
  hospital_id?: number;
  branch_id?: number;
  employee_id?: string;
}

export interface MasterRole {
  role_id: string;
  role_name: string;
  description?: string;
}

export interface SessionInfo {
  session_id: string;
  device_type: string;
  ip_address: string;
  user_agent: string;
  last_active_at: string;
  created_at: string;
}

const KEYS = {
  ACCESS_TOKEN: 'hms_access_token',
  REFRESH_TOKEN: 'hms_refresh_token',
  USER: 'hms_user',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<AuthUser | null>(null);

  user$ = this.currentUser$.asObservable();
  isLoggedIn$ = this.currentUser$.pipe(map((u) => !!u));

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const user = this.storage.getJson<AuthUser>(KEYS.USER);
    const token = this.storage.get(KEYS.ACCESS_TOKEN);
    if (user && token) this.currentUser$.next(user);
  }

  get token(): string | null {
    return this.storage.get(KEYS.ACCESS_TOKEN);
  }

  get user(): AuthUser | null {
    return this.currentUser$.value;
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this.user;
  }

  login(email: string, password: string, deviceType = 'WEB'): Observable<ApiResponse<LoginResponse>> {
    return this.api.post<LoginResponse>('/auth/login', { email, password, deviceType }).pipe(
      tap((res) => {
        if (res.success && res.data) this.storeSession(res.data);
      })
    );
  }

  register(payload: RegisterPayload): Observable<ApiResponse<any>> {
    return this.api.post('/auth/register', payload);
  }

  getRoles(): Observable<ApiResponse<MasterRole[]>> {
    return this.api.get<MasterRole[]>('/auth/roles');
  }

  refresh(): Observable<ApiResponse<{ accessToken: string }>> {
    const refreshToken = this.storage.get(KEYS.REFRESH_TOKEN);
    return this.api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }).pipe(
      tap((res) => {
        if (res.success && res.data?.accessToken) {
          this.storage.set(KEYS.ACCESS_TOKEN, res.data.accessToken);
        }
      })
    );
  }

  logout(): void {
    const refreshToken = this.storage.get(KEYS.REFRESH_TOKEN);
    this.api.post('/auth/logout', { refreshToken }).subscribe({ error: () => {} });
    this.clearSession();
  }

  logoutAll(): Observable<ApiResponse<any>> {
    return this.api.post('/auth/logout-all', {}).pipe(
      tap(() => this.clearSession())
    );
  }

  getSessions(): Observable<ApiResponse<SessionInfo[]>> {
    return this.api.get<SessionInfo[]>('/auth/sessions');
  }

  revokeSession(sessionId: string): Observable<ApiResponse<any>> {
    return this.api.delete(`/auth/sessions/${sessionId}`);
  }

  hasRole(...roles: (string | number)[]): boolean {
    const u = this.user;
    if (!u) return false;
    return roles.some(
      (r) => String(r) === u.role_id || String(r).toUpperCase() === u.role_name?.toUpperCase()
    );
  }

  hasPermission(...perms: string[]): boolean {
    const userPerms = this.user?.permissions || [];
    return perms.every((p) => userPerms.includes(p));
  }

  getRedirectRoute(): string {
    const roleName = this.user?.role_name?.toUpperCase();
    const routes: Record<string, string> = {
      SUPER_ADMIN: '/admin',
      HOSPITAL_ADMIN: '/admin',
      DOCTOR: '/doctor',
      NURSE: '/nurse',
      BILLING: '/billing',
      INSURANCE: '/admin',
      PHARMACY: '/pharmacy',
      INVENTORY: '/admin',
    };
    return routes[roleName || ''] || '/admin';
  }

  private storeSession(data: LoginResponse): void {
    this.storage.set(KEYS.ACCESS_TOKEN, data.accessToken);
    this.storage.set(KEYS.REFRESH_TOKEN, data.refreshToken);
    this.storage.setJson(KEYS.USER, data.user);
    this.currentUser$.next(data.user);
  }

  private clearSession(): void {
    this.storage.remove(KEYS.ACCESS_TOKEN);
    this.storage.remove(KEYS.REFRESH_TOKEN);
    this.storage.remove(KEYS.USER);
    this.currentUser$.next(null);
    this.router.navigate(['/auth/login']);
  }
}
