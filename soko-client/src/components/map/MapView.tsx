import { useEffect, useRef } from 'react';
import {
    GeolocateControl,
    Map,
    Marker,
    NavigationControl,
    Popup,
} from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { directionsUrl } from '../../utils/directions';

const MAPBOX_TOKEN = import.meta.env.VITE_PUBLIC_MAPBOX_TOKEN;

const INITIAL_CENTER: [number, number] = [9.51667, 51.3166]; // Kassel
const INITIAL_ZOOM = 11;

export type MapMarker = {
    id: string;
    lng: number;
    lat: number;
    title: string;
    href: string;
};

interface MapViewProps {
    center?: [number, number];
    zoom?: number;
    markers?: MapMarker[];
    onGeolocate?: (lng: number, lat: number) => void;
    onLocateReady?: (trigger: () => void) => void;
}

const LOCALE = {
    'GeolocateControl.FindMyLocation': 'Meinen Standort zeigen',
    'GeolocateControl.LocationNotAvailable': 'Standort nicht verfügbar',
    'NavigationControl.ZoomIn': 'Vergrößern',
    'NavigationControl.ZoomOut': 'Verkleinern',
    'NavigationControl.ResetBearing': 'Norden ausrichten',
};

const MapView = ({
    center,
    zoom,
    markers,
    onGeolocate,
    onLocateReady,
}: MapViewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);
    const markerRefs = useRef<Marker[]>([]);
    const onGeolocateRef = useRef(onGeolocate);
    const onLocateReadyRef = useRef(onLocateReady);
    useEffect(() => {
        onGeolocateRef.current = onGeolocate;
        onLocateReadyRef.current = onLocateReady;
    });

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new Map({
            accessToken: MAPBOX_TOKEN,
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: center ?? INITIAL_CENTER,
            zoom: zoom ?? (center ? 14 : INITIAL_ZOOM),
            language: 'de',
            locale: LOCALE,
        });
        mapRef.current = map;
        map.once('load', () => map.resize());

        map.addControl(new NavigationControl({ showCompass: false }));

        const geolocate = new GeolocateControl({
            trackUserLocation: true,
            showUserHeading: true,
            positionOptions: { enableHighAccuracy: true },
        });
        map.addControl(geolocate);
        geolocate.on('geolocate', (e) =>
            onGeolocateRef.current?.(e.coords.longitude, e.coords.latitude),
        );

        onLocateReadyRef.current?.(() => geolocate.trigger());

        return () => {
            map.remove();
            mapRef.current = null;
            markerRefs.current = [];
        };
    }, []);

    const lng = center?.[0];
    const lat = center?.[1];
    useEffect(() => {
        const map = mapRef.current;
        if (!map || lng === undefined || lat === undefined) return;
        map.flyTo({ center: [lng, lat], zoom: zoom ?? 14 });
    }, [lng, lat, zoom]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || markers || lng === undefined || lat === undefined) return;
        const marker = new Marker().setLngLat([lng, lat]).addTo(map);
        return () => {
            marker.remove();
        };
    }, [lng, lat, markers]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !markers) return;
        markerRefs.current.forEach((m) => m.remove());
        markerRefs.current = markers.map((m) =>
            new Marker()
                .setLngLat([m.lng, m.lat])
                .setPopup(
                    new Popup({ offset: 24 }).setHTML(
                        `<a href="${m.href}" class="text-sm underline">${escapeHtml(
                            m.title,
                        )}</a>
                         <a href="${directionsUrl(m.lat, m.lng)}"
                            target="_blank" rel="noreferrer"
                            class="mt-1 block text-sm underline"
                            aria-label="Route nach ${escapeHtml(
                                m.title,
                            )} — öffnet die Karten-App">Route</a>`,
                    ),
                )
                .addTo(map),
        );
    }, [markers]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

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
