import { z } from 'zod';

const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

// "" / "" = an dem Tag geschlossen
const dayHoursSchema = z
    .object({ open: z.string(), close: z.string() })
    .refine((d) => !d.open === !d.close, {
        message: 'Öffnungs- und Schließzeit angeben',
    })
    .refine(
        (d) => !d.open || !d.close || toMinutes(d.close) > toMinutes(d.open),
        {
            message: 'Schließzeit muss nach der Öffnungszeit liegen',
        },
    );

const openingHoursSchema = z.object({
    monday: dayHoursSchema,
    tuesday: dayHoursSchema,
    wednesday: dayHoursSchema,
    thursday: dayHoursSchema,
    friday: dayHoursSchema,
    saturday: dayHoursSchema,
    sunday: dayHoursSchema,
});

export const beratungFormSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, 'Titel wird benötigt')
        .max(100, 'Titel kann nicht länger als 100 Zeichen lang sein.'),
    description: z.string().trim().min(1, 'Beschreibung wird benötigt'),
    openingHours: openingHoursSchema,
    lng: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
    tags: z.string().optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    /** komma-getrennte Anwendungsfälle, wie `tags` — Dokumente kommen per Upload dazu. */
    services: z.string().optional(),
});

// "a, b, ,c" -> ['a','b','c']
export const splitList = (value?: string) =>
    value
        ?.split(',')
        .map((v) => v.trim())
        .filter(Boolean) ?? [];

export type BeratungFormData = z.infer<typeof beratungFormSchema>;
export type Weekday = keyof BeratungFormData['openingHours'];

export const WEEKDAYS: { key: Weekday; label: string }[] = [
    { key: 'monday', label: 'Montag' },
    { key: 'tuesday', label: 'Dienstag' },
    { key: 'wednesday', label: 'Mittwoch' },
    { key: 'thursday', label: 'Donnerstag' },
    { key: 'friday', label: 'Freitag' },
    { key: 'saturday', label: 'Samstag' },
    { key: 'sunday', label: 'Sonntag' },
];

export const emptyOpeningHours = Object.fromEntries(
    WEEKDAYS.map(({ key }) => [key, { open: '', close: '' }]),
) as BeratungFormData['openingHours'];

// 540 -> "09:00" (Umkehrung von toMinutes, fürs Anzeigen)
export const fromMinutes = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(
        minutes % 60,
    ).padStart(2, '0')}`;

// "09:00" -> [{ open: 540, close: 1080 }], leer -> [] (geschlossen)
export const toBusinessHours = (hours: BeratungFormData['openingHours']) =>
    Object.fromEntries(
        WEEKDAYS.map(({ key }) => {
            const { open, close } = hours[key];
            return [
                key,
                open && close
                    ? [{ open: toMinutes(open), close: toMinutes(close) }]
                    : [],
            ];
        }),
    ) as Record<Weekday, { open: number; close: number }[]>;
