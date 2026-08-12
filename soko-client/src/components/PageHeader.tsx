import type { ReactNode } from 'react';
import { AiOutlineArrowLeft } from 'react-icons/ai';
import { useNavigate } from 'react-router';

type Props = {
    title: ReactNode;
    subtitle?: ReactNode;
    /** Kategorie-Icon links vom Titel, inkl. eigener Akzentfarbe. */
    icon?: ReactNode;
    /** Rechts ausgerichtet, z. B. der Favoriten-Button auf Detailseiten. */
    action?: ReactNode;
};

const PageHeader = ({ title, subtitle, icon, action }: Props) => {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    aria-label="Zurück"
                    className="card bg-surface p-2 cursor-pointer shrink-0"
                    onClick={() => navigate(-1)}
                >
                    <AiOutlineArrowLeft size={24} />
                </button>
                {icon && <span className="shrink-0">{icon}</span>}
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold wrap-break-words">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="font-sans text-ink-mute">{subtitle}</p>
                    )}
                </div>
            </div>
            {action}
        </div>
    );
};

export default PageHeader;
