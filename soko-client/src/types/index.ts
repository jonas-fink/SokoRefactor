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

export type ItemType = 'Activity' | 'ScrapedEvent' | 'Beratung';

export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number];
}

export interface Activity {
    _id: string;
    title: string;
    description: string;
    image: string;
    date: string;
    price: number;
    tags: string[];
    location: GeoPoint;
    userId: PopulatedUser;
    createdAt: string;
    updatedAt: string;
}

/** Gemeinsames Minimal-Shape aus `GET /favorites` (populatedFavoriteSchema). */
export interface FavoriteItem {
    _id: string;
    title: string;
    description?: string;
    image?: string;
    tags?: string[];
    date?: string;
    price?: number;
    startDate?: string;
    locationName?: string;
    sourceUrl?: string;
    location?: GeoPoint;
}

export interface Favorite {
    _id: string;
    itemType: ItemType;
    itemId: FavoriteItem;
    createdAt: string;
    updatedAt: string;
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
