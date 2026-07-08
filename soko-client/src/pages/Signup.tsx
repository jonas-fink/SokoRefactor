import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { signupSchema, type RegisterFormData } from '../schemas/authSchemas';
import { useAuth } from '../context/auth-context';

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
            navigate('/');
        } catch {
            setError('root', { message: 'Could not create account' });
        }
    };
    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl px-4 min-h-screen mx-auto mt-16">
            <div className="flex flex-col items-center gap-2">
                <h1 className="font-display text-5xl text-ink">
                    Erstelle deinen Account
                </h1>
                <p className="font-sans text-ink-mute">
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
                            <label
                                htmlFor="name"
                                className="text-md text-ink-soft cursor-pointer hover:text-ink"
                            >
                                NAME
                            </label>
                            <input
                                type="text"
                                id="name"
                                {...register('name')}
                                placeholder="Jane Doe"
                                className="border border-line rounded-control p-4 focus:outline-none focus:border-primary bg-transparent"
                            />
                            {errors.name && (
                                <p className="text-error text-xs">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="email"
                                className="text-md text-ink-soft cursor-pointer hover:text-ink"
                            >
                                E-MAIL
                            </label>
                            <input
                                type="email"
                                id="email"
                                {...register('email')}
                                placeholder="you@example.com"
                                className="border border-line rounded-control p-4 focus:outline-none focus:border-primary bg-transparent"
                                required
                            />
                            {errors.email && (
                                <p className="text-error text-xs">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="password"
                                className="text-md text-ink-soft cursor-pointer hover:text-ink"
                            >
                                PASSWORD
                            </label>
                            <input
                                type="password"
                                id="password"
                                {...register('password')}
                                placeholder="**********"
                                className="border border-line rounded-control p-4 focus:outline-none focus:border-primary bg-transparent"
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
