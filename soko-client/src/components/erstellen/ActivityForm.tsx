import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    type ActivityFormData,
    activityFormSchema,
} from '../../schemas/activitySchema';
import { api } from '../../utils/api';
import { geocode } from '../../utils/geocode';
import { useCategories } from '../../hooks/useCategories';
import { useVocabulary } from '../../hooks/useVocabulary';
import ChipGroup from '../ChipGroup';
import ContactFields from './ContactFields';
import type { Activity } from '../../types';

/**
 * ISO-String → Wert für `<input type="datetime-local">`. `toISOString()` liefert
 * UTC; ohne das Herausrechnen des Offsets springt die angezeigte Uhrzeit beim
 * Bearbeiten um die Zeitzone daneben.
 */
const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
};

const ActivityForm = () => {
    // `:id` in der URL = Bearbeiten (siehe pages/Bearbeiten.tsx).
    const { id } = useParams();
    const [loadError, setLoadError] = useState('');
    // Das bestehende Bild muss beim Speichern mitgeschickt werden, wenn keine
    // neue Datei gewaehlt ist — sonst setzt das Zod-`default` im Backend den
    // Platzhalter und ueberschreibt das Bild.
    const currentImage = useRef<string | null>(null);
    const methods = useForm<ActivityFormData>({
        resolver: zodResolver(activityFormSchema),
        defaultValues: {
            price: 0,
            lng: 9.4797,
            lat: 51.3127,
            tags: [],
            availableLanguages: [],
            targetAudience: [],
            phone: '',
            email: '',
            address: '',
            preferredContact: '',
        },
    });
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        watch,
        reset,
        formState: { errors, isSubmitting },
        setError,
    } = methods;
    const imageRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!id) return;
        api.get<Activity>(`/activities/${id}`)
            .then((a) => {
                currentImage.current = a.image;
                reset({
                    title: a.title,
                    description: a.description,
                    date: toLocalInput(a.date),
                    price: a.price,
                    lng: a.location.coordinates[0],
                    lat: a.location.coordinates[1],
                    tags: a.tags,
                    availableLanguages: a.availableLanguages,
                    targetAudience: a.targetAudience,
                    phone: a.phone ?? '',
                    email: a.email ?? '',
                    address: a.address ?? '',
                    preferredContact: a.preferredContact ?? '',
                });
            })
            .catch(() => setLoadError('Angebot konnte nicht geladen werden'));
    }, [id, reset]);

    const { categories } = useCategories('activity');
    const { languages, audiences } = useVocabulary();
    const [tags, availableLanguages, targetAudience] = watch([
        'tags',
        'availableLanguages',
        'targetAudience',
    ]);

    type ChipField = 'tags' | 'availableLanguages' | 'targetAudience';
    const toggle = (field: ChipField, key: string) => {
        const current = getValues(field);
        setValue(
            field,
            current.includes(key)
                ? current.filter((v) => v !== key)
                : [...current, key],
        );
    };

    // Die Adresse wird gespeichert *und* geokodiert — register liefert das
    // eigene onBlur, das vor der Geocoder-Suche laufen muss.
    const addressField = register('address');

    const [geo, setGeo] = useState<{
        status: 'idle' | 'loading' | 'ok' | 'notfound' | 'error';
        label?: string;
    }>({ status: 'idle' });

    const onAddressBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const address = e.target.value.trim();
        if (!address) return setGeo({ status: 'idle' });
        setGeo({ status: 'loading' });
        try {
            const hit = await geocode(address);
            if (!hit) return setGeo({ status: 'notfound' });
            setValue('lng', hit.lng, { shouldValidate: true });
            setValue('lat', hit.lat, { shouldValidate: true });
            setGeo({ status: 'ok', label: hit.label });
        } catch {
            setGeo({ status: 'error' });
        }
    };

    const onSubmit = async (data: ActivityFormData) => {
        const form = new FormData();
        form.append('title', data.title);
        form.append('description', data.description);
        form.append('date', new Date(data.date).toISOString());
        form.append('price', String(data.price));
        form.append(
            'location',
            JSON.stringify({
                type: 'Point',
                coordinates: [data.lng, data.lat],
            }),
        );
        form.append('tags', JSON.stringify(data.tags));
        form.append(
            'availableLanguages',
            JSON.stringify(data.availableLanguages),
        );
        form.append('targetAudience', JSON.stringify(data.targetAudience));
        // Leere Kontaktfelder gar nicht erst mitschicken — das Backend wandelt
        // '' zwar in undefined um, aber weniger Feld ist weniger Ueberraschung.
        if (data.phone) form.append('phone', data.phone);
        if (data.email) form.append('email', data.email);
        if (data.address) form.append('address', data.address);
        if (data.preferredContact)
            form.append('preferredContact', data.preferredContact);
        const image = imageRef.current?.files?.[0];
        if (image) form.append('image', image);
        // Ohne neue Datei die bestehende URL mitschicken, sonst greift im
        // Backend das Platzhalter-`default` und das Bild ist weg.
        else if (currentImage.current)
            form.append('image', currentImage.current);

        try {
            if (id) {
                await api.upload(`/activities/${id}`, form, 'PUT');
                navigate(`/angebot/Activity/${id}`);
            } else {
                // Die Detailseite des frisch angelegten Angebots ist die
                // Erfolgsmeldung — die Liste zeigte nicht, ob es geklappt hat.
                const created = await api.upload<Activity>('/activities', form);
                navigate(`/angebot/Activity/${created._id}`);
            }
        } catch (e) {
            setError('root', {
                message:
                    e instanceof Error ? e.message : 'Konnte nicht speichern',
            });
        }
    };
    const addressBlock = (
        <div className="flex flex-col gap-2">
            <label htmlFor="address" className="label">
                ADRESSE
            </label>
            <input
                id="address"
                placeholder="z.B. Königsplatz 1, Kassel"
                {...addressField}
                onBlur={(e) => {
                    addressField.onBlur(e);
                    onAddressBlur(e);
                }}
                className="field"
            />
            {geo.status === 'loading' && (
                <p className="text-ink-mute text-xs">Suche Adresse…</p>
            )}
            {geo.status === 'ok' && (
                <p className="text-ink-soft text-xs">✓ {geo.label}</p>
            )}
            {geo.status === 'notfound' && (
                <p className="text-error text-xs">
                    Adresse nicht gefunden – bitte genauer eingeben.
                </p>
            )}
            {geo.status === 'error' && (
                <p className="text-error text-xs">
                    Adresssuche momentan nicht verfügbar.
                </p>
            )}
            {/* verstecktes lng/lat, gefüllt vom Geocoder */}
            <input
                type="hidden"
                {...register('lng', { valueAsNumber: true })}
            />
            <input
                type="hidden"
                {...register('lat', { valueAsNumber: true })}
            />
        </div>
    );

    if (loadError) return <p className="text-error py-8">{loadError}</p>;

    return (
        <FormProvider {...methods}>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-surface w-full p-8 rounded-card shadow-card flex flex-col gap-4"
            >
                {/* natives <details>: zugeklappt per Default, kein State, und
                    der Browser uebernimmt Tastatur und Screenreader. */}
                <details className="rounded-card border border-line p-4">
                    <summary className="label cursor-pointer">
                        Worauf du achten solltest
                    </summary>
                    <ul className="text-ink-soft mt-3 flex list-disc flex-col gap-2 pl-5 text-sm">
                        <li>
                            <b>Titel:</b> konkret statt werblich – „Sprachcafé
                            für Anfänger" sagt mehr als „Tolles Angebot".
                        </li>
                        <li>
                            <b>Beschreibung:</b> beantworte wer eingeladen ist,
                            was passiert und was mitzubringen ist.
                        </li>
                        <li>
                            <b>Bild:</b> nur Bilder, an denen du die Rechte
                            hast. Erkennbare Personen brauchen eine
                            Einwilligung.
                        </li>
                        <li>
                            <b>Adresse:</b> vollständig mit Hausnummer und Ort –
                            daraus entsteht der Punkt auf der Karte.
                        </li>
                        <li>
                            <b>Sprache und Zielgruppe:</b> nur setzen, was
                            wirklich zutrifft. Nichts auswählen heißt „für alle
                            sichtbar", nicht „für niemanden".
                        </li>
                        <li>
                            <b>Kontaktdaten</b> sind öffentlich sichtbar – nimm
                            eine Adresse, die du dafür nutzen möchtest.
                        </li>
                    </ul>
                </details>

                <div className="flex flex-col gap-2">
                    <label htmlFor="title" className="label">
                        TITEL
                    </label>
                    <input
                        id="title"
                        {...register('title')}
                        className="field"
                    />
                    {errors.title && (
                        <p className="text-error text-xs">
                            {errors.title.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="label">
                        BESCHREIBUNG
                    </label>
                    <textarea
                        id="description"
                        rows={4}
                        {...register('description')}
                        className="field"
                    />
                    {errors.description && (
                        <p className="text-error text-xs">
                            {errors.description.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="date" className="label">
                        DATUM
                    </label>
                    <input
                        type="datetime-local"
                        id="date"
                        {...register('date')}
                        className="field"
                    />
                    {errors.date && (
                        <p className="text-error text-xs">
                            {errors.date.message}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="price" className="label">
                        PREIS (€)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        id="price"
                        min="0"
                        {...register('price', { valueAsNumber: true })}
                        className="field"
                    />
                    {errors.price && (
                        <p className="text-error text-xs">
                            {errors.price.message}
                        </p>
                    )}
                </div>

                <ContactFields addressSlot={addressBlock} />

                <ChipGroup
                    legend="THEMEN"
                    options={categories}
                    selected={tags}
                    onToggle={(key) => toggle('tags', key)}
                />

                <ChipGroup
                    legend="SPRACHEN"
                    options={languages}
                    selected={availableLanguages}
                    onToggle={(key) => toggle('availableLanguages', key)}
                    hint="Nichts auswählen = keine Angabe; das Angebot bleibt in jedem Sprachfilter sichtbar."
                />

                <ChipGroup
                    legend="FÜR WEN"
                    options={audiences}
                    selected={targetAudience}
                    onToggle={(key) => toggle('targetAudience', key)}
                />

                <div className="flex flex-col gap-2">
                    <label htmlFor="image" className="label">
                        BILD
                    </label>
                    <input
                        type="file"
                        id="image"
                        ref={imageRef}
                        accept="image/*"
                        className="field"
                    />
                    {id && (
                        <p className="text-ink-mute text-xs">
                            Leer lassen behält das bisherige Bild.
                        </p>
                    )}
                </div>

                {errors.root && (
                    <p className="text-error text-xs text-center">
                        {errors.root.message}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full cursor-pointer"
                >
                    {isSubmitting
                        ? 'Wird gespeichert...'
                        : id
                          ? 'Speichern'
                          : 'Veröffentlichen'}
                </button>
            </form>
        </FormProvider>
    );
};

export default ActivityForm;
