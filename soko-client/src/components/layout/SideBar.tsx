import { NavLink } from 'react-router';
import mainLogo from '../../assets/logo.png';
import { AiOutlineCompass, AiOutlineNotification } from 'react-icons/ai';
import { MdOutlineMap, MdOutlineBookmark } from 'react-icons/md';
import { useAuth } from '../../context/auth-context';
import { RxAvatar } from 'react-icons/rx';

const SideBar = () => {
    const { user } = useAuth();

    const navClass = ({
        isActive,
    }: {
        isActive: boolean;
    }) => `flex items-center gap-[11px] px-3 py-[11px] rounded-xl text-md  ${
        isActive
            ? 'font-semibold bg-primary-soft text-primary'
            : 'text-ink-soft'
    }
`;
    return (
        <div className="flex flex-col p-8 gap-8 bg-surface h-full">
            <div className="flex items-center">
                <img src={mainLogo} width={88} height={88} />
                <h1 className="text-2xl">Soko</h1>
            </div>
            <div className="flex flex-col gap-2 justify-start">
                <NavLink to="/" className={navClass}>
                    <AiOutlineCompass size={24} /> Entdecken
                </NavLink>
                <NavLink to="/beratung" className={navClass}>
                    <AiOutlineNotification size={24} /> Beratung & Hilfe
                </NavLink>
                <NavLink to="/karte" className={navClass}>
                    <MdOutlineMap size={24} /> Karte
                </NavLink>
                <NavLink to="/library" className={navClass}>
                    <MdOutlineBookmark size={24} />
                    Sammlung
                </NavLink>
                {user && (
                    <div>
                        {' '}
                        <NavLink to="/profile" className={navClass}>
                            <RxAvatar size={24} /> Profil
                        </NavLink>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SideBar;
