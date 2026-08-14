import { useState, type ComponentProps } from 'react';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';

type Props = ComponentProps<'input'> & { label: string };

/**
 * Passwortfeld mit Anzeigen-Umschalter. WCAG 2.2 SC 3.3.8: „merk dir dein
 * Passwort" ist ein kognitiver Test — erlaubt nur, solange eine Hilfe da ist.
 * Die Hilfe sind der Passwortmanager (autocomplete am Aufrufer) und dieser
 * Umschalter. Deshalb hier auch **nie** onPaste blockieren.
 */
const PasswordField = ({ label, id, className = '', ...rest }: Props) => {
    const [shown, setShown] = useState(false);

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="label text-md">
                {label}
            </label>
            <div className="relative">
                <input
                    {...rest}
                    id={id}
                    type={shown ? 'text' : 'password'}
                    className={`field w-full pr-12 ${className}`}
                />
                <button
                    type="button"
                    onClick={() => setShown(!shown)}
                    aria-pressed={shown}
                    aria-label="Passwort anzeigen"
                    className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center text-ink-mute hover:text-ink"
                >
                    {shown ? (
                        <MdOutlineVisibilityOff size={20} />
                    ) : (
                        <MdOutlineVisibility size={20} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default PasswordField;
