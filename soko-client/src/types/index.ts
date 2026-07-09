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

export interface ScrapedEvent {
    _id: string;
    title: string;
    description: string;
    startDate: string | null;
    category: string;
    locationName: string;
    municipality: string;
    sourceUrl: string;
    source: string;
}
