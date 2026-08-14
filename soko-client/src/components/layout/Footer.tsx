import { Link, useLocation } from 'react-router';

// Pflichtlinks, § 5 DDG: „staendig verfuegbar“. Der Datenschutz-Link in der
// SideBar ist erst ab md sichtbar — auf dem Handy gaebe es sonst keinen Weg.
// Hier gehoert nichts hin ausser Recht und Kontakt.
const Footer = () => {
    const { pathname } = useLocation();

    return (
        <footer className="mt-12 border-t border-line px-4 py-6 md:px-8">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-mute">
                <Link to="/impressum" className="hover:text-ink">
                    Impressum
                </Link>
                <Link to="/datenschutz" className="hover:text-ink">
                    Datenschutz
                </Link>
                {/* `from` landet als `path` am Feedback — sagt, worueber jemand
                    gestolpert ist, ohne ihn danach zu fragen. */}
                <Link
                    to="/kontakt"
                    state={{ from: pathname }}
                    className="hover:text-ink"
                >
                    Kontakt
                </Link>
            </nav>
        </footer>
    );
};

export default Footer;
