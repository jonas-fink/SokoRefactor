import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import {
    activityFormSchema,
    type ActivityFormData,
} from '../schemas/activitySchema';
import { api } from '../utils/api';
import { geocode } from '../utils/geocode';

const labelClass = 'text-md text-ink-soft cursor-pointer hover:text-ink';

const Erstellen = () => {
    const navigate = useNavigate();
    const imageRef = useRef<HTMLInputElement>(null);
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ActivityFormData>({
        resolver: zodResolver(activityFormSchema),
        defaultValues: { price: 0, lng: 9.4797, lat: 51.3127 },
    });

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
        form.append(
            'tags',
            JSON.stringify(
                data.tags
                    ? data.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                    : [],
            ),
        );
        const image = imageRef.current?.files?.[0];
        if (image) form.append('image', image);

        try {
            await api.upload('/activities', form);
            navigate('/erleben');
        } catch (e) {
            setError('root', {
                message:
                    e instanceof Error ? e.message : 'Konnte nicht speichern',
            });
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl px-4 min-h-screen mx-auto mb-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-5xl text-ink">
                    Event erstellen
                </h1>
                <p className="font-sans text-ink-mute">
                    Dein Angebot erscheint auf der Karte.
                </p>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-surface w-full p-8 rounded-card shadow-card flex flex-col gap-4"
            >
                <div className="flex flex-col gap-2">
                    <label htmlFor="title" className={labelClass}>
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
                    <label htmlFor="description" className={labelClass}>
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
                    <label htmlFor="date" className={labelClass}>
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
                    <label htmlFor="price" className={labelClass}>
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

                <div className="flex flex-col gap-2">
                    <label htmlFor="address" className={labelClass}>
                        ADRESSE
                    </label>
                    <input
                        id="address"
                        placeholder="z.B. Königsplatz 1, Kassel"
                        onBlur={onAddressBlur}
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
                    <label htmlFor="tags" className={labelClass}>
                        TAGS (komma-getrennt)
                    </label>
                    <input id="tags" {...register('tags')} className="field" />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="image" className={labelClass}>
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
        </div>
    );
};

export default Erstellen;
