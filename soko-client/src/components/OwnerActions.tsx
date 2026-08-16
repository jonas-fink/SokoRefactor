import { useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import { api } from '../utils/api';

type Props = {
    /** Route des Bearbeiten-Formulars. */
    editTo: string;
    /** API-Pfad für den DELETE, z. B. `/beratungen/abc123`. */
    deletePath: string;
    /** Wohin nach dem Löschen. */
    redirectTo: string;
};

/**
 * Bearbeiten und Löschen für Admins bzw. den Eigentümer. Die Bestätigung läuft
 * über ein natives `<dialog>` (`KONVENTIONEN.md` § Client) — Fokusfalle,
 * Backdrop und Esc kommen damit vom Browser.
 */
const OwnerActions = ({ editTo, deletePath, redirectTo }: Props) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const confirmDelete = async () => {
        setBusy(true);
        setError('');
        try {
            await api.delete(deletePath);
            dialogRef.current?.close();
            navigate(redirectTo, { replace: true });
        } catch (e) {
            setError(
                e instanceof Error ? e.message : 'Konnte nicht gelöscht werden',
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex shrink-0 gap-2">
            <NavLink
                to={editTo}
                className="btn-secondary"
                aria-label="Bearbeiten"
            >
                <AiOutlineEdit size={20} />
            </NavLink>
            <button
                type="button"
                aria-label="Löschen"
                className="btn-secondary text-error cursor-pointer"
                onClick={() => dialogRef.current?.showModal()}
            >
                <AiOutlineDelete size={20} />
            </button>

            <dialog
                ref={dialogRef}
                className="card m-auto w-[min(28rem,92vw)] p-6 backdrop:bg-ink/50"
            >
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold">Wirklich löschen?</h2>
                    <p className="text-ink-soft">
                        Der Eintrag verschwindet dauerhaft, samt hinterlegter
                        Dokumente. Das lässt sich nicht rückgängig machen.
                    </p>
                    {error && <p className="text-error text-sm">{error}</p>}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            className="btn-secondary cursor-pointer"
                            onClick={() => dialogRef.current?.close()}
                        >
                            Abbrechen
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            className="btn-primary cursor-pointer"
                            onClick={confirmDelete}
                        >
                            {busy ? 'Wird gelöscht …' : 'Löschen'}
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default OwnerActions;
