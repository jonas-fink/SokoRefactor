/** Anzahl Tage im Monat (`month` 0-basiert, wie bei `Date`). */
export const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

/** Leere Zellen vor dem Ersten — Montag = 0. */
export const firstWeekdayOffset = (year: number, month: number) =>
    (new Date(year, month, 1).getDay() + 6) % 7;

export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const monthLabel = (year: number, month: number) =>
    new Date(year, month, 1).toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
    });
