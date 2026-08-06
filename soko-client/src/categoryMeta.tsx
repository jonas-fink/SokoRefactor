import type { ReactNode } from 'react';
import { AiOutlineCreditCard, AiOutlineHeart } from 'react-icons/ai';
import {
    PiHouseLine,
    PiGlobeSimple,
    PiTree,
    PiPalette,
    PiBooks,
    PiBasket,
    PiDotsThreeCircle,
} from 'react-icons/pi';
import {
    MdOutlineFamilyRestroom,
    MdOutlineSportsSoccer,
} from 'react-icons/md';

/**
 * Darstellung pro Kategorie-Key. Label und Reihenfolge kommen aus
 * `GET /categories?appliesTo=beratung` bzw. `?appliesTo=activity`;
 * Icon, Kurztext und Akzentklasse bleiben im Client — sie sind UI-Copy,
 * keine Daten. Die Keys sind ueber beide Bereiche hinweg eindeutig
 * (`familie` gilt fuer beide), deshalb genuegt eine Tabelle.
 * Die Klassennamen stehen ausgeschrieben, damit Tailwind sie findet.
 */
export const CATEGORY_META: Record<
    string,
    { icon: ReactNode; description: string; accent: string }
> = {
    behoerden: {
        icon: <PiHouseLine size={24} />,
        description: 'Anträge, Formulare, Termine',
        accent: 'text-cat-behoerden',
    },
    asyl: {
        icon: <PiGlobeSimple size={24} />,
        description: 'Aufenthalt, Sprache, Ankommen',
        accent: 'text-cat-asyl',
    },
    familie: {
        icon: <MdOutlineFamilyRestroom size={24} />,
        description: 'Erziehung, Kita, Alltag',
        accent: 'text-cat-familie',
    },
    gesundheit: {
        icon: <AiOutlineHeart size={24} />,
        description: 'Vertraulich, ohne Urteil',
        accent: 'text-cat-gesundheit',
    },
    finanzen: {
        icon: <AiOutlineCreditCard size={24} />,
        description: 'Budget, Schuldnerberatung',
        accent: 'text-cat-finanzen',
    },
    sport: {
        icon: <MdOutlineSportsSoccer size={24} />,
        description: 'Vereine, Kurse, Bewegung',
        accent: 'text-cat-sport',
    },
    natur: {
        icon: <PiTree size={24} />,
        description: 'Draußen, Garten, Ausflüge',
        accent: 'text-cat-natur',
    },
    kunst: {
        icon: <PiPalette size={24} />,
        description: 'Konzerte, Theater, Ausstellungen',
        accent: 'text-cat-kunst',
    },
    bildung: {
        icon: <PiBooks size={24} />,
        description: 'Kurse, Vorträge, Werkstätten',
        accent: 'text-cat-bildung',
    },
    markt: {
        icon: <PiBasket size={24} />,
        description: 'Märkte, Feste, Essen & Trinken',
        accent: 'text-cat-markt',
    },
    sonstiges: {
        icon: <PiDotsThreeCircle size={24} />,
        description: 'Alles, was sonst noch läuft',
        accent: 'text-cat-sonstiges',
    },
};
