export type UserRole = 'ADMIN' | 'REP';
export interface JwtPayload {
    sub: string;
    tenantId: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface LoginDto {
    email: string;
    password: string;
}
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
export interface User {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    role: UserRole;
    lastLogin: Date | null;
}
export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    plan: string;
    apiKey: string;
    createdAt: Date;
}
