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

/** Spiegelt das Filtervokabular (`hooks/useFilters.ts`) — dieselben Keys wie in
 *  der URL, nur als Startwerte statt als Zustand. */
export interface Preferences {
    languages: string[];
    audiences: string[];
    /** `Category.key` */
    categories: string[];
    freeOnly: boolean;
}

export const EMPTY_PREFERENCES: Preferences = {
    languages: [],
    audiences: [],
    categories: [],
    freeOnly: false,
};

export interface AuthUser {
    id: string;
    name?: string;
    email: string;
    role: 'user' | 'admin' | 'creator';
    createdAt: string;
    preferences?: Preferences;
    /** Gesetzt = Onboarding erledigt, auch bei „Überspringen". */
    preferencesSetAt?: string;
}

export interface ApiResponse<T> {
    data: T;
}

export type ItemType = 'Activity' | 'ScrapedEvent' | 'Beratung';

/** Kuratierte Taxonomie aus `GET /categories`; `key` steht in `tags`. */
export interface Category {
    _id: string;
    key: string;
    label: string;
    appliesTo: ('activity' | 'beratung')[];
    colorToken?: string;
}

export interface GeoPoint {
    type: 'Point';
    coordinates: [number, number];
}

/** Welcher der hinterlegten Wege der gewünschte ist — bestimmt die Reihenfolge
 *  im Kontaktblock der Detailseite. */
export type PreferredContact = 'phone' | 'email' | 'address';

export interface Contactable {
    phone?: string;
    email?: string;
    address?: string;
    preferredContact?: PreferredContact;
}

export interface Activity extends Contactable {
    _id: string;
    title: string;
    description: string;
    image: string;
    date: string;
    price: number;
    tags: string[];
    availableLanguages: string[];
    targetAudience: string[];
    location: GeoPoint;
    userId: PopulatedUser;
    createdAt: string;
    updatedAt: string;
}

export interface TimeSlot {
    open: number;
    close: number;
}

export interface BeratungDocument {
    _id: string;
    title: string;
    /** Kein Zugriffstoken — der Bucket ist privat, geladen wird über den
     *  Redirect auf eine presigned URL. Steht hier, weil der Bearbeiten-Pfad
     *  die Dokumente unverändert zurückschicken muss (sonst gelten sie beim
     *  PUT als verwaist und werden aus S3 gelöscht). */
    s3Key: string;
    mimeType: string;
    uploadedAt?: string;
}

/** Ein Anwendungsfall der Stelle (z.B. „Grundsicherung") samt Anträgen. */
export interface BeratungService {
    _id: string;
    name: string;
    documents: BeratungDocument[];
}

export interface Beratung extends Contactable {
    _id: string;
    title: string;
    description: string;
    image: string;
    /** Wochentag → Zeitfenster in Minuten seit Mitternacht; leer = geschlossen. */
    openingHours?: Record<string, TimeSlot[]>;
    services?: BeratungService[];
    location: GeoPoint;
    tags: string[];
    userId: PopulatedUser;
    availableLanguages: string[];
    targetAudience: string[];
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
    availableLanguages: string[];
    targetAudience: string[];
    /** Nachtraeglich geokodiert — nicht jeder Veranstaltungsort loest auf. */
    location?: GeoPoint | null;
}

/** Seitenweise Antwort von `GET /events`. */
export interface EventsPage {
    events: ScrapedEvent[];
    total: number;
    page: number;
    pageSize: number;
}

/** Geschlossene Filterlisten aus `GET /vocabulary` (Backend-Konstanten). */
export interface FilterVocabulary {
    languages: { key: string; label: string }[];
    audiences: { key: string; label: string }[];
}

/** Notfallnummer, serverseitig **vor** dem Modell erkannt. */
export interface Hotline {
    label: string;
    number: string;
    hint: string;
}

/** Antwort von `POST /chat`. `handoff`, `disclaimer` und `urgent` sind Pflicht —
 *  die UI kann den menschlichen Ausweg damit nicht versehentlich weglassen. */
export interface ChatReply {
    text: string;
    /** `itemType` bestimmt das Linkziel: Beratung → Detailseite, Event → Angebot. */
    matches: {
        id: string;
        title: string;
        category: string;
        itemType: 'Beratung' | 'ScrapedEvent';
    }[];
    handoff: { label: string; hint: string };
    disclaimer: string | null;
    urgent: Hotline[] | null;
}

/** Ein Beitrag im Verlauf. Bot-Turns tragen die ganze Antwort, nicht nur Text.
 *  Dieselbe Form liefert `GET /chat/history` (nur eingeloggt). */
export type ChatTurn =
    | { role: 'user'; text: string }
    | { role: 'bot'; reply: ChatReply };
