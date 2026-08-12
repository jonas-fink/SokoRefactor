import { useEffect, useState } from 'react';
import { AiOutlineArrowRight } from 'react-icons/ai';
import { Link } from 'react-router';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';
import { CATEGORY_META } from '../categoryMeta';

import type { Category } from '../types';

const Events = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get<Category[]>('/categories?appliesTo=activity')
            .then(setCategories)
            .catch(() => setError('Kategorien konnten nicht geladen werden'));
    }, []);

    return (
        <div className="flex flex-col gap-6 md:max-w-6xl mx-auto md:p-8 pb-3">
            <PageHeader title="Events & Angebote" />
            <div className="flex flex-col gap-3">
                <h3 className="text-xl">Kategorien</h3>
                {error && <p className="text-error">{error}</p>}
                {categories.map((c) => {
                    const meta = CATEGORY_META[c.key];
                    return (
                        <Link
                            key={c.key}
                            to={`/events/${c.key}`}
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

export default Events;
