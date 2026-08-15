import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { getApiBase } from '../config/api-config';

export interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token?: string;
  is_verified?: boolean;
  data?: { access_token?: string };
}

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${getApiBase()}/authentication/login`, data).pipe(
      tap((response) => {
        const token = response.access_token || response.data?.access_token;
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
