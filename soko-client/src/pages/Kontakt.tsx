import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, Link } from 'react-router';
import { feedbackSchema, type FeedbackFormData } from '../schemas/feedback';
import { api } from '../utils/api';

/**
 * Rückmeldungen landen in der Datenbank, nicht in einer Mail (`ARCHITEKTUR.md`
 * § 2.10). Bewusst eine Seite und kein Dialog: verlinkbar, teilbar, kein
 * Modalzustand.
 */
const Kontakt = () => {
    const { state } = useLocation();
    const [sent, setSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<FeedbackFormData>({ resolver: zodResolver(feedbackSchema) });

    const onSubmit = async (data: FeedbackFormData) => {
        try {
            // Die Seite, von der aus der Footer-Link geklickt wurde — der Footer
            // gibt sie als Router-State mit. Ohne den Klick bleibt sie leer.
            await api.post('/feedback', { ...data, path: state?.from });
            setSent(true);
        } catch {
            setError('root', {
                message: 'Konnte nicht gesendet werden. Bitte später nochmal.',
            });
        }
    };

    return (
        <div className="mx-auto flex w-full flex-col gap-6 p-8 md:max-w-3xl">
            <h1 className="text-3xl sm:text-4xl">Kontakt</h1>

            {sent ? (
                <div className="flex flex-col gap-4">
                    <p className="text-ink-soft">
                        Danke, deine Rückmeldung ist angekommen. Wenn du eine
                        E-Mail-Adresse hinterlassen hast, melden wir uns.
                    </p>
                    <Link to="/" className="btn-secondary self-start">
                        Zurück zur Startseite
                    </Link>
                </div>
            ) : (
                <>
                    <p className="text-ink-soft">
                        Fehlt ein Angebot, stimmt eine Angabe nicht, hakt etwas
                        in der App? Schreib es uns.
                    </p>
                    <p className="text-ink-soft">
                        Bitte{' '}
                        <strong>keine Namen, Adressen oder Aktenzeichen</strong>{' '}
                        — auch nicht von anderen. „Die Telefonnummer bei Stelle
                        X stimmt nicht" reicht völlig.
                    </p>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-2">
                            <label htmlFor="message" className="label">
                                Deine Nachricht
                            </label>
                            <textarea
                                id="message"
                                rows={8}
                                {...register('message')}
                                className="field resize-y"
                            />
                            {errors.message && (
                                <p className="text-error text-xs">
                                    {errors.message.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="label">
                                E-Mail (freiwillig)
                            </label>
                            <input
                                type="email"
                                id="email"
                                autoComplete="email"
                                {...register('email')}
                                placeholder="nur, wenn du eine Antwort möchtest"
                                className="field"
                            />
                            {errors.email && (
                                <p className="text-error text-xs">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {errors.root && (
                            <p className="text-error text-xs">
                                {errors.root.message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary self-start cursor-pointer"
                        >
                            {isSubmitting ? 'Wird gesendet…' : 'Absenden'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default Kontakt;
