import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import {
    activityFormSchema,
    type ActivityFormData,
} from '../schemas/activitySchema';
import { api } from '../utils/api';

const field =
    'border border-line rounded-control p-4 focus:outline-none focus:border-primary bg-transparent';
const labelClass = 'text-md text-ink-soft cursor-pointer hover:text-ink';

const Erstellen = () => {
    const navigate = useNavigate();
    const imageRef = useRef<HTMLInputElement>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ActivityFormData>({
        resolver: zodResolver(activityFormSchema),
        // ponytail: Kassel als Default, Map-Picker wenn Koordinaten-Tippen nervt
        defaultValues: { price: 0, lng: 9.4797, lat: 51.3127 },
    });

    const onSubmit = async (data: ActivityFormData) => {
        const form = new FormData();
        form.append('title', data.title);
        form.append('description', data.description);
        form.append('date', new Date(data.date).toISOString());
        form.append('price', String(data.price));
        form.append(
            'location',
            JSON.stringify({ type: 'Point', coordinates: [data.lng, data.lat] }),
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
        <div className="flex flex-col gap-8 w-full max-w-2xl px-4 min-h-screen mx-auto mt-16">
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
                    <input id="title" {...register('title')} className={field} />
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
                        className={field}
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
                        className={field}
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
                        {...register('price', { valueAsNumber: true })}
                        className={field}
                    />
                    {errors.price && (
                        <p className="text-error text-xs">
                            {errors.price.message}
                        </p>
                    )}
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="lng" className={labelClass}>
                            LÄNGENGRAD
                        </label>
                        <input
                            type="number"
                            step="any"
                            id="lng"
                            {...register('lng', { valueAsNumber: true })}
                            className={field}
                        />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        <label htmlFor="lat" className={labelClass}>
                            BREITENGRAD
                        </label>
                        <input
                            type="number"
                            step="any"
                            id="lat"
                            {...register('lat', { valueAsNumber: true })}
                            className={field}
                        />
                    </div>
                </div>
                {(errors.lng || errors.lat) && (
                    <p className="text-error text-xs">Ungültige Koordinaten</p>
                )}

                <div className="flex flex-col gap-2">
                    <label htmlFor="tags" className={labelClass}>
                        TAGS (komma-getrennt)
                    </label>
                    <input id="tags" {...register('tags')} className={field} />
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
                        className={field}
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
                    className="btn-primary w-full"
                >
                    {isSubmitting ? 'Wird gespeichert...' : 'Veröffentlichen'}
                </button>
            </form>
        </div>
    );
};

export default Erstellen;
