import { MdOutlineDirections } from 'react-icons/md';
import { directionsUrl } from '../utils/directions';

interface RouteLinkProps {
    coordinates: [number, number];
    title: string;
    className?: string;
}

const RouteLink = ({ coordinates, title, className }: RouteLinkProps) => (
    <a
        href={directionsUrl(coordinates[1], coordinates[0])}
        target="_blank"
        rel="noreferrer"
        aria-label={`Route nach ${title} — öffnet die Karten-App`}
        className={
            className ??
            'btn-secondary inline-flex items-center gap-2 self-start'
        }
    >
        <MdOutlineDirections size={20} aria-hidden />
        Route
    </a>
);

export default RouteLink;
