import { NavLink } from 'react-router';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import type { ItemType } from '../types';

interface OfferCardProps {
    itemType: ItemType;
    id: string;
    title: string;
    description?: string;
    image?: string;
    category?: string;
    dateLabel?: string;
    locationLabel?: string;
    /** Externe Quelle (Scraped-Events) — als Zusatzlink unter der Karte. */
    href?: string;
    isFavorite?: boolean;
    /** Nur gesetzt, wenn ein Nutzer eingeloggt ist — sonst kein Herz. */
    onToggleFavorite?: () => void;
}

const OfferCard = ({
    itemType,
    id,
    title,
    description,
    image,
    category,
    dateLabel,
    locationLabel,
    href,
    isFavorite,
    onToggleFavorite,
}: OfferCardProps) => (
    <div className="card relative flex snap-start flex-col transition-transform hover:-translate-y-0.5">
        {onToggleFavorite && (
            <button
                type="button"
                aria-label={
                    isFavorite ? 'Aus Sammlung entfernen' : 'Zur Sammlung'
                }
                aria-pressed={isFavorite}
                className="absolute right-3 top-3 z-10 cursor-pointer rounded-chip bg-surface p-2 text-error shadow-card"
                onClick={onToggleFavorite}
            >
                {isFavorite ? (
                    <AiFillHeart size={18} />
                ) : (
                    <AiOutlineHeart size={18} />
                )}
            </button>
        )}

        <NavLink to={`/angebot/${itemType}/${id}`} className="block p-5">
            {image && (
                <img
                    src={image}
                    alt=""
                    className="mb-3 h-36 w-full rounded-control object-cover"
                />
            )}
            {category && <span className="chip mb-3">{category}</span>}
            <h4 className="text-lg">{title}</h4>
            {description && (
                <p className="mt-2 line-clamp-3 text-sm text-ink-soft">
                    {description}
                </p>
            )}
            {(dateLabel || locationLabel) && (
                <p className="mt-3 text-sm text-ink-mute">
                    {dateLabel}
                    {locationLabel &&
                        `${dateLabel ? ' · ' : ''}${locationLabel}`}
                </p>
            )}
        </NavLink>

        {href && (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="px-5 pb-4 text-sm text-ink-mute underline"
            >
                Zur Quelle
            </a>
        )}
    </div>
);

export default OfferCard;
