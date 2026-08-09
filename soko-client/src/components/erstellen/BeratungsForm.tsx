import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    WEEKDAYS,
    beratungFormSchema,
    emptyOpeningHours,
    toBusinessHours,
    splitList,
    type BeratungFormData,
} from '../../schemas/beratungSchema';
import { api } from '../../utils/api';
import { geocode } from '../../utils/geocode';

const BeratungsForm = () => {
    const imageRef = useRef<HTMLInputElement>(null);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<BeratungFormData>({
        resolver: zodResolver(beratungFormSchema),
        defaultValues: {
            lng: 9.4797,
            lat: 51.3127,
            openingHours: emptyOpeningHours,
        },
    });
    const navigate = useNavigate();

    // Die Adresse wird jetzt gespeichert *und* geokodiert — register liefert das
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

    const onSubmit = async (data: BeratungFormData) => {
        const form = new FormData();
        form.append('title', data.title);
        form.append('description', data.description);
        form.append(
            'openingHours',
            JSON.stringify(toBusinessHours(data.openingHours)),
        );
        form.append(
            'location',
            JSON.stringify({
                type: 'Point',
                coordinates: [data.lng, data.lat],
            }),
        );
        form.append('tags', JSON.stringify(splitList(data.tags)));
        if (data.phone) form.append('phone', data.phone);
        if (data.address) form.append('address', data.address);
        form.append(
            'services',
            JSON.stringify(splitList(data.services).map((name) => ({ name }))),
        );
        const image = imageRef.current?.files?.[0];
        if (image) form.append('image', image);

        try {
            await api.upload('/beratungen', form);
            navigate('/beratung');
        } catch (e) {
            setError('root', {
                message:
                    e instanceof Error ? e.message : 'Konnte nicht speichern',
            });
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-surface w-full p-8 rounded-card shadow-card flex flex-col gap-4"
        >
            <div className="flex flex-col gap-2">
                <label htmlFor="title" className="label">
                    TITEL
                </label>
                <input id="title" {...register('title')} className="field" />
                {errors.title && (
                    <p className="text-error text-xs">{errors.title.message}</p>
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

            <fieldset className="flex flex-col gap-2">
                <legend className="label">
                    ÖFFNUNGSZEITEN (leer = geschlossen)
                </legend>
                {WEEKDAYS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 sm:gap-3">
                        <label
                            htmlFor={`${key}-open`}
                            className="w-20 shrink-0 text-sm sm:w-28"
                        >
                            {label}
                        </label>
                        <input
                            type="time"
                            id={`${key}-open`}
                            {...register(`openingHours.${key}.open`)}
                            className="field w-full min-w-0 px-2 sm:px-3.5"
                        />
                        <span className="text-ink-mute">–</span>
                        <input
                            type="time"
                            aria-label={`${label} Schließzeit`}
                            {...register(`openingHours.${key}.close`)}
                            className="field w-full min-w-0 px-2 sm:px-3.5"
                        />
                    </div>
                ))}
                {WEEKDAYS.map(
                    ({ key, label }) =>
                        errors.openingHours?.[key] && (
                            <p key={key} className="text-error text-xs">
                                {label}: {errors.openingHours[key]?.message}
                            </p>
                        ),
                )}
            </fieldset>

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

            <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="label">
                    TELEFON
                </label>
                <input
                    type="tel"
                    id="phone"
                    placeholder="z.B. 0561 787-0"
                    {...register('phone')}
                    className="field"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="services" className="label">
                    ANGEBOTE (komma-getrennt)
                </label>
                <input
                    id="services"
                    placeholder="z.B. Grundsicherung, Wohngeld"
                    {...register('services')}
                    className="field"
                />
                <p className="text-ink-mute text-xs">
                    Anträge lassen sich nach dem Speichern je Angebot hochladen.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="tags" className="label">
                    TAGS (komma-getrennt)
                </label>
                <input id="tags" {...register('tags')} className="field" />
            </div>

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
                {isSubmitting ? 'Wird gespeichert...' : 'Veröffentlichen'}
            </button>
        </form>
    );
};

export default BeratungsForm;
