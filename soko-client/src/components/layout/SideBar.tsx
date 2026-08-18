import { NavLink } from 'react-router';
import Logo from '../Logo';
import { AiOutlineCompass } from 'react-icons/ai';
import { MdOutlineMap, MdOutlineBookmark } from 'react-icons/md';
import { useAuth, canCreate } from '../../context/auth-context';
import { RxAvatar } from 'react-icons/rx';
import { AiOutlinePlusCircle } from 'react-icons/ai';

const SideBar = () => {
    const { user } = useAuth();

    /**
     * Auf Mobile sind die Labels ausgeblendet — der Aktiv-Zustand haengt dort
     * allein am Icon. `[&>svg]:size-*` ueberschreibt das `size={24}`-Attribut
     * der react-icons (CSS schlaegt Praesentationsattribut), also wachsen die
     * Icons ohne Zutun der einzelnen Eintraege. Ab `md` sind die Labels da,
     * dort bleibt die Groesse konstant.
     */
    const navClass = ({
        isActive,
    }: {
        isActive: boolean;
    }) => `flex items-center gap-[11px] px-3 py-[11px] rounded-xl text-md transition-all ${
        isActive
            ? 'font-semibold bg-primary-soft text-primary [&>svg]:size-8 md:[&>svg]:size-6'
            : 'text-ink-soft hover:text-primary [&>svg]:size-6'
    }
`;
    return (
        <div className="flex flex-row justify-around gap-2 border-t border-line bg-linear-to-br from-surface/85 via-surface/60 to-surface/30 backdrop-blur-xl p-3 h-full md:flex-col md:justify-start md:gap-8 md:border-t-0 md:p-8 z-10">
            <div className="hidden items-center md:flex">
                <Logo width={140} />
            </div>
            <nav className="flex flex-row justify-around gap-2 w-full md:flex-col md:justify-start">
                {/* `end`: ohne das matcht "/" jede Route und Entdecken waere
                    immer aktiv. */}
                <NavLink to="/" end className={navClass}>
                    <AiOutlineCompass size={24} />
                    <span className="hidden md:inline">Entdecken</span>
                </NavLink>
                {/* Beratung und Events stehen weiter auf der Startseite und in
                    den Kategorien — nur der Nav-Eintrag ist raus. */}
                <NavLink to="/karte" className={navClass}>
                    <MdOutlineMap size={24} />
                    <span className="hidden md:inline">In deiner Nähe</span>
                </NavLink>
                <NavLink to="/library" className={navClass}>
                    <MdOutlineBookmark size={24} />
                    <span className="hidden md:inline">Sammlung</span>
                </NavLink>
                {canCreate(user) && (
                    <NavLink to="/erstellen" className={navClass}>
                        <AiOutlinePlusCircle size={24} />
                        <span className="hidden md:inline">Erstellen</span>
                    </NavLink>
                )}
                {user && (
                    <NavLink to="/profile" className={navClass}>
                        <RxAvatar size={24} />
                        <span className="hidden md:inline">Profil</span>
                    </NavLink>
                )}
            </nav>
            {/* Auf Mobile trägt die untere Leiste nur die Hauptnavigation. */}
            <NavLink
                to="/datenschutz"
                className="mt-auto hidden text-sm text-ink-mute hover:text-ink md:inline"
            >
                Datenschutz
            </NavLink>
        </div>
    );
};

export default SideBar;
