import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { loginSchema, type LoginFormData } from '../schemas/authSchemas';
import { useAuth } from '../context/auth-context';
import Logo from '../assets/logo.png';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

    const onSubmit = async (data: LoginFormData) => {
        try {
            await login(data);
            navigate('/');
        } catch {
            setError('root', { message: 'E-Mail oder Passwort ungültig' });
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full max-w-2xl px-4 justify-center items-center min-h-screen mx-auto">
            <div className="flex flex-col justify-center items-center gap-2">
                <img src={Logo} width={300} height={300} />
                <h1 className="font-display text-5xl text-ink">
                    Willkommen bei Soko
                </h1>
                <p className="font-sans text-ink-mute">
                    Dein sozialer Kompass für Angebote, Veranstaltungen und
                    Beratung in deiner Nähe.
                </p>
            </div>
            <div className="bg-surface w-full p-2 rounded-card border border-line hover:shadow-float">
                <div className="flex flex-col justify-center items-center">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 w-full p-8"
                    >
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
                                PASSWORT
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
                                {isSubmitting ? 'Log in...' : 'Anmelden'}
                            </button>
                        </div>
                    </form>
                    <div className="w-full flex flex-col gap-8">
                        <p className="text-center text-sm text-ink-mute">
                            Neu hier?{' '}
                            <Link
                                to="/signup"
                                className="text-primary font-bold hover:underline cursor-pointer text-md"
                            >
                                Konto erstellen
                            </Link>
                        </p>
                        <Link to="/" className="btn-secondary w-full">
                            Ohne Konto umschauen
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
