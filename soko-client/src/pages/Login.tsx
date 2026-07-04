import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { loginSchema, type LoginFormData } from '../schemas/authSchemas';
import { useAuth } from '../context/AuthContext';
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
                <h1 className="font-display text-5xl text-text">
                    Willkommen bei Soko
                </h1>
                <p className="font-sans text-text-muted">
                    Dein sozialer Kompass für Angebote, Veranstaltungen und
                    Beratung in deiner Nähe.
                </p>
            </div>
            <div className="bg-surface w-full p-2 rounded-md border border-border-strong hover:shadow-glow">
                <div className="flex flex-col justify-center items-center">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-4 w-full p-8"
                    >
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="email"
                                className="text-md text-text-subtle cursor-pointer hover:text-text"
                            >
                                E-MAIL
                            </label>
                            <input
                                type="email"
                                id="email"
                                {...register('email')}
                                placeholder="you@example.com"
                                className="border border-border rounded-sm p-4 focus:outline-azure-soft bg-transparent font-mono"
                                required
                            />
                            {errors.email && (
                                <p className="text-danger text-xs">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="password"
                                className="text-md text-text-subtle cursor-pointer hover:text-text"
                            >
                                PASSWORT
                            </label>
                            <input
                                type="password"
                                id="password"
                                {...register('password')}
                                placeholder="**********"
                                className="border border-border rounded-sm p-4 focus:outline-azure-soft bg-transparent font-mono"
                                required
                            />
                            {errors.password && (
                                <p className="text-danger text-xs">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {errors.root && (
                            <p className="text-danger text-xs text-center">
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
                        <p className="text-center text-sm text-text-muted">
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
