import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AiOutlineArrowLeft, AiOutlineArrowRight } from 'react-icons/ai';
import { api } from '../utils/api';
import { CATEGORY_META } from '../categoryMeta';
import type { Beratung, Category } from '../types';

const BeratungKategorie = () => {
    const { key = '' } = useParams();
    const navigate = useNavigate();
    const [beratungen, setBeratungen] = useState<Beratung[]>([]);
    const [label, setLabel] = useState('Beratung');
    const [error, setError] = useState('');

    const meta = CATEGORY_META[key];

    useEffect(() => {
        api.get<Beratung[]>(`/beratungen?tags=${key}`)
            .then(setBeratungen)
            .catch(() => setError('Angebote konnten nicht geladen werden'));
        // Label kommt aus der Taxonomie, nicht aus einer zweiten lokalen Liste.
        api.get<Category[]>('/categories?appliesTo=beratung')
            .then((cats) =>
                setLabel(cats.find((c) => c.key === key)?.label ?? 'Beratung'),
            )
            .catch(() => setLabel('Beratung'));
    }, [key]);

    return (
        <div className="flex flex-col gap-6 md:max-w-6xl mx-auto">
            <div className="flex gap-4 items-center">
                <button
                    className="card bg-surface p-2 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                <span className={meta?.accent}>{meta?.icon}</span>
                <h2 className="text-2xl font-bold">{label}</h2>
            </div>
            {meta && <p className="text-ink-soft">{meta.description}</p>}

            {error && <p className="text-error">{error}</p>}
            {!error && beratungen.length === 0 && (
                <p className="text-ink-mute">
                    Für diesen Bereich sind noch keine Angebote hinterlegt.
                </p>
            )}

            <div className="flex flex-col gap-3">
                {beratungen.map((b) => (
                    <Link
                        key={b._id}
                        to={`/beratung/detail/${b._id}`}
                        className="flex justify-between card items-center p-4"
                    >
                        <div>
                            <h3 className="font-bold">{b.title}</h3>
                            <p className="line-clamp-2 md:text-sm text-xs text-ink-soft">
                                {b.description}
                            </p>
                        </div>
                        <AiOutlineArrowRight size={24} className="shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BeratungKategorie;
