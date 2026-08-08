import { useEffect, useState } from 'react';
import {
    AiOutlineArrowLeft,
    AiOutlineArrowRight,
    AiOutlineLock,
} from 'react-icons/ai';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { api } from '../utils/api';
import { CATEGORY_META } from '../categoryMeta';

import type { Category } from '../types';

const Beratung = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get<Category[]>('/categories?appliesTo=beratung')
            .then(setCategories)
            .catch(() =>
                setError('Lebensbereiche konnten nicht geladen werden'),
            );
    }, []);

    return (
        <div className="flex flex-col gap-6 md:max-w-6xl mx-auto md:p-8 pb-3">
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
                {error && <p className="text-error">{error}</p>}
                {categories.map((c) => {
                    const meta = CATEGORY_META[c.key];
                    return (
                        <Link
                            key={c.key}
                            to={`/beratung/${c.key}`}
                            className="flex justify-between card items-center p-4"
                        >
                            <div className="flex items-center gap-4">
                                <span className={meta?.accent ?? 'text-ink'}>
                                    {meta?.icon}
                                </span>
                                <div>
                                    <h3 className="font-bold">{c.label}</h3>
                                    {meta && (
                                        <p className="md:text-sm text-xs">
                                            {meta.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <AiOutlineArrowRight
                                    size={24}
                                    className="shrink-0"
                                />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default Beratung;
