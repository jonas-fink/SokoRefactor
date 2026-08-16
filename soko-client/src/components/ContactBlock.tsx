import {
    AiOutlineEnvironment,
    AiOutlineMail,
    AiOutlinePhone,
} from 'react-icons/ai';
import type { Contactable, PreferredContact } from '../types';

/**
 * Kontaktwege eines Angebots. Der vom Träger gewünschte Weg steht **zuerst**
 * und sagt das auch — eine Stelle, die Termine nur per Mail vergibt, bekommt
 * sonst Anrufe, die niemand annimmt.
 *
 * Ohne `preferredContact` bleibt die Reihenfolge Telefon → E-Mail → Adresse.
 */
const ORDER: PreferredContact[] = ['phone', 'email', 'address'];

const LABELS: Record<PreferredContact, string> = {
    phone: 'Telefon',
    email: 'E-Mail',
    address: 'Vor Ort',
};

const ContactBlock = ({ contact }: { contact: Contactable }) => {
    const { preferredContact } = contact;
    const ways = ORDER.filter((key) => contact[key]).sort(
        (a, b) =>
            Number(b === preferredContact) - Number(a === preferredContact),
    );

    if (ways.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            {preferredContact && contact[preferredContact] && (
                <p className="text-ink-mute text-sm">
                    Am besten erreichbar per {LABELS[preferredContact]}.
                </p>
            )}
            <div className="flex flex-col gap-3 md:flex-row md:gap-6">
                {ways.map((key) => {
                    const value = contact[key] as string;
                    if (key === 'address') {
                        return (
                            <p key={key} className="flex items-center gap-3">
                                <AiOutlineEnvironment size={20} />
                                <span className="text-ink-soft">{value}</span>
                            </p>
                        );
                    }
                    return (
                        <a
                            key={key}
                            href={
                                key === 'phone'
                                    ? `tel:${value}`
                                    : `mailto:${value}`
                            }
                            className="flex items-center gap-3 underline"
                        >
                            {key === 'phone' ? (
                                <AiOutlinePhone size={20} />
                            ) : (
                                <AiOutlineMail size={20} />
                            )}
                            <span>{value}</span>
                        </a>
                    );
                })}
            </div>
        </div>
    );
};

export default ContactBlock;
