import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../utils/api';
import PageHeader from '../components/PageHeader';
import OfferCard from '../components/OfferCard';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '../context/auth-context';
import type { Activity } from '../types';

/**
 * Was der eingeloggte Creator selbst erstellt hat — der einzige Ort, an dem
 * eigene Angebote wiederzufinden sind, ohne die Detailseite zu kennen.
 *
 * ponytail: gefiltert wird im Client. Activities sind wenige und unpaginiert
 * (siehe EventKategorie), ein `?mine=1` im Backend lohnt erst, wenn die Liste
 * real gross wird.
 */
const MeineAngebote = () => {
    const { user } = useAuth();
    const [angebote, setAngebote] = useState<Activity[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        api.get<Activity[]>('/activities')
            // Das populierte Feld heisst `_id`, nicht `id` — wie in AngebotDetail.
            .then((all) => setAngebote(all.filter((a) => a.userId?._id === user.id)))
            .catch(() => setError('Angebote konnten nicht geladen werden'));
    }, [user]);

    return (
        <div className="mx-auto flex flex-col gap-6 pb-3 md:max-w-6xl md:p-8">
            <PageHeader
                title="Meine Angebote"
                subtitle="Was du erstellt hast — nächster Termin zuerst"
            />

            {error && <p className="text-error">{error}</p>}

            {!error && angebote?.length === 0 && (
                <p className="text-ink-mute">
                    Du hast noch keine Angebote erstellt.{' '}
                    <Link to="/erstellen" className="text-primary underline">
                        Jetzt eins anlegen
                    </Link>
                    .
                </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {angebote?.map((a) => (
                    // Das Raster streckt die Zelle, die Karte darin aber nicht:
                    // ohne `flex-1` auf der Karte haengt der Bearbeiten-Link je
                    // nach Titel- und Textlaenge auf anderer Hoehe.
                    <div
                        key={a._id}
                        className="flex h-full flex-col gap-2 [&>.card]:flex-1"
                    >
                        <OfferCard
                            itemType="Activity"
                            id={a._id}
                            title={a.title}
                            description={a.description}
                            image={a.image}
                            dateLabel={formatDate(a.date)}
                        />
                        <Link
                            to={`/erstellen/aktivitaet/${a._id}`}
                            className="text-ink-mute self-start text-sm underline"
                        >
                            Bearbeiten
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MeineAngebote;
