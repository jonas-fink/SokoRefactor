import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AiOutlineArrowLeft, AiOutlineArrowRight } from 'react-icons/ai';
import { api } from '../utils/api';
import { BERATUNG_CATEGORIES, CATEGORY_ICONS } from './Beratung';
import type { Beratung } from '../types';

const BeratungKategorie = () => {
    const { key = '' } = useParams();
    const navigate = useNavigate();
    const [beratungen, setBeratungen] = useState<Beratung[]>([]);
    const [error, setError] = useState('');

    const meta = BERATUNG_CATEGORIES.find((c) => c.key === key);

    useEffect(() => {
        api.get<Beratung[]>(`/beratungen?tags=${key}`)
            .then(setBeratungen)
            .catch(() => setError('Angebote konnten nicht geladen werden'));
    }, [key]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-4 items-center">
                <button
                    className="card bg-surface p-2 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                <span className={meta?.accent}>{CATEGORY_ICONS[key]}</span>
                <h2 className="text-2xl font-bold">
                    {meta?.name ?? 'Beratung'}
                </h2>
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
                        <AiOutlineArrowRight size={24} />
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BeratungKategorie;
