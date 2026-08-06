import {
    AiOutlineArrowLeft,
    AiOutlineArrowRight,
    AiOutlineCreditCard,
    AiOutlineHeart,
    AiOutlineLock,
} from 'react-icons/ai';
import { useNavigate } from 'react-router';
import { PiHouseLine, PiGlobeSimple } from 'react-icons/pi';
import { MdOutlineFamilyRestroom } from 'react-icons/md';
import { Link } from 'react-router';

import type { ReactNode } from 'react';

// Icons bleiben im Client. In Phase 7 kommt die Kategorie-Liste aus
// GET /categories?appliesTo=beratung — diese Map bleibt dann bestehen.
export const CATEGORY_ICONS: Record<string, ReactNode> = {
    behoerden: <PiHouseLine size={24} />,
    asyl: <PiGlobeSimple size={24} />,
    familie: <MdOutlineFamilyRestroom size={24} />,
    gesundheit: <AiOutlineHeart size={24} />,
    finanzen: <AiOutlineCreditCard size={24} />,
};

// ponytail: cat-asyl gibt es als Token erst ab Phase 7 — bis dahin ink.
export const BERATUNG_CATEGORIES = [
    {
        key: 'behoerden',
        name: 'Behörden & Ämter',
        description: 'Anträge, Formulare, Termine',
        accent: 'text-cat-behoerden',
    },
    {
        key: 'asyl',
        name: 'Asyl & Migration',
        description: 'Aufenthalt, Sprache, Ankommen',
        accent: 'text-ink',
    },
    {
        key: 'familie',
        name: 'Familien & Kinder',
        description: 'Erziehung, Kita, Alltag',
        accent: 'text-cat-familie',
    },
    {
        key: 'gesundheit',
        name: 'Sucht & Gesundheit',
        description: 'Vertraulich, ohne Urteil',
        accent: 'text-cat-gesundheit',
    },
    {
        key: 'finanzen',
        name: 'Finanzen & Schulden',
        description: 'Budget, Schuldnerberatung',
        accent: 'text-cat-finanzen',
    },
];

const Beratung = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 items-center">
                <button
                    className="card bg-surface p-2 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold">Beratung & Hilfe</h2>
            </div>
            <div className="field flex gap-3 bg-ink text-primary-ink items-center p-3">
                <AiOutlineLock size={24} />
                <p>
                    Alle Angebote sind{' '}
                    <span className="font-bold">kostenlos</span> und{' '}
                    <span className="font-bold">vertraulich</span>. Auf Wunsch
                    auch anonym
                </p>
            </div>
            <div className="flex flex-col gap-3">
                <h3 className="text-xl">Lebensbereiche</h3>
                {BERATUNG_CATEGORIES.map((c) => (
                    <Link
                        key={c.key}
                        to={`/beratung/${c.key}`}
                        className="flex justify-between card items-center p-4"
                    >
                        <div className="flex items-center gap-4">
                            <span className={c.accent}>
                                {CATEGORY_ICONS[c.key]}
                            </span>
                            <div>
                                {' '}
                                <h3 className="font-bold">{c.name}</h3>
                                <p className="md:text-sm text-xs">
                                    {c.description}
                                </p>
                            </div>
                        </div>
                        <div>
                            <AiOutlineArrowRight size={24} />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Beratung;
