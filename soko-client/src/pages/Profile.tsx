import { AiOutlineSetting } from 'react-icons/ai';
import { NavLink } from 'react-router';
import { useAuth } from '../context/auth-context';

const Profile = () => {
    const { user } = useAuth();

    const initials =
        user?.name
            ?.split(' ')
            .map((part) => part[0])
            .join('') ?? '';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="card text-3xl p-4 bg-primary">{initials}</div>
                <div>
                    {' '}
                    <h2 className="text-2xl">{user?.name}</h2>
                    <p>Kassel seit 2014</p>
                </div>
            </div>
            <div>
                <div className="w-full">
                    <NavLink to="/settings" className="flex field">
                        <AiOutlineSetting size={24} className="text-primary" />
                        Einstellungen
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default Profile;
