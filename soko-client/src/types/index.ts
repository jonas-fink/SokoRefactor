export interface User {
    id: string;
    name?: string;
    email: string;
    role: 'user' | 'admin' | 'creator';
}

export interface PopulatedUser {
    _id: string;
    id?: string;
    name: string;
    email?: string;
}

export interface AuthUser {
    id: string;
    name?: string;
    email: string;
    role: 'user' | 'admin' | 'creator';
}

export interface ApiResponse<T> {
    data: T;
}
