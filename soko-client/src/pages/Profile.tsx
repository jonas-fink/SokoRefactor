import {
    AiOutlineLogout,
    AiOutlineMoon,
    AiOutlineSetting,
    AiOutlineSun,
} from 'react-icons/ai';
import { useState } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../context/auth-context';
import { formatDate } from '../utils/formatDate';

const Profile = () => {
    const { user, logout } = useAuth();

    // ponytail: kein ThemeContext — das DOM ist der State, gesetzt vom
    // Inline-Script in index.html. Nur diese Komponente schreibt ihn.
    const [dark, setDark] = useState(() =>
        document.documentElement.classList.contains('dark'),
    );

    const toggleTheme = () => {
        const next = !dark;
        document.documentElement.classList.toggle('dark', next);
        document.documentElement.style.colorScheme = next ? 'dark' : 'light';
        localStorage.setItem('soko:theme', next ? 'dark' : 'light');
        setDark(next);
    };

    const initials =
        user?.name
            ?.split(' ')
            .map((part) => part[0])
            .join('') ?? '';

    return (
        <div className="flex flex-col gap-4 mx-auto md:max-w-6xl md:p-8">
            <div className="flex gap-4 items-center">
                <div className="flex items-center justify-center rounded-full w-20 h-20 text-3xl p-4 bg-primary">
                    <p className="font-bold text-4xl">{initials}</p>
                </div>

                <div>
                    {' '}
                    <h2 className="text-2xl">{user?.name}</h2>
                    {user && (
                        <p>Mitlgied seit dem {formatDate(user.createdAt)}</p>
                    )}
                </div>
            </div>
            <div>
                <div className="flex w-full flex-col gap-3">
                    <NavLink to="/settings" className="flex field gap-3">
                        <AiOutlineSetting size={24} className="text-primary" />
                        Einstellungen
                    </NavLink>
                    <button
                        className="flex field gap-3 cursor-pointer items-center"
                        onClick={toggleTheme}
                        role="switch"
                        aria-checked={dark}
                    >
                        {dark ? (
                            <AiOutlineSun size={24} className="text-primary" />
                        ) : (
                            <AiOutlineMoon size={24} className="text-primary" />
                        )}
                        {dark ? 'Heller Modus' : 'Dunkler Modus'}
                    </button>
                    <button
                        className="flex field gap-3 cursor-pointer"
                        onClick={logout}
                    >
                        <AiOutlineLogout size={24} className="text-primary " />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
