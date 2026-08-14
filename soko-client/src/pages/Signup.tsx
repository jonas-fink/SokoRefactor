import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { signupSchema, type RegisterFormData } from '../schemas/authSchemas';
import { useAuth } from '../context/auth-context';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';

const SignupPage = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<RegisterFormData>({ resolver: zodResolver(signupSchema) });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await signup(data);
            // Nur nach der Registrierung ins Onboarding, nicht bei jedem Login.
            navigate('/willkommen');
        } catch {
            setError('root', { message: 'Could not create account' });
        }
    };
    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl p-4 min-h-screen mx-auto">
            <div className="flex flex-col items-center gap-2">
                <Logo width={280} />
                <p className="font-sans text-ink-mute text-center">
                    Tritt bei und Speichere deine Lieblinsevents oder plane
                    Termine bei Beratungsstellen
                </p>
            </div>
            <div className="bg-surface w-full p-2 rounded-card border border-line hover:shadow-float">
                <div className="flex flex-col w-full justify-center items-center">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 w-full p-8"
                    >
                        <div className="flex flex-col gap-2">
                            <label htmlFor="name" className="label text-md">
                                NAME
                            </label>
                            <input
                                type="text"
                                id="name"
                                autoComplete="name"
                                {...register('name')}
                                placeholder="Jane Doe"
                                className="field"
                            />
                            {errors.name && (
                                <p className="text-error text-xs">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label htmlFor="email" className="label text-md">
                                E-MAIL
                            </label>
                            <input
                                type="email"
                                id="email"
                                // Ohne autocomplete bieten Schluesselbund und
                                // Google-Manager nichts an — WCAG 2.2 SC 3.3.8.
                                autoComplete="email"
                                {...register('email')}
                                placeholder="you@example.com"
                                className="field"
                                required
                            />
                            {errors.email && (
                                <p className="text-error text-xs">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <PasswordField
                                label="PASSWORT"
                                id="password"
                                autoComplete="new-password"
                                {...register('password')}
                                placeholder="**********"
                                required
                            />
                            {errors.password && (
                                <p className="text-error text-xs">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {errors.root && (
                            <p className="text-error text-xs text-center">
                                {errors.root.message}
                            </p>
                        )}
                        <div className="flex justify-center pt-4">
                            {' '}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary w-full"
                            >
                                {isSubmitting
                                    ? 'registriert...'
                                    : 'Registrieren'}
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-sm text-ink-mute">
                        Schon Mitglied?{' '}
                        <Link
                            to="/login"
                            className="text-primary font-bold hover:underline cursor-pointer text-md"
                        >
                            Anmelden
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
