/**
 * Auth types — JWT tokens, login DTOs, and user roles.
 */

/** User roles in the system */
export type UserRole = 'ADMIN' | 'REP';

/** JWT token payload — present on every authenticated request */
export interface JwtPayload {
  /** User ID (maps to User.id) */
  sub: string;
  /** Tenant ID (maps to Tenant.id) — used for RLS context */
  tenantId: string;
  /** User role — determines authorization level */
  role: UserRole;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp: number;
}

/** DTO for login requests */
export interface LoginDto {
  email: string;
  password: string;
}

/** Response from successful login */
export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    tenantId: string;
  };
}

/** User record (without password hash) */
export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: Date | null;
}

/** Tenant record */
export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  apiKey: string;
  createdAt: Date;
}
