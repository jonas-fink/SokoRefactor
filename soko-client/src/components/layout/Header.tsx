import { Link } from 'react-router';
import LanguageFilter from '../LanguageFilter';
import icon from '../../assets/ksoko-icon-gruen.svg';

const Header = () => (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/85 px-4 py-2 backdrop-blur-xl md:hidden">
        <Link to="/" className="flex items-center">
            <img
                src={icon}
                width={32}
                height={32}
                alt="KSoKo — zur Startseite"
            />
        </Link>
        <LanguageFilter />
    </header>
);

export default Header;
