// Nominatim (OpenStreetMap) — kostenlos, kein API-Key.
// Serverseitige Fassung von `soko-client/src/utils/geocode.ts`. Einziger
// Unterschied: der User-Agent muss hier von Hand gesetzt werden — die
// Nutzungsbedingungen von Nominatim verlangen ihn, und es gibt keinen
// Browser, der ihn mitschickt.

export type GeocodeResult = {
    label: string;
    lng: number;
    lat: number;
};

export async function geocode(address: string): Promise<GeocodeResult | null> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'de');

    const res = await fetch(url, {
        headers: {
            'Accept-Language': 'de',
            'User-Agent': 'soko-geocoder',
        },
    });
    if (!res.ok) throw new Error(`Geocoding fehlgeschlagen: ${res.status}`);

    const [hit] = (await res.json()) as Array<{
        display_name: string;
        lon: string;
        lat: string;
    }>;
    if (!hit) return null;

    return {
        label: hit.display_name,
        lng: Number(hit.lon),
        lat: Number(hit.lat),
    };
}
