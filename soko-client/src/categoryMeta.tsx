import type { ReactNode } from 'react';
import { AiOutlineCreditCard, AiOutlineHeart } from 'react-icons/ai';
import { PiHouseLine, PiGlobeSimple } from 'react-icons/pi';
import { MdOutlineFamilyRestroom } from 'react-icons/md';

/**
 * Darstellung pro Kategorie-Key. Label und Reihenfolge kommen aus
 * `GET /categories?appliesTo=beratung`; Icon, Kurztext und Akzentklasse
 * bleiben im Client — sie sind UI-Copy, keine Daten.
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
};
