import { useEffect, useRef } from 'react';
import { Map, Marker, Popup } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_PUBLIC_MAPBOX_TOKEN;

const INITIAL_CENTER: [number, number] = [9.51667, 51.3166]; // Kassel
const INITIAL_ZOOM = 11;

export type MapMarker = {
    id: string;
    lng: number;
    lat: number;
    title: string;
    /** Ziel des Popup-Links — die Detailseite des Angebots. */
    href: string;
};

interface MapViewProps {
    /** Ohne Angabe: Übersicht über Kassel, ohne einzelnen Marker. */
    center?: [number, number];
    zoom?: number;
    /** Übersichtskarte: ein Marker pro Angebot, mit Popup. */
    markers?: MapMarker[];
}

const MapView = ({ center, zoom, markers }: MapViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const markerRefs = useRef<Marker[]>([]);

    // Die Karte wird genau einmal gebaut; alles Weitere laeuft ueber die
    // Effects darunter.
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new Map({
            accessToken: MAPBOX_TOKEN,
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: center ?? INITIAL_CENTER,
            zoom: zoom ?? (center ? 14 : INITIAL_ZOOM),
        });
        mapRef.current = map;
        map.once('load', () => map.resize()); // ponytail: nudge size after grid settles on SPA nav

        return () => {
            map.remove();
            mapRef.current = null;
            markerRefs.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ein Wechsel des Mittelpunkts bewegt jetzt auch die Karte — bisher lief
    // `center` ins Leere, weil der Init-Effect nur einmal feuerte.
    const lng = center?.[0];
    const lat = center?.[1];
    useEffect(() => {
        const map = mapRef.current;
        if (!map || lng === undefined || lat === undefined) return;
        map.flyTo({ center: [lng, lat], zoom: zoom ?? 14 });
    }, [lng, lat, zoom]);

    // Detailseiten uebergeben nur `center` und wollen genau einen Marker;
    // die Uebersichtskarte setzt ihre Marker unten selbst.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || markers || lng === undefined || lat === undefined) return;
        const marker = new Marker().setLngLat([lng, lat]).addTo(map);
        return () => {
            marker.remove();
        };
    }, [lng, lat, markers]);

    // ponytail: bei jeder Aenderung alle Marker neu setzen statt zu diffen —
    // bei Kassel-Groessenordnung nicht messbar. Clustering erst, wenn es ruckelt.
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !markers) return;
        markerRefs.current.forEach((m) => m.remove());
        markerRefs.current = markers.map((m) =>
            new Marker()
                .setLngLat([m.lng, m.lat])
                .setPopup(
                    new Popup({ offset: 24 }).setHTML(
                        // Kein React-Portal: Mapbox-Popups leben ausserhalb des
                        // React-Baums. Escaping deshalb von Hand.
                        `<a href="${m.href}" class="text-sm underline">${escapeHtml(
                            m.title,
                        )}</a>`,
                    ),
                )
                .addTo(map),
        );
    }, [markers]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

/** Titel kommen aus Nutzereingaben und landen als HTML im Popup. */
const escapeHtml = (s: string) =>
    s.replace(
        /[&<>"']/g,
        (c) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[c]!,
    );

export default MapView;
