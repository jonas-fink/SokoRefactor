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

const beratungCategory = [
    {
        name: 'Behörden & Ämter',
        description: 'Anträge, Formulare, Termine',
        icon: <PiHouseLine size={24} />,
    },
    {
        name: 'Asyl & Migration',
        description: 'Aufenthalt, Sprache, Ankommen',
        icon: <PiGlobeSimple size={24} />,
    },
    {
        name: 'Familien & Kinder',
        description: 'Erziehung, Kita, Alltag',
        icon: <MdOutlineFamilyRestroom size={24} />,
    },
    {
        name: 'Sucht & Gesundheit',
        description: 'Vertraulich, ohne Urteil',
        icon: <AiOutlineHeart size={24} />,
    },
    {
        name: 'Finanzen & Schulden',
        description: 'Budget, Schuldnerberatung',
        icon: <AiOutlineCreditCard size={24} />,
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
                {beratungCategory.map((c) => (
                    <div className="flex justify-between card items-center p-4">
                        <div key={c.name} className="flex items-center gap-4">
                            {c.icon}
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
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Beratung;
