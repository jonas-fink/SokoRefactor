/** ISO-Datum → „06. August 2026"; ohne Datum steht „Termin offen". */
export const formatDate = (iso?: string | null) =>
    iso
        ? new Date(iso).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : 'Termin offen';
