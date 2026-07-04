import { useEffect, useRef } from 'react';
import { Map } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_PUBLIC_MAPBOX_TOKEN;

// lift to props when Activity/Response land
const INITIAL_CENTER: [number, number] = [9.51667, 51.3166]; // Nairobi
const INITIAL_ZOOM = 11;

const MapView = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<Map | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new Map({
            accessToken: MAPBOX_TOKEN,
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: INITIAL_CENTER,
            zoom: INITIAL_ZOOM,
        });
        mapRef.current = map;
        map.once('load', () => map.resize()); // ponytail: nudge size after grid settles on SPA nav

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default MapView;
