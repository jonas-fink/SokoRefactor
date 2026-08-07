type Props = {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
};

const Pagination = ({ page, totalPages, onChange }: Props) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-4">
            <button
                className="btn-secondary disabled:opacity-40 cursor-pointer"
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
            >
                Zurück
            </button>
            <span className="text-sm text-ink-mute">
                Seite {page} von {totalPages}
            </span>
            <button
                className="btn-secondary disabled:opacity-40 cursor-pointer"
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
            >
                Weiter
            </button>
        </div>
    );
};

export default Pagination;
