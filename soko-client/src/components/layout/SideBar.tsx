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
        <div className="flex flex-row justify-around gap-2 border-t border-line bg-surface p-3 h-full md:flex-col md:justify-start md:gap-8 md:border-t-0 md:p-8">
            <div className="hidden items-center md:flex">
                <img src={mainLogo} width={88} height={88} />
                <h1 className="text-2xl">Soko</h1>
            </div>
            <nav className="flex flex-row justify-around gap-2 w-full md:flex-col md:justify-start">
                <NavLink to="/" className={navClass}>
                    <AiOutlineCompass size={24} />
                    <span className="hidden md:inline">Entdecken</span>
                </NavLink>
                <NavLink to="/beratung" className={navClass}>
                    <AiOutlineNotification size={24} />
                    <span className="hidden md:inline">Beratung & Hilfe</span>
                </NavLink>
                <NavLink to="/erleben" className={navClass}>
                    <MdOutlineMap size={24} />
                    <span className="hidden md:inline">Events</span>
                </NavLink>
                <NavLink to="/library" className={navClass}>
                    <MdOutlineBookmark size={24} />
                    <span className="hidden md:inline">Sammlung</span>
                </NavLink>
                {user && (
                    <NavLink to="/profile" className={navClass}>
                        <RxAvatar size={24} />
                        <span className="hidden md:inline">Profil</span>
                    </NavLink>
                )}
            </nav>
        </div>
    );
};

export default SideBar;
