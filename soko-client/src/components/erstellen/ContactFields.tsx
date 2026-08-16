import { useFormContext } from 'react-hook-form';
import { CONTACT_OPTIONS } from '../../schemas/contactSchema';

/**
 * Kontaktblock für `ActivityForm` und `BeratungsForm`. Beide Schemas tragen
 * dieselben vier Feldnamen (`schemas/contactSchema.ts`), deshalb reicht hier
 * dieses Minimal-Shape statt einer Generik über das jeweilige Formular — der
 * Zugriff läuft über `useFormContext`, die Formulare wickeln sich dafür in
 * `FormProvider`.
 */
type ContactForm = {
    phone?: string;
    email?: string;
    address?: string;
    preferredContact?: string;
};

type Props = {
    /** Die Adresse geokodiert das Formular selbst — es reicht sie hier durch. */
    addressSlot: React.ReactNode;
};

const ContactFields = ({ addressSlot }: Props) => {
    const {
        register,
        watch,
        formState: { errors },
    } = useFormContext<ContactForm>();

    const [phone, email, address] = watch(['phone', 'email', 'address']);
    const filled: Record<string, string | undefined> = {
        phone,
        email,
        address,
    };

    return (
        <fieldset className="flex flex-col gap-4">
            <legend className="label">KONTAKT</legend>

            <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="label">
                    TELEFON
                </label>
                <input
                    type="tel"
                    id="phone"
                    autoComplete="tel"
                    placeholder="z.B. 0561 787-0"
                    {...register('phone')}
                    className="field"
                />
                {errors.phone && (
                    <p className="text-error text-xs">{errors.phone.message}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="label">
                    E-MAIL
                </label>
                <input
                    type="email"
                    id="email"
                    autoComplete="email"
                    placeholder="z.B. beratung@traeger.de"
                    {...register('email')}
                    className="field"
                />
                {errors.email && (
                    <p className="text-error text-xs">{errors.email.message}</p>
                )}
            </div>

            {addressSlot}

            <fieldset className="flex flex-col gap-2">
                <legend className="label">BEVORZUGTER KONTAKTWEG</legend>
                <div className="flex flex-wrap gap-2">
                    {CONTACT_OPTIONS.map(({ key, label }) => (
                        // Native Radios statt ChipGroup: das ist eine Einfach-
                        // auswahl, und Tastatur plus Screenreader kommen damit
                        // gratis. Die Chip-Optik liegt auf dem <span>.
                        <label key={key} className="cursor-pointer">
                            <input
                                type="radio"
                                value={key}
                                // Ein Weg ohne hinterlegte Angabe ist nicht
                                // waehlbar — sonst laeuft der Nutzer in den
                                // Refine statt ihn gar nicht erst zu treffen.
                                disabled={!filled[key]}
                                {...register('preferredContact')}
                                className="peer sr-only"
                            />
                            <span className="chip peer-checked:bg-primary peer-checked:text-primary-ink peer-disabled:opacity-40 peer-focus-visible:ring-primary/40 peer-focus-visible:ring-2">
                                {label}
                            </span>
                        </label>
                    ))}
                </div>
                {errors.preferredContact && (
                    <p className="text-error text-xs">
                        {errors.preferredContact.message}
                    </p>
                )}
                <p className="text-ink-mute text-xs">
                    Alle Angaben sind freiwillig und öffentlich sichtbar.
                </p>
            </fieldset>
        </fieldset>
    );
};

export default ContactFields;
